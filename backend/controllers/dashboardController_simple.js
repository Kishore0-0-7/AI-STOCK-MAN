const { executeQuery } = require("../config/database_robust");

const dashboardController = {
  // Get dashboard overview statistics - simplified
  getOverview: async (req, res) => {
    try {
      // Simple queries without complex aggregations
      const productStatsQuery =
        "SELECT COUNT(*) as total_products FROM products";
      const supplierStatsQuery =
        "SELECT COUNT(*) as total_suppliers FROM suppliers";
      const orderStatsQuery =
        "SELECT COUNT(*) as total_orders FROM purchase_orders";

      const [productStats, supplierStats, orderStats] = await Promise.all([
        executeQuery(productStatsQuery),
        executeQuery(supplierStatsQuery),
        executeQuery(orderStatsQuery),
      ]);

      res.json({
        products: {
          total: productStats[0].total_products || 0,
          lowStock: 0, // Simplified - will calculate later
          outOfStock: 0, // Simplified
          totalValue: 0, // Simplified
        },
        suppliers: {
          total: supplierStats[0].total_suppliers || 0,
          active: supplierStats[0].total_suppliers || 0, // Simplified
        },
        orders: {
          total: orderStats[0].total_orders || 0,
          pending: 0, // Simplified
          completed: 0, // Simplified
          totalValue: 0, // Simplified
        },
        alerts: {
          total: 0, // Simplified
          critical: 0,
          high: 0,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      res.status(500).json({ error: "Failed to fetch dashboard overview" });
    }
  },

  // Get recent activities - simplified
  getActivity: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;

      // Simple queries without UNION
      const productQuery = `
        SELECT 
          'product' as type,
          CONCAT('New product added: ', name) as description,
          created_at as timestamp,
          id as related_id
        FROM products 
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      const activities = await executeQuery(productQuery);

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
};

module.exports = dashboardController;
