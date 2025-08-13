const { pool } = require("../config/database");

class AlertsController {
  // Get all alerts - matches alertsAPI.getAll()
  static async getAllAlerts(req, res) {
    try {
      const {
        limit = 10,
        status = "active",
        type,
        priority,
        page = 1,
      } = req.query;

      console.log("Alerts query params received:", {
        limit,
        status,
        type,
        priority,
        page,
      });

      // Simple query first - let's avoid complex filtering for now
      let query = `
        SELECT 
          a.id,
          a.alert_type,
          a.priority,
          a.title,
          a.message,
          a.status,
          a.category,
          a.product_id,
          a.product_name,
          a.current_stock,
          a.low_stock_threshold,
          a.assigned_to,
          a.resolved_by,
          a.resolved_at,
          a.created_at,
          a.updated_at,
          p.name as actual_product_name,
          p.sku,
          p.category as product_category,
          p.unit,
          p.price,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM alerts a
        LEFT JOIN products p ON a.product_id = p.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE a.status = 'active'
        ORDER BY a.priority DESC, a.created_at DESC
        LIMIT 10
      `;

      console.log("Executing simple alerts query");
      const [alerts] = await pool.execute(query);

      // Get total count
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total 
        FROM alerts a 
        WHERE a.status = 'active'
      `);
      const totalCount = countResult[0].total;

      // Transform alerts data
      const transformedAlerts = alerts.map((alert) => ({
        ...alert,
        product: alert.product_id
          ? {
              id: alert.product_id,
              name: alert.actual_product_name || alert.product_name,
              sku: alert.sku,
              category: alert.product_category,
              unit: alert.unit,
              price: alert.price,
              current_stock: alert.current_stock,
              low_stock_threshold: alert.low_stock_threshold,
              supplier: alert.supplier_name
                ? {
                    name: alert.supplier_name,
                    email: alert.supplier_email,
                    phone: alert.supplier_phone,
                  }
                : null,
            }
          : null,
      }));

      // Return in different formats based on what frontend expects
      // If it expects {alerts: [...]} format:
      if (req.query.format === "wrapped") {
        res.json({
          success: true,
          alerts: transformedAlerts,
          pagination: {
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(totalCount / parseInt(limit)),
          },
        });
      } else {
        // Direct array format
        res.json(transformedAlerts);
      }
    } catch (error) {
      console.error("Get all alerts error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch alerts",
        error: error.message,
      });
    }
  }

  // Get alert by ID
  static async getAlertById(req, res) {
    try {
      const { id } = req.params;

      const [alerts] = await pool.execute(
        `
        SELECT 
          a.*,
          p.name as actual_product_name,
          p.sku,
          p.category as product_category,
          p.unit,
          p.price,
          p.current_stock as actual_current_stock,
          p.low_stock_threshold as actual_threshold,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone,
          s.address as supplier_address
        FROM alerts a
        LEFT JOIN products p ON a.product_id = p.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE a.id = ?
      `,
        [id]
      );

      if (alerts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      const alert = alerts[0];

      // Get alert history
      const [history] = await pool.execute(
        `
        SELECT * FROM alert_history 
        WHERE alert_id = ? 
        ORDER BY created_at DESC
      `,
        [id]
      );

      res.json({
        ...alert,
        product: alert.product_id
          ? {
              id: alert.product_id,
              name: alert.actual_product_name || alert.product_name,
              sku: alert.sku,
              category: alert.product_category,
              unit: alert.unit,
              price: alert.price,
              current_stock: alert.actual_current_stock || alert.current_stock,
              low_stock_threshold:
                alert.actual_threshold || alert.low_stock_threshold,
              supplier: alert.supplier_name
                ? {
                    name: alert.supplier_name,
                    email: alert.supplier_email,
                    phone: alert.supplier_phone,
                    address: alert.supplier_address,
                  }
                : null,
            }
          : null,
        history: history,
      });
    } catch (error) {
      console.error("Get alert by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch alert",
        error: error.message,
      });
    }
  }

  // Create new alert
  static async createAlert(req, res) {
    try {
      const {
        alert_type,
        priority,
        title,
        message,
        category,
        product_id,
        product_name,
        current_stock,
        low_stock_threshold,
        assigned_to,
      } = req.body;

      const [result] = await pool.execute(
        `
        INSERT INTO alerts (
          alert_type, priority, title, message, category,
          product_id, product_name, current_stock, low_stock_threshold,
          assigned_to, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `,
        [
          alert_type,
          priority,
          title,
          message,
          category,
          product_id,
          product_name,
          current_stock,
          low_stock_threshold,
          assigned_to,
        ]
      );

      // Log alert creation in history
      await pool.execute(
        `
        INSERT INTO alert_history (alert_id, action, performed_by, new_status, notes)
        VALUES (?, 'created', 'System', 'active', 'Alert automatically created')
      `,
        [result.insertId]
      );

      // Log activity
      await pool.execute(
        `
        INSERT INTO user_activities (activity_type, table_name, record_id, description, user_name)
        VALUES ('create', 'alerts', ?, ?, 'System')
      `,
        [result.insertId, `Created new alert: ${title}`]
      );

      res.status(201).json({
        success: true,
        message: "Alert created successfully",
        id: result.insertId,
      });
    } catch (error) {
      console.error("Create alert error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create alert",
        error: error.message,
      });
    }
  }

  // Update alert (acknowledge, resolve, etc.)
  static async updateAlert(req, res) {
    try {
      const { id } = req.params;
      const { status, resolved_by, assigned_to, notes } = req.body;

      const updateFields = [];
      const updateValues = [];

      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);

        if (status === "resolved") {
          updateFields.push("resolved_at = CURRENT_TIMESTAMP");
          if (resolved_by) {
            updateFields.push("resolved_by = ?");
            updateValues.push(resolved_by);
          }
        }
      }

      if (assigned_to) {
        updateFields.push("assigned_to = ?");
        updateValues.push(assigned_to);
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);

      const [result] = await pool.execute(
        `
        UPDATE alerts 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `,
        updateValues
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      // Log in alert history
      await pool.execute(
        `
        INSERT INTO alert_history (alert_id, action, performed_by, new_status, notes)
        VALUES (?, 'updated', ?, ?, ?)
      `,
        [
          id,
          resolved_by || assigned_to || "System",
          status || "updated",
          notes || "",
        ]
      );

      // Log activity
      await pool.execute(
        `
        INSERT INTO user_activities (activity_type, table_name, record_id, description, user_name)
        VALUES ('update', 'alerts', ?, ?, ?)
      `,
        [
          id,
          `Updated alert status to: ${status || "updated"}`,
          resolved_by || assigned_to || "System",
        ]
      );

      res.json({
        success: true,
        message: "Alert updated successfully",
      });
    } catch (error) {
      console.error("Update alert error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update alert",
        error: error.message,
      });
    }
  }

  // Delete/dismiss alert
  static async deleteAlert(req, res) {
    try {
      const { id } = req.params;

      const [result] = await pool.execute(
        `
        UPDATE alerts 
        SET status = 'ignored', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      // Log in alert history
      await pool.execute(
        `
        INSERT INTO alert_history (alert_id, action, performed_by, new_status, notes)
        VALUES (?, 'ignored', 'System', 'ignored', 'Alert dismissed')
      `,
        [id]
      );

      // Log activity
      await pool.execute(
        `
        INSERT INTO user_activities (activity_type, table_name, record_id, description, user_name)
        VALUES ('delete', 'alerts', ?, 'Alert dismissed', 'System')
      `,
        [id]
      );

      res.json({
        success: true,
        message: "Alert dismissed successfully",
      });
    } catch (error) {
      console.error("Delete alert error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to dismiss alert",
        error: error.message,
      });
    }
  }

