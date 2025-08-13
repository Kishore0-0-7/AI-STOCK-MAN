const { executeQuery } = require("../config/db");

const purchaseOrdersController = {
  // Get all purchase orders
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const status = req.query.status || "";

      let whereClause = "WHERE 1=1";
      let params = [];

      if (status) {
        whereClause += " AND po.status = ?";
        params.push(status);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM purchase_orders po ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get purchase orders with supplier info
      const ordersQuery = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.email as supplier_email,
          COUNT(poi.id) as item_count
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        ${whereClause}
        GROUP BY po.id
        ORDER BY po.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const orders = await executeQuery(ordersQuery, [
        ...params,
        limit,
        offset,
      ]);

      res.json({
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: `PO-${String(order.id).padStart(6, "0")}`,
          supplier_id: order.supplier_id,
          supplier: {
            id: order.supplier_id,
            name: order.supplier_name,
            email: order.supplier_email,
          },
          supplier_name: order.supplier_name,
          status: order.status,
          totalAmount: parseFloat(order.total_amount || 0),
          total_amount: parseFloat(order.total_amount || 0),
          itemCount: order.item_count,
          expectedDeliveryDate: order.expected_delivery_date,
          orderDate: order.created_at
            ? order.created_at.toISOString().split("T")[0]
            : null,
          notes: order.notes,
          created_at: order.created_at,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  },

  // Get single purchase order with items
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get purchase order details
      const orderQuery = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.contact_person as supplier_contact,
          s.email as supplier_email,
          s.phone as supplier_phone,
          s.address as supplier_address
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
      `;

      const orderResult = await executeQuery(orderQuery, [id]);

      if (orderResult.length === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      const order = orderResult[0];

      // Get order items
      const itemsQuery = `
        SELECT 
          poi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.category as product_category
        FROM purchase_order_items poi
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE poi.purchase_order_id = ?
        ORDER BY p.name ASC
      `;

      const items = await executeQuery(itemsQuery, [id]);

      res.json({
        id: order.id,
        orderNumber: `PO-${String(order.id).padStart(6, "0")}`,
        supplier: {
          id: order.supplier_id,
          name: order.supplier_name,
          contact: order.supplier_contact,
          email: order.supplier_email,
          phone: order.supplier_phone,
          address: order.supplier_address,
        },
        status: order.status,
        totalAmount: parseFloat(order.total_amount || 0),
        expectedDate: order.expected_delivery_date,
        deliveryDate: order.delivery_date,
        notes: order.notes,
        items: items.map((item) => ({
          id: item.id,
          product: {
            id: item.product_id,
            name: item.product_name,
            sku: item.product_sku,
            category: item.product_category,
          },
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price || 0),
          totalPrice: parseFloat(item.total_price || 0),
          receivedQuantity: item.received_quantity || 0,
          notes: item.notes,
        })),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      });
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ error: "Failed to fetch purchase order" });
    }
  },

  // Create new purchase order
  create: async (req, res) => {
    try {
      const { supplierId, expectedDate, notes, items } = req.body;

      // Validate required fields
      if (
        !supplierId ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Supplier ID and items are required" });
      }

      // Validate supplier exists
      const supplier = await executeQuery(
        "SELECT id, name FROM suppliers WHERE id = ?",
        [supplierId]
      );
      if (supplier.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Calculate total amount
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return res.status(400).json({
            error: "Each item must have productId, quantity, and unitPrice",
          });
        }

        // Validate product exists
        const product = await executeQuery(
          "SELECT id, name FROM products WHERE id = ?",
          [item.productId]
        );
        if (product.length === 0) {
          return res
            .status(400)
            .json({ error: `Product with ID ${item.productId} not found` });
        }

        const quantity = parseInt(item.quantity);
        const unitPrice = parseFloat(item.unitPrice);
        const totalPrice = quantity * unitPrice;

        totalAmount += totalPrice;

        validatedItems.push({
          productId: item.productId,
          quantity,
          unitPrice,
          totalPrice,
          notes: item.notes || null,
        });
      }

      // Generate order number
      const orderNumber = `PO-${Date.now()}-${String(
        Math.floor(Math.random() * 1000)
      ).padStart(3, "0")}`;

      // Create purchase order
      const orderQuery = `
        INSERT INTO purchase_orders (supplier_id, order_number, order_date, status, total_amount, expected_delivery_date, notes)
        VALUES (?, ?, NOW(), 'pending', ?, ?, ?)
      `;

      const insertOrderResult = await executeQuery(orderQuery, [
        supplierId,
        orderNumber,
        totalAmount,
        expectedDate,
        notes,
      ]);
      const orderId = insertOrderResult.insertId;

      // Create order items
      for (const item of validatedItems) {
        await executeQuery(
          `
          INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            orderId,
            item.productId,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
          ]
        );
      }

      // Fetch and return the created order
      const createdOrderQuery = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.email as supplier_email
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
      `;

      const createdOrderResult = await executeQuery(createdOrderQuery, [
        orderId,
      ]);
      const order = createdOrderResult[0];

      // Get order items
      const itemsQuery = `
        SELECT 
          poi.*,
          p.name as product_name,
          p.sku as product_sku
        FROM purchase_order_items poi
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE poi.purchase_order_id = ?
      `;

      const orderItems = await executeQuery(itemsQuery, [orderId]);

      res.status(201).json({
        message: "Purchase order created successfully",
        order: {
          id: order.id,
          orderNumber: order.order_number,
          supplier: {
            id: order.supplier_id,
            name: order.supplier_name,
            email: order.supplier_email,
          },
          status: order.status,
          totalAmount: parseFloat(order.total_amount || 0),
          expectedDate: order.expected_delivery_date,
          notes: order.notes,
          items: orderItems.map((item) => ({
            id: item.id,
            product: {
              id: item.product_id,
              name: item.product_name,
              sku: item.product_sku,
            },
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price || 0),
            totalPrice: parseFloat(item.total_price || 0),
            notes: item.notes,
          })),
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        },
      });
    } catch (error) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  },

  // Update purchase order status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, deliveryDate, notes } = req.body;

      const validStatuses = [
        "draft",
        "pending",
        "approved",
        "shipped",
        "received",
        "completed",
        "cancelled",
      ];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Valid status is required",
          validStatuses,
        });
      }

      // Check if order exists
      const existingOrder = await executeQuery(
        "SELECT id, status FROM purchase_orders WHERE id = ?",
        [id]
      );
      if (existingOrder.length === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      let updateQuery =
        "UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP";
      let params = [status];

      if (deliveryDate) {
        updateQuery += ", delivery_date = ?";
        params.push(deliveryDate);
      }

      if (notes !== undefined) {
        updateQuery += ", notes = ?";
        params.push(notes);
      }

      updateQuery += " WHERE id = ?";
      params.push(id);

      await executeQuery(updateQuery, params);

      res.json({
        message: "Purchase order status updated successfully",
        orderId: parseInt(id),
        newStatus: status,
        deliveryDate,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating purchase order status:", error);
      res.status(500).json({ error: "Failed to update purchase order status" });
    }
  },

  // Receive items (update received quantities)
  receiveItems: async (req, res) => {
    try {
      const { id } = req.params;
      const { items } = req.body; // Array of { itemId, receivedQuantity }

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Items array is required" });
      }

      // Check if order exists
      const order = await executeQuery(
        "SELECT id, status FROM purchase_orders WHERE id = ?",
        [id]
      );
      if (order.length === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Update received quantities for each item
      for (const item of items) {
        if (!item.itemId || item.receivedQuantity == null) {
          continue; // Skip invalid items
        }

        // Get the order item details
        const orderItem = await executeQuery(
          `
          SELECT poi.*, p.id as product_id
          FROM purchase_order_items poi
          LEFT JOIN products p ON poi.product_id = p.id
          WHERE poi.id = ? AND poi.purchase_order_id = ?
        `,
          [item.itemId, id]
        );

        if (orderItem.length === 0) {
          continue; // Skip items not found
        }

        const receivedQty = parseInt(item.receivedQuantity);

        // Update received quantity
        await executeQuery(
          `
          UPDATE purchase_order_items 
          SET received_quantity = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
          [receivedQty, item.itemId]
        );

        // Update product stock if receiving items
        if (receivedQty > 0) {
          await executeQuery(
            `
            UPDATE products 
            SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
            [receivedQty, orderItem[0].product_id]
          );
        }
      }

      // Check if all items are fully received and update order status
      const remainingItems = await executeQuery(
        `
        SELECT COUNT(*) as count
        FROM purchase_order_items
        WHERE purchase_order_id = ? 
        AND (received_quantity IS NULL OR received_quantity < quantity)
      `,
        [id]
      );

      if (remainingItems[0].count === 0) {
        // All items received, mark as delivered
        await executeQuery(
          `
          UPDATE purchase_orders 
          SET status = 'delivered', delivery_date = CURDATE(), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
          [id]
        );
      }

      res.json({
        message: "Items received successfully",
        orderId: parseInt(id),
        itemsUpdated: items.length,
        fullyReceived: remainingItems[0].count === 0,
      });
    } catch (error) {
      console.error("Error receiving items:", error);
      res.status(500).json({ error: "Failed to receive items" });
    }
  },

  // Get purchase order statistics
  getStats: async (req, res) => {
    try {
      const period = req.query.period || "30"; // days

      const queries = {
        total: `SELECT COUNT(*) as count FROM purchase_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
        pending: `SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending' AND created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
        completed: `SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ('delivered', 'completed') AND created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
        totalValue: `SELECT COALESCE(SUM(total_amount), 0) as value FROM purchase_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
      };

      const [total, pending, completed, totalValue] = await Promise.all([
        executeQuery(queries.total),
        executeQuery(queries.pending),
        executeQuery(queries.completed),
        executeQuery(queries.totalValue),
      ]);

      // Get top suppliers
      const topSuppliers = await executeQuery(`
        SELECT 
          s.name,
          COUNT(po.id) as order_count,
          COALESCE(SUM(po.total_amount), 0) as total_value
        FROM suppliers s
        JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE po.created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)
        GROUP BY s.id, s.name
        ORDER BY total_value DESC
        LIMIT 5
      `);

      res.json({
        period: `${period} days`,
        summary: {
          totalOrders: total[0].count,
          pendingOrders: pending[0].count,
          completedOrders: completed[0].count,
          totalValue: parseFloat(totalValue[0].value || 0),
          completionRate:
            total[0].count > 0
              ? ((completed[0].count / total[0].count) * 100).toFixed(1)
              : 0,
        },
        topSuppliers: topSuppliers.map((supplier) => ({
          name: supplier.name,
          orderCount: supplier.order_count,
          totalValue: parseFloat(supplier.total_value || 0),
        })),
      });
    } catch (error) {
      console.error("Error fetching purchase order stats:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch purchase order statistics" });
    }
  },

  // Delete purchase order (only if pending)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if order exists and status
      const order = await executeQuery(
        "SELECT id, status FROM purchase_orders WHERE id = ?",
        [id]
      );
      if (order.length === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      if (order[0].status !== "pending") {
        return res.status(400).json({
          error: "Can only delete pending purchase orders",
          currentStatus: order[0].status,
        });
      }

      // Delete order items first (foreign key constraint)
      await executeQuery(
        "DELETE FROM purchase_order_items WHERE purchase_order_id = ?",
        [id]
      );

      // Delete purchase order
      await executeQuery("DELETE FROM purchase_orders WHERE id = ?", [id]);

      res.json({ message: "Purchase order deleted successfully" });
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      res.status(500).json({ error: "Failed to delete purchase order" });
    }
  },
};

module.exports = purchaseOrdersController;
