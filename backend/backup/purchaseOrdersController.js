const { executeQuery } = require("../config/database");

const purchaseOrdersController = {
  // Get all purchase orders
  getAllPurchaseOrders: async (req, res) => {
    try {
      console.log("Fetching purchase orders...");

      // Simple query without complex joins for now
      const query = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.email as supplier_email
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.created_at DESC
        LIMIT 50
      `;

      console.log("Executing query:", query);
      const orders = await executeQuery(query, []);

      console.log("Found orders:", orders.length);

      res.json({
        success: true,
        data: orders.map((order) => ({
          id: order.id,
          supplier_id: order.supplier_id,
          supplier_name: order.supplier_name,
          status: order.status,
          order_date: order.order_date,
          expected_delivery: order.expected_delivery_date,
          total_amount: parseFloat(order.total_amount || 0),
          notes: order.notes,
          created_at: order.created_at,
        })),
      });
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  },

  // Get purchase order by ID
  getPurchaseOrderById: async (req, res) => {
    try {
      const orderId = req.params.id;

      const orderQuery = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone,
          s.address as supplier_address
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
      `;

      const [order] = await executeQuery(orderQuery, [orderId]);

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      const itemsQuery = `
        SELECT 
          poi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.category as product_category
        FROM purchase_order_items poi
        JOIN products p ON poi.product_id = p.id
        WHERE poi.purchase_order_id = ?
        ORDER BY poi.id
      `;

      const items = await executeQuery(itemsQuery, [orderId]);

      res.json({
        id: order.id,
        orderNumber: order.order_number,
        supplier: {
          id: order.supplier_id,
          name: order.supplier_name,
          email: order.supplier_email,
          phone: order.supplier_phone,
          address: order.supplier_address,
        },
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        expectedDeliveryDate: order.expected_delivery_date,
        status: order.status,
        totalAmount: parseFloat(order.total_amount),
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
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price),
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
  createPurchaseOrder: async (req, res) => {
    try {
      const {
        orderNumber,
        supplierId,
        orderDate,
        expectedDeliveryDate,
        items,
        notes,
      } = req.body;

      if (
        !orderNumber ||
        !supplierId ||
        !orderDate ||
        !items ||
        items.length === 0
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if order number already exists
      const [existingOrder] = await executeQuery(
        "SELECT id FROM purchase_orders WHERE order_number = ?",
        [orderNumber]
      );
      if (existingOrder) {
        return res.status(400).json({ error: "Order number already exists" });
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return res.status(400).json({ error: "Invalid item data" });
        }
        totalAmount += item.quantity * item.unitPrice;
      }

      // Insert purchase order
      const insertOrderQuery = `
        INSERT INTO purchase_orders (
          order_number, supplier_id, order_date, expected_delivery_date, 
          status, total_amount, notes
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `;

      const orderResult = await executeQuery(insertOrderQuery, [
        orderNumber,
        supplierId,
        orderDate,
        expectedDeliveryDate,
        totalAmount,
        notes || null,
      ]);

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of items) {
        const totalPrice = item.quantity * item.unitPrice;

        const insertItemQuery = `
          INSERT INTO purchase_order_items (
            purchase_order_id, product_id, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?)
        `;

        await executeQuery(insertItemQuery, [
          orderId,
          item.productId,
          item.quantity,
          item.unitPrice,
          totalPrice,
        ]);
      }

      res.status(201).json({
        success: true,
        message: "Purchase order created successfully",
        orderId: orderId,
        orderNumber: orderNumber,
      });
    } catch (error) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  },

  // Update purchase order
  updatePurchaseOrder: async (req, res) => {
    try {
      const orderId = req.params.id;
      const {
        orderNumber,
        supplierId,
        orderDate,
        expectedDeliveryDate,
        deliveryDate,
        items,
        notes,
      } = req.body;

      if (
        !orderNumber ||
        !supplierId ||
        !orderDate ||
        !items ||
        items.length === 0
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if order number exists for other orders
      const [existingOrder] = await executeQuery(
        "SELECT id FROM purchase_orders WHERE order_number = ? AND id != ?",
        [orderNumber, orderId]
      );
      if (existingOrder) {
        return res.status(400).json({ error: "Order number already exists" });
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return res.status(400).json({ error: "Invalid item data" });
        }
        totalAmount += item.quantity * item.unitPrice;
      }

      // Update purchase order
      const updateOrderQuery = `
        UPDATE purchase_orders SET
          order_number = ?, supplier_id = ?, order_date = ?, 
          expected_delivery_date = ?, delivery_date = ?, total_amount = ?, 
          notes = ?, updated_at = NOW()
        WHERE id = ?
      `;

      const result = await executeQuery(updateOrderQuery, [
        orderNumber,
        supplierId,
        orderDate,
        expectedDeliveryDate,
        deliveryDate,
        totalAmount,
        notes || null,
        orderId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Delete existing items
      await executeQuery(
        "DELETE FROM purchase_order_items WHERE purchase_order_id = ?",
        [orderId]
      );

      // Insert updated items
      for (const item of items) {
        const totalPrice = item.quantity * item.unitPrice;

        const insertItemQuery = `
          INSERT INTO purchase_order_items (
            purchase_order_id, product_id, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?)
        `;

        await executeQuery(insertItemQuery, [
          orderId,
          item.productId,
          item.quantity,
          item.unitPrice,
          totalPrice,
        ]);
      }

      res.json({
        success: true,
        message: "Purchase order updated successfully",
      });
    } catch (error) {
      console.error("Error updating purchase order:", error);
      res.status(500).json({ error: "Failed to update purchase order" });
    }
  },

  // Delete purchase order
  deletePurchaseOrder: async (req, res) => {
    try {
      const orderId = req.params.id;

      // Check if order can be deleted (only draft or cancelled orders)
      const [order] = await executeQuery(
        "SELECT status FROM purchase_orders WHERE id = ?",
        [orderId]
      );

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      if (!["draft", "cancelled"].includes(order.status)) {
        return res.status(400).json({
          error: "Only draft or cancelled orders can be deleted",
        });
      }

      const result = await executeQuery(
        "DELETE FROM purchase_orders WHERE id = ?",
        [orderId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      res.json({
        success: true,
        message: "Purchase order deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      res.status(500).json({ error: "Failed to delete purchase order" });
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status, deliveryDate } = req.body;

      const validStatuses = [
        "draft",
        "pending",
        "approved",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      let updateQuery =
        "UPDATE purchase_orders SET status = ?, updated_at = NOW()";
      let queryParams = [status];

      // If completing the order and delivery date provided
      if (status === "completed" && deliveryDate) {
        updateQuery += ", delivery_date = ?";
        queryParams.push(deliveryDate);
      }

      updateQuery += " WHERE id = ?";
      queryParams.push(orderId);

      const result = await executeQuery(updateQuery, queryParams);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // If order is completed, update product stock
      if (status === "completed") {
        const itemsQuery = `
          SELECT poi.product_id, poi.quantity, po.order_number
          FROM purchase_order_items poi
          JOIN purchase_orders po ON poi.purchase_order_id = po.id
          WHERE po.id = ?
        `;

        const items = await executeQuery(itemsQuery, [orderId]);

        for (const item of items) {
          // Update product stock
          await executeQuery(
            "UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE id = ?",
            [item.quantity, item.product_id]
          );

          // Create stock movement record
          await executeQuery(
            `INSERT INTO stock_movements (
              product_id, movement_type, quantity, reference_number, notes
            ) VALUES (?, 'in', ?, ?, ?)`,
            [
              item.product_id,
              item.quantity,
              item.order_number,
              `Purchase order completion - ${item.order_number}`,
            ]
          );
        }
      }

      res.json({
        success: true,
        message: "Purchase order status updated successfully",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
};

module.exports = purchaseOrdersController;