  // Get alert statistics
  static async getAlertStats(req, res) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_alerts,
          COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_alerts,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_alerts,
          COUNT(CASE WHEN alert_type = 'low_stock' THEN 1 END) as low_stock_alerts,
          COUNT(CASE WHEN alert_type = 'out_of_stock' THEN 1 END) as out_of_stock_alerts
        FROM alerts
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `);

      res.json(stats[0]);
    } catch (error) {
      console.error("Get alert stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch alert statistics",
        error: error.message,
      });
    }
  }

  // Auto-generate low stock alerts
  static async generateLowStockAlerts(req, res) {
    try {
      // Find products with low stock that don't have active alerts
      const [lowStockProducts] = await pool.execute(`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.category,
          p.current_stock,
          p.low_stock_threshold,
          p.unit
        FROM products p
        LEFT JOIN alerts a ON p.id = a.product_id 
          AND a.alert_type = 'low_stock' 
          AND a.status = 'active'
        WHERE p.status = 'active'
          AND p.current_stock <= p.low_stock_threshold
          AND a.id IS NULL
      `);

      let alertsCreated = 0;

      for (const product of lowStockProducts) {
        const priority =
          product.current_stock === 0
            ? "critical"
            : product.current_stock <= product.low_stock_threshold * 0.5
            ? "high"
            : "medium";

        const title =
          product.current_stock === 0
            ? `Out of Stock: ${product.name}`
            : `Low Stock: ${product.name}`;

        const message =
          `${product.name} (${product.sku}) is ${
            product.current_stock === 0 ? "out of stock" : "running low"
          }. ` +
          `Current stock: ${product.current_stock} ${product.unit}, Threshold: ${product.low_stock_threshold} ${product.unit}`;

        await pool.execute(
          `
          INSERT INTO alerts (
            alert_type, priority, title, message, status,
            product_id, product_name, current_stock, low_stock_threshold,
            category
          ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
        `,
          [
            product.current_stock === 0 ? "out_of_stock" : "low_stock",
            priority,
            title,
            message,
            product.id,
            product.name,
            product.current_stock,
            product.low_stock_threshold,
            product.category,
          ]
        );

        alertsCreated++;
      }

      res.json({
        success: true,
        message: `Generated ${alertsCreated} low stock alerts`,
        alertsCreated,
      });
    } catch (error) {
      console.error("Generate low stock alerts error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate low stock alerts",
        error: error.message,
      });
    }
  }
}

module.exports = AlertsController;
