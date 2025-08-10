const { executeQuery } = require("../config/db");

const alertsController = {
  // Get all low stock alerts
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = (page - 1) * limit;
      const severity = req.query.severity || "all"; // all, critical, high, medium

      let whereClause = "WHERE p.stock_quantity <= p.min_stock_level";
      let params = [];

      // Apply severity filter
      if (severity === "critical") {
        whereClause += " AND p.stock_quantity = 0";
      } else if (severity === "high") {
        whereClause +=
          " AND p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level * 0.3";
      } else if (severity === "medium") {
        whereClause +=
          " AND p.stock_quantity > p.min_stock_level * 0.3 AND p.stock_quantity <= p.min_stock_level";
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM products p
        ${whereClause}
      `;
      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get alerts with supplier info
      const alertsQuery = `
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.category,
          p.stock_quantity,
          p.min_stock_level,
          p.price,
          p.updated_at,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN p.stock_quantity = 0 THEN 1
            WHEN p.stock_quantity <= p.min_stock_level * 0.3 THEN 2
            ELSE 3
          END,
          p.stock_quantity ASC,
          p.name ASC
        LIMIT ? OFFSET ?
      `;

      const alerts = await executeQuery(alertsQuery, [
        ...params,
        limit,
        offset,
      ]);

      res.json({
        alerts: alerts.map((alert) => {
          let severity = "medium";
          if (alert.stock_quantity === 0) {
            severity = "critical";
          } else if (alert.stock_quantity <= alert.min_stock_level * 0.3) {
            severity = "high";
          }

          return {
            id: alert.id,
            sku: alert.sku,
            name: alert.name,
            category: alert.category,
            currentStock: alert.stock_quantity,
            minStock: alert.min_stock_level,
            shortfall: Math.max(
              0,
              alert.min_stock_level - alert.stock_quantity
            ),
            severity,
            estimatedValue:
              parseFloat(alert.price || 0) *
              Math.max(0, alert.min_stock_level - alert.stock_quantity),
            supplier: {
              name: alert.supplier_name,
              email: alert.supplier_email,
              phone: alert.supplier_phone,
            },
            lastUpdated: alert.updated_at,
          };
        }),
        summary: {
          total,
          critical: alerts.filter((a) => a.stock_quantity === 0).length,
          high: alerts.filter(
            (a) =>
              a.stock_quantity > 0 &&
              a.stock_quantity <= a.min_stock_level * 0.3
          ).length,
          medium: alerts.filter(
            (a) => a.stock_quantity > a.min_stock_level * 0.3
          ).length,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch low stock alerts" });
    }
  },

  // Get alert summary/statistics
  getSummary: async (req, res) => {
    try {
      const queries = {
        total:
          "SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level",
        critical:
          "SELECT COUNT(*) as count FROM products WHERE stock_quantity = 0",
        high: "SELECT COUNT(*) as count FROM products WHERE stock_quantity > 0 AND stock_quantity <= min_stock_level * 0.3",
        medium:
          "SELECT COUNT(*) as count FROM products WHERE stock_quantity > min_stock_level * 0.3 AND stock_quantity <= min_stock_level",
        totalValue: `
          SELECT COALESCE(SUM(price * GREATEST(0, min_stock_level - stock_quantity)), 0) as value 
          FROM products 
          WHERE stock_quantity <= min_stock_level
        `,
      };

      const [total, critical, high, medium, totalValue] = await Promise.all([
        executeQuery(queries.total),
        executeQuery(queries.critical),
        executeQuery(queries.high),
        executeQuery(queries.medium),
        executeQuery(queries.totalValue),
      ]);

      // Get recent alerts (products that became low stock in last 7 days)
      const recentAlerts = await executeQuery(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE stock_quantity <= min_stock_level 
        AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      // Get category breakdown
      const categoryBreakdown = await executeQuery(`
        SELECT 
          category,
          COUNT(*) as count,
          COALESCE(SUM(price * GREATEST(0, min_stock_level - stock_quantity)), 0) as estimated_value
        FROM products 
        WHERE stock_quantity <= min_stock_level
        AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `);

      res.json({
        summary: {
          total: total[0].count,
          critical: critical[0].count,
          high: high[0].count,
          medium: medium[0].count,
          recentAlerts: recentAlerts[0].count,
          estimatedRestockValue: parseFloat(totalValue[0].value || 0),
        },
        categoryBreakdown: categoryBreakdown.map((cat) => ({
          category: cat.category,
          count: cat.count,
          estimatedValue: parseFloat(cat.estimated_value || 0),
        })),
      });
    } catch (error) {
      console.error("Error fetching alert summary:", error);
      res.status(500).json({ error: "Failed to fetch alert summary" });
    }
  },

  // Get alerts by category
  getByCategory: async (req, res) => {
    try {
      const { category } = req.params;

      const alerts = await executeQuery(
        `
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.stock_quantity,
          p.min_stock_level,
          p.price,
          s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.category = ? AND p.stock_quantity <= p.min_stock_level
        ORDER BY 
          CASE 
            WHEN p.stock_quantity = 0 THEN 1
            WHEN p.stock_quantity <= p.min_stock_level * 0.3 THEN 2
            ELSE 3
          END,
          p.stock_quantity ASC
      `,
        [category]
      );

      res.json({
        category,
        alerts: alerts.map((alert) => {
          let severity = "medium";
          if (alert.stock_quantity === 0) {
            severity = "critical";
          } else if (alert.stock_quantity <= alert.min_stock_level * 0.3) {
            severity = "high";
          }

          return {
            id: alert.id,
            sku: alert.sku,
            name: alert.name,
            currentStock: alert.stock_quantity,
            minStock: alert.min_stock_level,
            shortfall: Math.max(
              0,
              alert.min_stock_level - alert.stock_quantity
            ),
            severity,
            estimatedValue:
              parseFloat(alert.price || 0) *
              Math.max(0, alert.min_stock_level - alert.stock_quantity),
            supplier: alert.supplier_name,
          };
        }),
        count: alerts.length,
      });
    } catch (error) {
      console.error("Error fetching alerts by category:", error);
      res.status(500).json({ error: "Failed to fetch alerts by category" });
    }
  },

  // Create or update alert thresholds
  updateThreshold: async (req, res) => {
    try {
      const { productId, minStockLevel } = req.body;

      if (!productId || minStockLevel == null) {
        return res
          .status(400)
          .json({ error: "Product ID and minimum stock level are required" });
      }

      // Check if product exists
      const product = await executeQuery(
        "SELECT id, name, stock_quantity FROM products WHERE id = ?",
        [productId]
      );

      if (product.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Update the minimum stock level
      await executeQuery(
        "UPDATE products SET min_stock_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [parseInt(minStockLevel), productId]
      );

      const currentStock = product[0].stock_quantity;
      const newThreshold = parseInt(minStockLevel);

      res.json({
        message: "Alert threshold updated successfully",
        product: {
          id: productId,
          name: product[0].name,
          currentStock,
          newThreshold,
          status: currentStock <= newThreshold ? "low_stock" : "in_stock",
          alertActive: currentStock <= newThreshold,
        },
      });
    } catch (error) {
      console.error("Error updating alert threshold:", error);
      res.status(500).json({ error: "Failed to update alert threshold" });
    }
  },

  // Mark alert as acknowledged (for tracking purposes)
  acknowledge: async (req, res) => {
    try {
      const { productId } = req.params;
      const { acknowledgedBy, notes } = req.body;

      // For now, we'll just return success since we don't have an acknowledgment table
      // In a full implementation, you might want to create an alert_acknowledgments table

      res.json({
        message: "Alert acknowledged successfully",
        productId: parseInt(productId),
        acknowledgedBy,
        acknowledgedAt: new Date().toISOString(),
        notes,
      });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  },

  // Get suggested reorder quantities
  getReorderSuggestions: async (req, res) => {
    try {
      const suggestions = await executeQuery(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.category,
          p.stock_quantity,
          p.min_stock_level,
          p.cost,
          p.price,
          s.name as supplier_name,
          s.contact_email as supplier_email,
          GREATEST(0, (p.min_stock_level * 2) - p.stock_quantity) as suggested_order_qty,
          GREATEST(0, (p.min_stock_level * 2) - p.stock_quantity) * p.cost as estimated_cost
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.stock_quantity <= p.min_stock_level
        ORDER BY 
          CASE 
            WHEN p.stock_quantity = 0 THEN 1
            ELSE 2
          END,
          estimated_cost DESC
        LIMIT 50
      `);

      const totalEstimatedCost = suggestions.reduce(
        (sum, item) => sum + parseFloat(item.estimated_cost || 0),
        0
      );

      res.json({
        suggestions: suggestions.map((item) => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          currentStock: item.stock_quantity,
          minStock: item.min_stock_level,
          suggestedOrderQty: item.suggested_order_qty,
          unitCost: parseFloat(item.cost || 0),
          estimatedCost: parseFloat(item.estimated_cost || 0),
          supplier: {
            name: item.supplier_name,
            email: item.supplier_email,
          },
        })),
        summary: {
          totalItems: suggestions.length,
          totalEstimatedCost,
        },
      });
    } catch (error) {
      console.error("Error fetching reorder suggestions:", error);
      res.status(500).json({ error: "Failed to fetch reorder suggestions" });
    }
  },
};

module.exports = alertsController;
