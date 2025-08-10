const { executeQuery, buildQuery } = require("../config/database_fixed");

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

      // Build WHERE conditions
      const whereConditions = [];

      if (type && type !== "all") {
        whereConditions.push({
          clause: "type = ?",
          params: [type],
        });
      }

      if (priority && priority !== "all") {
        whereConditions.push({
          clause: "priority = ?",
          params: [priority],
        });
      }

      if (status && status !== "all") {
        whereConditions.push({
          clause: "status = ?",
          params: [status],
        });
      }

      // Count query
      const countQueryBase = "SELECT COUNT(*) as total FROM alerts";
      const { query: countQuery, params: countParams } = buildQuery(
        countQueryBase,
        whereConditions
      );

      const countResult = await executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      // Data query
      const dataQueryBase = "SELECT * FROM alerts";
      const orderBy = `
        CASE priority 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
      `;

      const { query: dataQuery, params: dataParams } = buildQuery(
        dataQueryBase,
        whereConditions,
        orderBy,
        "LIMIT ? OFFSET ?"
      );

      // Add pagination parameters
      dataParams.push(limit, offset);

      const alerts = await executeQuery(dataQuery, dataParams);

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

  // Get single alert
  getAlert: async (req, res) => {
    try {
      const { id } = req.params;

      const query = "SELECT * FROM alerts WHERE id = ?";
      const result = await executeQuery(query, [id]);

      if (result.length === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const alert = result[0];
      res.json({
        id: alert.id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        message: alert.message,
        relatedId: alert.related_id,
        status: alert.status,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
      });
    } catch (error) {
      console.error("Error fetching alert:", error);
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  },

  // Create new alert
  createAlert: async (req, res) => {
    try {
      const { type, priority, title, message, relatedId } = req.body;

      // Validation
      if (!type || !title || !message) {
        return res.status(400).json({
          error: "Required fields: type, title, message",
        });
      }

      const query = `
        INSERT INTO alerts (type, priority, title, message, related_id)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        type,
        priority || "medium",
        title,
        message,
        relatedId || null,
      ];

      const result = await executeQuery(query, params);

      // Get the created alert
      const createdAlert = await executeQuery(
        "SELECT * FROM alerts WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        id: createdAlert[0].id,
        type: createdAlert[0].type,
        priority: createdAlert[0].priority,
        title: createdAlert[0].title,
        message: createdAlert[0].message,
        relatedId: createdAlert[0].related_id,
        status: createdAlert[0].status,
        createdAt: createdAlert[0].created_at,
        updatedAt: createdAlert[0].updated_at,
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  },

  // Update alert status
  updateAlert: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, priority, title, message } = req.body;

      // Check if alert exists
      const existingAlert = await executeQuery(
        "SELECT id FROM alerts WHERE id = ?",
        [id]
      );

      if (existingAlert.length === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const query = `
        UPDATE alerts 
        SET status = ?, priority = ?, title = ?, message = ?
        WHERE id = ?
      `;

      const params = [
        status || "active",
        priority || "medium",
        title,
        message,
        id,
      ];

      await executeQuery(query, params);

      // Get updated alert
      const updatedAlert = await executeQuery(
        "SELECT * FROM alerts WHERE id = ?",
        [id]
      );

      res.json({
        id: updatedAlert[0].id,
        type: updatedAlert[0].type,
        priority: updatedAlert[0].priority,
        title: updatedAlert[0].title,
        message: updatedAlert[0].message,
        relatedId: updatedAlert[0].related_id,
        status: updatedAlert[0].status,
        createdAt: updatedAlert[0].created_at,
        updatedAt: updatedAlert[0].updated_at,
      });
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  },

  // Delete alert
  deleteAlert: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if alert exists
      const existingAlert = await executeQuery(
        "SELECT id FROM alerts WHERE id = ?",
        [id]
      );

      if (existingAlert.length === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      await executeQuery("DELETE FROM alerts WHERE id = ?", [id]);

      res.json({ message: "Alert deleted successfully" });
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ error: "Failed to delete alert" });
    }
  },

  // Mark alert as acknowledged
  acknowledgeAlert: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if alert exists
      const existingAlert = await executeQuery(
        "SELECT id FROM alerts WHERE id = ?",
        [id]
      );

      if (existingAlert.length === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      await executeQuery("UPDATE alerts SET status = ? WHERE id = ?", [
        "acknowledged",
        id,
      ]);

      res.json({ message: "Alert acknowledged successfully" });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  },

  // Mark alert as resolved
  resolveAlert: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if alert exists
      const existingAlert = await executeQuery(
        "SELECT id FROM alerts WHERE id = ?",
        [id]
      );

      if (existingAlert.length === 0) {
        return res.status(404).json({ error: "Alert not found" });
      }

      await executeQuery("UPDATE alerts SET status = ? WHERE id = ?", [
        "resolved",
        id,
      ]);

      res.json({ message: "Alert resolved successfully" });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  },

  // Get alert statistics
  getStats: async (req, res) => {
    try {
      const statsQuery = `
        SELECT 
          status,
          priority,
          COUNT(*) as count
        FROM alerts
        WHERE status = 'active'
        GROUP BY status, priority
        ORDER BY 
          CASE priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END
      `;

      const typeStatsQuery = `
        SELECT 
          type,
          COUNT(*) as count
        FROM alerts
        WHERE status = 'active'
        GROUP BY type
      `;

      const [priorityStats, typeStats] = await Promise.all([
        executeQuery(statsQuery),
        executeQuery(typeStatsQuery),
      ]);

      res.json({
        priorityStats: priorityStats.map((stat) => ({
          priority: stat.priority,
          count: stat.count,
        })),
        typeStats: typeStats.map((stat) => ({
          type: stat.type,
          count: stat.count,
        })),
        total: priorityStats.reduce((sum, stat) => sum + stat.count, 0),
      });
    } catch (error) {
      console.error("Error fetching alert stats:", error);
      res.status(500).json({ error: "Failed to fetch alert statistics" });
    }
  },

  // Auto-generate low stock alerts
  generateLowStockAlerts: async (req, res) => {
    try {
      // Find products with low stock
      const lowStockQuery = `
        SELECT p.id, p.name, p.stock_quantity, p.min_stock_level
        FROM products p
        WHERE p.stock_quantity <= p.min_stock_level
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.type = 'low_stock' 
          AND a.related_id = p.id 
          AND a.status = 'active'
        )
      `;

      const lowStockProducts = await executeQuery(lowStockQuery);

      const createdAlerts = [];

      for (const product of lowStockProducts) {
        const title = `Low Stock Alert: ${product.name}`;
        const message = `Product "${product.name}" is running low on stock. Current: ${product.stock_quantity}, Minimum: ${product.min_stock_level}`;

        const priority =
          product.stock_quantity === 0
            ? "critical"
            : product.stock_quantity <= product.min_stock_level * 0.5
            ? "high"
            : "medium";

        const insertQuery = `
          INSERT INTO alerts (type, priority, title, message, related_id)
          VALUES ('low_stock', ?, ?, ?, ?)
        `;

        const result = await executeQuery(insertQuery, [
          priority,
          title,
          message,
          product.id,
        ]);

        createdAlerts.push({
          id: result.insertId,
          productId: product.id,
          productName: product.name,
          currentStock: product.stock_quantity,
          minStock: product.min_stock_level,
          priority,
        });
      }

      res.json({
        message: `Generated ${createdAlerts.length} low stock alerts`,
        alerts: createdAlerts,
      });
    } catch (error) {
      console.error("Error generating low stock alerts:", error);
      res.status(500).json({ error: "Failed to generate low stock alerts" });
    }
  },
};

module.exports = alertsController;
