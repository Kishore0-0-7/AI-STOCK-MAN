const { executeQuery } = require("../config/db");

const dashboardController = {
  // Get dashboard statistics
  getStats: async (req, res) => {
    try {
      const queries = {
        products: "SELECT COUNT(*) as count FROM products",
        lowStock:
          "SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level",
        suppliers: "SELECT COUNT(*) as count FROM suppliers",
        customers: "SELECT COUNT(*) as count FROM customers",
        recentOrders:
          "SELECT COUNT(*) as count FROM purchase_orders WHERE DATE(created_at) = CURDATE()",
        totalValue:
          "SELECT COALESCE(SUM(stock_quantity * price), 0) as value FROM products",
      };

      const [
        products,
        lowStock,
        suppliers,
        customers,
        recentOrders,
        totalValue,
      ] = await Promise.all([
        executeQuery(queries.products),
        executeQuery(queries.lowStock),
        executeQuery(queries.suppliers),
        executeQuery(queries.customers),
        executeQuery(queries.recentOrders),
        executeQuery(queries.totalValue),
      ]);

      const stats = {
        totalProducts: products[0].count,
        lowStockProducts: lowStock[0].count,
        totalSuppliers: suppliers[0].count,
        totalCustomers: customers[0].count,
        todayOrders: recentOrders[0].count,
        inventoryValue: parseFloat(totalValue[0].value || 0),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  },

  // Get recent activities
  getRecentActivities: async (req, res) => {
    try {
      const activities = await executeQuery(`
        SELECT 
          'purchase_order' as type,
          po.id,
          CONCAT('Purchase Order #', po.id, ' - ', s.name) as description,
          po.status,
          po.total_amount as amount,
          po.created_at
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.created_at DESC
        LIMIT 10
      `);

      res.json(
        activities.map((activity) => ({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          status: activity.status,
          amount: parseFloat(activity.amount || 0),
          timestamp: activity.created_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ error: "Failed to fetch recent activities" });
    }
  },

  // Get low stock alerts
  getLowStockAlerts: async (req, res) => {
    try {
      const alerts = await executeQuery(`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.min_stock_level,
          s.name as supplier_name,
          p.category
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.stock_quantity <= p.min_stock_level
        ORDER BY (p.stock_quantity / p.min_stock_level) ASC
        LIMIT 10
      `);

      res.json(
        alerts.map((alert) => ({
          id: alert.id,
          name: alert.name,
          sku: alert.sku,
          currentStock: alert.stock_quantity,
          minStock: alert.min_stock_level,
          supplier: alert.supplier_name,
          category: alert.category,
          urgency:
            alert.stock_quantity === 0
              ? "critical"
              : alert.stock_quantity < alert.min_stock_level * 0.5
              ? "high"
              : "medium",
        }))
      );
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      res.status(500).json({ error: "Failed to fetch low stock alerts" });
    }
  },

  // Get sales summary
  getSalesSummary: async (req, res) => {
    try {
      const period = req.query.period || "30"; // days

      const summary = await executeQuery(
        `
        SELECT 
          COALESCE(SUM(total_amount), 0) as totalSales,
          COUNT(*) as totalOrders,
          COALESCE(AVG(total_amount), 0) as averageOrder
        FROM purchase_orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status IN ('completed', 'delivered')
      `,
        [period]
      );

      const dailySales = await executeQuery(
        `
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as amount,
          COUNT(*) as orders
        FROM purchase_orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status IN ('completed', 'delivered')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,
        [period]
      );

      res.json({
        summary: {
          totalSales: parseFloat(summary[0].totalSales),
          totalOrders: summary[0].totalOrders,
          averageOrder: parseFloat(summary[0].averageOrder),
        },
        dailySales: dailySales.map((day) => ({
          date: day.date,
          amount: parseFloat(day.amount),
          orders: day.orders,
        })),
      });
    } catch (error) {
      console.error("Error fetching sales summary:", error);
      res.status(500).json({ error: "Failed to fetch sales summary" });
    }
  },
};

module.exports = dashboardController;
