const { executeQuery } = require("../config/database_robust");

const alertsController = {
  // Get all alerts - simplified
  getAllAlerts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Simple count query
      const countQuery = "SELECT COUNT(*) as total FROM alerts";
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      // Simple data query without complex ORDER BY
      const dataQuery = `
        SELECT * FROM alerts
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const alerts = await executeQuery(dataQuery);

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

      // Validation
      if (!type || !title || !message) {
        return res.status(400).json({
          error: "Required fields: type, title, message",
        });
      }

      const mysql = require("mysql2");

      const query = `
        INSERT INTO alerts (type, priority, title, message, related_id)
        VALUES (
          ${mysql.escape(type)},
          ${mysql.escape(priority || "medium")},
          ${mysql.escape(title)},
          ${mysql.escape(message)},
          ${mysql.escape(relatedId || null)}
        )
      `;

      const result = await executeQuery(query);

      // Get the created alert
      const createdAlert = await executeQuery(
        `SELECT * FROM alerts WHERE id = ${result.insertId}`
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
};

module.exports = alertsController;
