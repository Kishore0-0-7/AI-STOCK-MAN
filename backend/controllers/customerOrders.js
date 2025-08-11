const { executeQuery } = require("../config/db");

const customerOrdersController = {
  // Get all customer orders with pagination and filtering
  getAll: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status = "",
        customer_id = "",
        start_date = "",
        end_date = "",
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // Build WHERE conditions
      if (search) {
        whereConditions.push(
          "(co.order_number LIKE ? OR c.name LIKE ? OR c.email LIKE ?)"
        );
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (status) {
        whereConditions.push("co.status = ?");
        queryParams.push(status);
      }

      if (customer_id) {
        whereConditions.push("co.customer_id = ?");
        queryParams.push(customer_id);
      }

      if (start_date) {
        whereConditions.push("DATE(co.order_date) >= ?");
        queryParams.push(start_date);
      }

      if (end_date) {
        whereConditions.push("DATE(co.order_date) <= ?");
        queryParams.push(end_date);
      }

      const whereClause =
        whereConditions.length > 0
          ? "WHERE " + whereConditions.join(" AND ")
          : "";

      // Get orders with customer details
      const ordersQuery = `
        SELECT 
          co.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address,
          COUNT(coi.id) as items_count,
          COALESCE(SUM(coi.quantity * coi.unit_price), 0) as calculated_total
        FROM customer_orders co
        LEFT JOIN customers c ON co.customer_id = c.id
        LEFT JOIN customer_order_items coi ON co.id = coi.order_id
        ${whereClause}
        GROUP BY co.id
        ORDER BY co.created_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(parseInt(limit), parseInt(offset));
      const orders = await executeQuery(ordersQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT co.id) as total
        FROM customer_orders co
        LEFT JOIN customers c ON co.customer_id = c.id
        ${whereClause}
      `;

      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const totalResult = await executeQuery(countQuery, countParams);
      const total = totalResult[0].total;

      res.json({
        orders: orders.map((order) => ({
          ...order,
          order_date: order.order_date
            ? order.order_date.toISOString().split("T")[0]
            : null,
          delivery_date: order.delivery_date
            ? order.delivery_date.toISOString().split("T")[0]
            : null,
          created_at: order.created_at ? order.created_at.toISOString() : null,
          updated_at: order.updated_at ? order.updated_at.toISOString() : null,
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          per_page: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ error: "Failed to fetch customer orders" });
    }
  },

  // Get single customer order with items
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get order details
      const orderQuery = `
        SELECT 
          co.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address
        FROM customer_orders co
        LEFT JOIN customers c ON co.customer_id = c.id
        WHERE co.id = ?
      `;

      const orders = await executeQuery(orderQuery, [id]);

      if (orders.length === 0) {
        return res.status(404).json({ error: "Customer order not found" });
      }

      const order = orders[0];

      // Get order items
      const itemsQuery = `
        SELECT 
          coi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.category as product_category,
          p.stock_quantity as available_stock
        FROM customer_order_items coi
        LEFT JOIN products p ON coi.product_id = p.id
        WHERE coi.order_id = ?
        ORDER BY coi.created_at ASC
      `;

      const items = await executeQuery(itemsQuery, [id]);

      res.json({
        ...order,
        order_date: order.order_date
          ? order.order_date.toISOString().split("T")[0]
          : null,
        delivery_date: order.delivery_date
          ? order.delivery_date.toISOString().split("T")[0]
          : null,
        created_at: order.created_at ? order.created_at.toISOString() : null,
        updated_at: order.updated_at ? order.updated_at.toISOString() : null,
        items: items.map((item) => ({
          ...item,
          created_at: item.created_at ? item.created_at.toISOString() : null,
        })),
      });
    } catch (error) {
      console.error("Error fetching customer order:", error);
      res.status(500).json({ error: "Failed to fetch customer order" });
    }
  },

  // Create new customer order
  create: async (req, res) => {
    try {
      const {
        customer_id,
        order_date,
        delivery_date,
        status = "pending",
        payment_method = "cash",
        payment_status = "pending",
        notes,
        items = [],
      } = req.body;

      if (!customer_id) {
        return res.status(400).json({ error: "Customer ID is required" });
      }

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Order items are required" });
      }

      // Generate order number
      const orderNumberQuery =
        "SELECT COUNT(*) + 1 as next_number FROM customer_orders";
      const orderNumberResult = await executeQuery(orderNumberQuery);
      const orderNumber = `CO${String(
        orderNumberResult[0].next_number
      ).padStart(6, "0")}`;

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }

      // Create order
      const orderQuery = `
        INSERT INTO customer_orders (
          order_number, customer_id, order_date, delivery_date, 
          status, total_amount, payment_method, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const orderResult = await executeQuery(orderQuery, [
        orderNumber,
        customer_id,
        order_date || new Date(),
        delivery_date,
        status,
        totalAmount,
        payment_method,
        payment_status,
        notes,
      ]);

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of items) {
        const itemQuery = `
          INSERT INTO customer_order_items (
            order_id, product_id, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `;

        const subtotal = item.quantity * item.unit_price;
        await executeQuery(itemQuery, [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          subtotal,
        ]);

        // Update product stock if order is confirmed
        if (status === "confirmed" || status === "processing") {
          await executeQuery(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
            [item.quantity, item.product_id]
          );
        }
      }

      // Return created order
      const createdOrder = await customerOrdersController.getById(
        { params: { id: orderId } },
        { json: (data) => data }
      );

      res.status(201).json(createdOrder);
    } catch (error) {
      console.error("Error creating customer order:", error);
      res.status(500).json({ error: "Failed to create customer order" });
    }
  },

  // Update customer order
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if order exists
      const existingOrder = await executeQuery(
        "SELECT * FROM customer_orders WHERE id = ?",
        [id]
      );

      if (existingOrder.length === 0) {
        return res.status(404).json({ error: "Customer order not found" });
      }

      const currentOrder = existingOrder[0];

      // Build update query
      const allowedFields = [
        "customer_id",
        "order_date",
        "delivery_date",
        "status",
        "total_amount",
        "payment_method",
        "payment_status",
        "notes",
      ];

      const updateFields = [];
      const updateValues = [];

      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      updateValues.push(id);

      const updateQuery = `
        UPDATE customer_orders 
        SET ${updateFields.join(", ")}, updated_at = NOW()
        WHERE id = ?
      `;

      await executeQuery(updateQuery, updateValues);

      // Handle stock adjustments for status changes
      if (updateData.status && updateData.status !== currentOrder.status) {
        const items = await executeQuery(
          "SELECT product_id, quantity FROM customer_order_items WHERE order_id = ?",
          [id]
        );

        // Restore stock if order was cancelled/rejected from a confirmed state
        if (
          (currentOrder.status === "confirmed" ||
            currentOrder.status === "processing") &&
          (updateData.status === "cancelled" ||
            updateData.status === "rejected")
        ) {
          for (const item of items) {
            await executeQuery(
              "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
              [item.quantity, item.product_id]
            );
          }
        }

        // Reduce stock if order was confirmed from pending state
        if (
          currentOrder.status === "pending" &&
          (updateData.status === "confirmed" ||
            updateData.status === "processing")
        ) {
          for (const item of items) {
            await executeQuery(
              "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
              [item.quantity, item.product_id]
            );
          }
        }
      }

      // Get and return updated order
      const orderQuery = `
        SELECT 
          co.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address
        FROM customer_orders co
        LEFT JOIN customers c ON co.customer_id = c.id
        WHERE co.id = ?
      `;

      const updatedOrders = await executeQuery(orderQuery, [id]);
      const updatedOrder = updatedOrders[0];

      // Get order items
      const itemsQuery = `
        SELECT 
          coi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.category as product_category,
          p.stock_quantity as available_stock
        FROM customer_order_items coi
        LEFT JOIN products p ON coi.product_id = p.id
        WHERE coi.order_id = ?
        ORDER BY coi.created_at ASC
      `;

      const items = await executeQuery(itemsQuery, [id]);

      res.json({
        ...updatedOrder,
        order_date: updatedOrder.order_date
          ? updatedOrder.order_date.toISOString().split("T")[0]
          : null,
        delivery_date: updatedOrder.delivery_date
          ? updatedOrder.delivery_date.toISOString().split("T")[0]
          : null,
        created_at: updatedOrder.created_at
          ? updatedOrder.created_at.toISOString()
          : null,
        updated_at: updatedOrder.updated_at
          ? updatedOrder.updated_at.toISOString()
          : null,
        items: items.map((item) => ({
          ...item,
          created_at: item.created_at ? item.created_at.toISOString() : null,
        })),
      });
    } catch (error) {
      console.error("Error updating customer order:", error);
      res.status(500).json({ error: "Failed to update customer order" });
    }
  },

  // Delete customer order
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if order exists
      const existingOrder = await executeQuery(
        "SELECT * FROM customer_orders WHERE id = ?",
        [id]
      );

      if (existingOrder.length === 0) {
        return res.status(404).json({ error: "Customer order not found" });
      }

      const order = existingOrder[0];

      // Restore stock if order was confirmed
      if (order.status === "confirmed" || order.status === "processing") {
        const items = await executeQuery(
          "SELECT product_id, quantity FROM customer_order_items WHERE order_id = ?",
          [id]
        );

        for (const item of items) {
          await executeQuery(
            "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [item.quantity, item.product_id]
          );
        }
      }

      // Delete order items first (foreign key constraint)
      await executeQuery(
        "DELETE FROM customer_order_items WHERE order_id = ?",
        [id]
      );

      // Delete order
      await executeQuery("DELETE FROM customer_orders WHERE id = ?", [id]);

      res.json({ message: "Customer order deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer order:", error);
      res.status(500).json({ error: "Failed to delete customer order" });
    }
  },

  // Update order status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "rejected",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await customerOrdersController.update(
        { params: { id }, body: { status } },
        { json: (data) => data }
      );

      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },

  // Get order statistics
  getStats: async (req, res) => {
    try {
      const stats = await executeQuery(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
          COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as average_order_value
        FROM customer_orders
      `);

      res.json(stats[0]);
    } catch (error) {
      console.error("Error fetching order stats:", error);
      res.status(500).json({ error: "Failed to fetch order statistics" });
    }
  },
};

module.exports = customerOrdersController;
