const { executeQuery } = require("../config/database");

const alertsController = {
  // Get all alerts with pagination
  getAllAlerts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const type = req.query.type;
      const priority = req.query.priority;
      const status = req.query.status || "active";

      let whereClause = "1=1";
      let queryParams = [];

      if (type && type !== "all") {
        whereClause += " AND type = ?";
        queryParams.push(type);
      }

      if (priority && priority !== "all") {
        whereClause += " AND priority = ?";
        queryParams.push(priority);
      }

      if (status && status !== "all") {
        whereClause += " AND status = ?";
        queryParams.push(status);
      }

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM alerts WHERE ${whereClause}`;
      const [countResult] = await executeQuery(countQuery, queryParams);
      const total = countResult.total;

      // Data query
      const dataQuery = `
        SELECT * FROM alerts
        WHERE ${whereClause}
        ORDER BY 
          CASE priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
        LIMIT ? OFFSET ?
      `;

      const alerts = await executeQuery(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      res.json({
        alerts: alerts.map((alert) => ({
          id: alert.id,
          type: alert.type,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          relatedId: alert.related_id,
          status: alert.status,
          createdAt: alert.created_at,
          updatedAt: alert.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  },

  // Create new alert
  createAlert: async (req, res) => {
    try {
      const { type, priority, title, message, relatedId } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const validTypes = [
        "low_stock",
        "out_of_stock",
        "expired_product",
        "overdue_payment",
      ];
      const validPriorities = ["low", "medium", "high", "critical"];

      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid alert type" });
      }

      if (!validPriorities.includes(priority || "medium")) {
        return res.status(400).json({ error: "Invalid priority level" });
      }

      const insertQuery = `
        INSERT INTO alerts (type, priority, title, message, related_id, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `;

      const result = await executeQuery(insertQuery, [
        type,
        priority || "medium",
        title,
        message,
        relatedId || null,
      ]);

      res.status(201).json({
        success: true,
        message: "Alert created successfully",
        alertId: result.insertId,
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  },

  // Update alert
  updateAlert: async (req, res) => {
    try {
      const alertId = req.params.id;
      const { type, priority, title, message, relatedId } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const validTypes = [
        "low_stock",
        "out_of_stock",
        "expired_product",
        "overdue_payment",
      ];
      const validPriorities = ["low", "medium", "high", "critical"];

      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid alert type" });
      }

      if (!validPriorities.includes(priority || "medium")) {
        return res.status(400).json({ error: "Invalid priority level" });
      }

      const updateQuery = `
        UPDATE alerts SET
          type = ?, priority = ?, title = ?, message = ?, related_id = ?, updated_at = NOW()
        WHERE id = ?
      `;

      const result = await executeQuery(updateQuery, [
        type,
        priority || "medium",
        title,
        message,
        relatedId || null,
        alertId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json({
        success: true,
        message: "Alert updated successfully",
      });
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  },

  // Delete alert
  deleteAlert: async (req, res) => {
    try {
      const alertId = req.params.id;

      const result = await executeQuery("DELETE FROM alerts WHERE id = ?", [
        alertId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json({
        success: true,
        message: "Alert deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ error: "Failed to delete alert" });
    }
  },

  // Update alert status
  updateAlertStatus: async (req, res) => {
    try {
      const alertId = req.params.id;
      const { status } = req.body;

      const validStatuses = ["active", "acknowledged", "resolved"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const result = await executeQuery(
        "UPDATE alerts SET status = ?, updated_at = NOW() WHERE id = ?",
        [status, alertId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json({
        success: true,
        message: "Alert status updated successfully",
      });
    } catch (error) {
      console.error("Error updating alert status:", error);
      res.status(500).json({ error: "Failed to update alert status" });
    }
  },

  // Generate system alerts (called periodically or on demand)
  generateSystemAlerts: async (req, res) => {
    try {
      const alerts = [];

      // Check for low stock products
      const lowStockQuery = `
        SELECT id, name, stock_quantity, min_stock_level
        FROM products 
        WHERE stock_quantity <= min_stock_level
          AND NOT EXISTS (
            SELECT 1 FROM alerts 
            WHERE type = 'low_stock' 
              AND related_id = products.id 
              AND status = 'active'
          )
      `;

      const lowStockProducts = await executeQuery(lowStockQuery);

      for (const product of lowStockProducts) {
        const priority =
          product.stock_quantity === 0
            ? "critical"
            : product.stock_quantity <= product.min_stock_level * 0.5
            ? "high"
            : "medium";

        const alertType =
          product.stock_quantity === 0 ? "out_of_stock" : "low_stock";

        const title =
          product.stock_quantity === 0
            ? `Out of Stock: ${product.name}`
            : `Low Stock Alert: ${product.name}`;

        const message =
          product.stock_quantity === 0
            ? `Product "${product.name}" is completely out of stock. Immediate restocking required.`
            : `Product "${product.name}" is running low (${product.stock_quantity} remaining, minimum: ${product.min_stock_level}). Consider restocking soon.`;

        await executeQuery(
          "INSERT INTO alerts (type, priority, title, message, related_id, status) VALUES (?, ?, ?, ?, ?, ?)",
          [alertType, priority, title, message, product.id, "active"]
        );

        alerts.push({
          type: alertType,
          priority,
          title,
          message,
          productId: product.id,
        });
      }

      // Check for overdue purchase orders
      const overdueOrdersQuery = `
        SELECT id, order_number, supplier_id, expected_delivery_date
        FROM purchase_orders 
        WHERE status IN ('approved', 'pending') 
          AND expected_delivery_date < CURDATE()
          AND NOT EXISTS (
            SELECT 1 FROM alerts 
            WHERE type = 'overdue_payment' 
              AND related_id = purchase_orders.id 
              AND status = 'active'
          )
      `;

      const overdueOrders = await executeQuery(overdueOrdersQuery);

      for (const order of overdueOrders) {
        const daysOverdue = Math.floor(
          (new Date() - new Date(order.expected_delivery_date)) /
            (1000 * 60 * 60 * 24)
        );
        const priority =
          daysOverdue > 7 ? "high" : daysOverdue > 3 ? "medium" : "low";

        const title = `Overdue Purchase Order: ${order.order_number}`;
        const message = `Purchase order ${order.order_number} is ${daysOverdue} days overdue. Expected delivery was ${order.expected_delivery_date}.`;

        await executeQuery(
          "INSERT INTO alerts (type, priority, title, message, related_id, status) VALUES (?, ?, ?, ?, ?, ?)",
          ["overdue_payment", priority, title, message, order.id, "active"]
        );

        alerts.push({
          type: "overdue_payment",
          priority,
          title,
          message,
          orderId: order.id,
        });
      }

      res.json({
        success: true,
        message: `Generated ${alerts.length} new system alerts`,
        alerts: alerts,
      });
    } catch (error) {
      console.error("Error generating system alerts:", error);
      res.status(500).json({ error: "Failed to generate system alerts" });
    }
  },
};

module.exports = alertsController;
