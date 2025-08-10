const { executeQuery } = require("../config/database");

const dashboardController = {
  // Get dashboard overview statistics
  getOverview: async (req, res) => {
    try {
      // Get overview statistics
      const overviewQuery = `
        SELECT 
          (SELECT COUNT(*) FROM products) as total_products,
          (SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level) as low_stock_items,
          (SELECT COUNT(*) FROM suppliers WHERE status = 'active') as active_suppliers,
          (SELECT COUNT(*) FROM purchase_orders WHERE status = 'pending') as pending_orders,
          (SELECT SUM(stock_quantity * cost) FROM products) as total_inventory_value,
          (SELECT COUNT(*) FROM alerts WHERE status = 'active') as active_alerts
      `;

      const [overview] = await executeQuery(overviewQuery);

      // Get recent activity count
      const activityQuery = `
        SELECT COUNT(*) as recent_activities
        FROM (
          SELECT created_at FROM products WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT created_at FROM purchase_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT created_at FROM stock_movements WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) as activities
      `;

      const [activity] = await executeQuery(activityQuery);

      res.json({
        totalProducts: overview.total_products || 0,
        lowStockItems: overview.low_stock_items || 0,
        activeSuppliers: overview.active_suppliers || 0,
        pendingOrders: overview.pending_orders || 0,
        totalInventoryValue: parseFloat(overview.total_inventory_value) || 0,
        activeAlerts: overview.active_alerts || 0,
        recentActivities: activity.recent_activities || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      res.status(500).json({ error: "Failed to fetch dashboard overview" });
    }
  },

  // Get recent activity feed
  getActivity: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;

      // Get recent activities from multiple tables
      const activitiesQuery = `
        (
          SELECT 
            'product' as type,
            CONCAT('New product added: ', name) as description,
            created_at as timestamp,
            id as related_id
          FROM products 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY created_at DESC
          LIMIT ?
        )
        UNION ALL
        (
          SELECT 
            'purchase_order' as type,
            CONCAT('Purchase order created: ', order_number) as description,
            created_at as timestamp,
            id as related_id
          FROM purchase_orders 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY created_at DESC
          LIMIT ?
        )
        UNION ALL
        (
          SELECT 
            'stock_movement' as type,
            CONCAT('Stock ', movement_type, ': ', quantity, ' units') as description,
            created_at as timestamp,
            product_id as related_id
          FROM stock_movements 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY created_at DESC
          LIMIT ?
        )
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      const activities = await executeQuery(activitiesQuery, [
        limit,
        limit,
        limit,
        limit,
      ]);

      res.json(
        activities.map((activity) => ({
          type: activity.type,
          description: activity.description,
          timestamp: activity.timestamp,
          relatedId: activity.related_id,
        }))
      );
    } catch (error) {
      console.error("Error fetching dashboard activity:", error);
      res.status(500).json({ error: "Failed to fetch dashboard activity" });
    }
  },

  // Get stock trends data
  getTrends: async (req, res) => {
    try {
      const period = req.query.period || "30"; // days

      // Stock movement trends
      const trendsQuery = `
        SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END) as stock_in,
          SUM(CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END) as stock_out
        FROM stock_movements 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      const trends = await executeQuery(trendsQuery, [period]);

      // Category distribution
      const categoryQuery = `
        SELECT 
          category,
          COUNT(*) as product_count,
          SUM(stock_quantity) as total_stock,
          SUM(stock_quantity * cost) as category_value
        FROM products
        GROUP BY category
        ORDER BY category_value DESC
      `;

      const categories = await executeQuery(categoryQuery);

      res.json({
        stockTrends: trends.map((trend) => ({
          date: trend.date,
          stockIn: trend.stock_in || 0,
          stockOut: trend.stock_out || 0,
        })),
        categoryDistribution: categories.map((cat) => ({
          category: cat.category,
          productCount: cat.product_count,
          totalStock: cat.total_stock,
          value: parseFloat(cat.category_value) || 0,
        })),
      });
    } catch (error) {
      console.error("Error fetching dashboard trends:", error);
      res.status(500).json({ error: "Failed to fetch dashboard trends" });
    }
  },

  // Get active alerts for dashboard
  getAlerts: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;

      // Get active alerts
      const alertsQuery = `
        SELECT 
          type, priority, title, message, related_id, created_at
        FROM alerts 
        WHERE status = 'active'
        ORDER BY 
          CASE priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
        LIMIT ?
      `;

      const alerts = await executeQuery(alertsQuery, [limit]);

      // Also check for low stock items that might not have alerts yet
      const lowStockQuery = `
        SELECT 
          p.id,
          p.name,
          p.stock_quantity,
          p.min_stock_level,
          s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.stock_quantity <= p.min_stock_level
        ORDER BY p.stock_quantity ASC
        LIMIT 5
      `;

      const lowStockItems = await executeQuery(lowStockQuery);

      res.json({
        alerts: alerts.map((alert) => ({
          type: alert.type,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          relatedId: alert.related_id,
          createdAt: alert.created_at,
        })),
        lowStockItems: lowStockItems.map((item) => ({
          id: item.id,
          name: item.name,
          currentStock: item.stock_quantity,
          minStock: item.min_stock_level,
          supplierName: item.supplier_name,
        })),
      });
    } catch (error) {
      console.error("Error fetching dashboard alerts:", error);
      res.status(500).json({ error: "Failed to fetch dashboard alerts" });
    }
  },

  // Get demand forecasting data
  getForecast: async (req, res) => {
    try {
      // Simple forecasting based on historical stock movements
      const forecastQuery = `
        SELECT 
          p.id,
          p.name,
          p.stock_quantity,
          p.min_stock_level,
          AVG(sm.quantity) as avg_consumption,
          COUNT(sm.id) as movement_count
        FROM products p
        LEFT JOIN stock_movements sm ON p.id = sm.product_id 
          AND sm.movement_type = 'out' 
          AND sm.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        WHERE p.stock_quantity > 0
        GROUP BY p.id, p.name, p.stock_quantity, p.min_stock_level
        HAVING movement_count > 0
        ORDER BY avg_consumption DESC
        LIMIT 10
      `;

      const forecast = await executeQuery(forecastQuery);

      // Calculate estimated days until stock out
      const forecastData = forecast.map((item) => {
        const avgConsumption = parseFloat(item.avg_consumption) || 1;
        const daysUntilStockOut = Math.floor(
          item.stock_quantity / avgConsumption
        );
        const reorderRecommended = daysUntilStockOut <= 30;

        return {
          productId: item.id,
          productName: item.name,
          currentStock: item.stock_quantity,
          minStock: item.min_stock_level,
          avgConsumption: avgConsumption,
          daysUntilStockOut: daysUntilStockOut,
          reorderRecommended: reorderRecommended,
          urgency:
            daysUntilStockOut <= 7
              ? "high"
              : daysUntilStockOut <= 14
              ? "medium"
              : "low",
        };
      });

      res.json({
        forecast: forecastData,
        summary: {
          totalItemsTracked: forecast.length,
          highUrgencyItems: forecastData.filter(
            (item) => item.urgency === "high"
          ).length,
          reorderRecommendations: forecastData.filter(
            (item) => item.reorderRecommended
          ).length,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard forecast:", error);
      res.status(500).json({ error: "Failed to fetch dashboard forecast" });
    }
  },
};

module.exports = dashboardController;
