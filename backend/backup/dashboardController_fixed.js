const { executeQuery } = require("../config/database_fixed");

const dashboardController = {
  // Get dashboard overview statistics
  getOverview: async (req, res) => {
    try {
      // Get all statistics in parallel
      const [
        productStats,
        supplierStats,
        orderStats,
        alertStats,
        lowStockCount,
        recentOrders,
        topProducts,
      ] = await Promise.all([
        // Product statistics
        executeQuery(`
          SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_products,
            COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_products,
            SUM(stock_quantity * price) as total_inventory_value
          FROM products
        `),

        // Supplier statistics
        executeQuery(`
          SELECT 
            COUNT(*) as total_suppliers,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_suppliers
          FROM suppliers
        `),

        // Order statistics
        executeQuery(`
          SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
            COALESCE(SUM(total_amount), 0) as total_order_value
          FROM purchase_orders
        `),

        // Alert statistics
        executeQuery(`
          SELECT 
            COUNT(*) as total_alerts,
            COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_alerts,
            COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_alerts
          FROM alerts
          WHERE status = 'active'
        `),

        // Low stock count
        executeQuery(`
          SELECT COUNT(*) as count
          FROM products
          WHERE stock_quantity <= min_stock_level
        `),

        // Recent orders
        executeQuery(`
          SELECT COUNT(*) as count
          FROM purchase_orders
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `),

        // Top products by value
        executeQuery(`
          SELECT 
            name,
            stock_quantity * price as inventory_value
          FROM products
          WHERE stock_quantity > 0
          ORDER BY inventory_value DESC
          LIMIT 5
        `),
      ]);

      const stats = productStats[0];
      const suppliers = supplierStats[0];
      const orders = orderStats[0];
      const alerts = alertStats[0];

      res.json({
        products: {
          total: stats.total_products || 0,
          lowStock: stats.low_stock_products || 0,
          outOfStock: stats.out_of_stock_products || 0,
          totalValue: parseFloat(stats.total_inventory_value) || 0,
        },
        suppliers: {
          total: suppliers.total_suppliers || 0,
          active: suppliers.active_suppliers || 0,
        },
        orders: {
          total: orders.total_orders || 0,
          pending: orders.pending_orders || 0,
          completed: orders.completed_orders || 0,
          totalValue: parseFloat(orders.total_order_value) || 0,
          recentCount: recentOrders[0].count || 0,
        },
        alerts: {
          total: alerts.total_alerts || 0,
          critical: alerts.critical_alerts || 0,
          high: alerts.high_alerts || 0,
        },
        trends: {
          lowStockProducts: lowStockCount[0].count || 0,
          topProducts: topProducts.map((p) => ({
            name: p.name,
            value: parseFloat(p.inventory_value),
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      res.status(500).json({ error: "Failed to fetch dashboard overview" });
    }
  },

  // Get recent activities
  getActivity: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;

      // Get recent activities from multiple sources - using separate queries to avoid UNION issues
      const [productActivities, orderActivities, stockMovements] =
        await Promise.all([
          // Recent product additions
          executeQuery(
            `
          SELECT 
            'product' as type,
            CONCAT('New product added: ', name) as description,
            created_at as timestamp,
            id as related_id
          FROM products 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY created_at DESC
          LIMIT ?
        `,
            [Math.floor(limit / 3)]
          ),

          // Recent purchase orders
          executeQuery(
            `
          SELECT 
            'purchase_order' as type,
            CONCAT('Purchase order created: ', order_number) as description,
            created_at as timestamp,
            id as related_id
          FROM purchase_orders 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY created_at DESC
          LIMIT ?
        `,
            [Math.floor(limit / 3)]
          ),

          // Recent stock movements
          executeQuery(
            `
          SELECT 
            'stock_movement' as type,
            CONCAT('Stock ', movement_type, ': ', quantity, ' units') as description,
            created_at as timestamp,
            product_id as related_id
          FROM stock_movements 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY created_at DESC
          LIMIT ?
        `,
            [Math.floor(limit / 3)]
          ),
        ]);

      // Combine and sort all activities
      const allActivities = [
        ...productActivities,
        ...orderActivities,
        ...stockMovements,
      ];

      // Sort by timestamp descending and limit
      allActivities.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      const limitedActivities = allActivities.slice(0, limit);

      res.json(
        limitedActivities.map((activity) => ({
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
      const period = parseInt(req.query.period) || 30; // days

      // Get stock movements over time
      const trendsQuery = `
        SELECT 
          DATE(created_at) as date,
          movement_type,
          SUM(quantity) as total_quantity
        FROM stock_movements
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at), movement_type
        ORDER BY date DESC
      `;

      const trends = await executeQuery(trendsQuery, [period]);

      // Group data by date
      const trendData = {};
      trends.forEach((trend) => {
        const date = trend.date.toISOString().split("T")[0];
        if (!trendData[date]) {
          trendData[date] = { date, in: 0, out: 0 };
        }
        trendData[date][trend.movement_type] = trend.total_quantity;
      });

      // Convert to array and sort
      const sortedTrends = Object.values(trendData).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      res.json({
        trends: sortedTrends,
        period: period,
      });
    } catch (error) {
      console.error("Error fetching stock trends:", error);
      res.status(500).json({ error: "Failed to fetch stock trends" });
    }
  },

  // Get category breakdown
  getCategoryBreakdown: async (req, res) => {
    try {
      const query = `
        SELECT 
          category,
          COUNT(*) as product_count,
          SUM(stock_quantity) as total_stock,
          SUM(stock_quantity * price) as total_value,
          COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_count
        FROM products
        GROUP BY category
        ORDER BY total_value DESC
      `;

      const categories = await executeQuery(query);

      res.json({
        categories: categories.map((cat) => ({
          name: cat.category,
          productCount: cat.product_count,
          totalStock: cat.total_stock,
          totalValue: parseFloat(cat.total_value) || 0,
          lowStockCount: cat.low_stock_count || 0,
        })),
      });
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: "Failed to fetch category breakdown" });
    }
  },

  // Get supplier performance
  getSupplierPerformance: async (req, res) => {
    try {
      const query = `
        SELECT 
          s.id,
          s.name,
          COUNT(po.id) as order_count,
          COALESCE(SUM(po.total_amount), 0) as total_value,
          COALESCE(AVG(po.total_amount), 0) as avg_order_value,
          COUNT(CASE WHEN po.status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN po.status = 'pending' THEN 1 END) as pending_orders,
          MAX(po.created_at) as last_order_date
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE s.status = 'active'
        GROUP BY s.id, s.name
        HAVING order_count > 0
        ORDER BY total_value DESC
        LIMIT 10
      `;

      const suppliers = await executeQuery(query);

      res.json({
        suppliers: suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          orderCount: supplier.order_count || 0,
          totalValue: parseFloat(supplier.total_value) || 0,
          avgOrderValue: parseFloat(supplier.avg_order_value) || 0,
          completedOrders: supplier.completed_orders || 0,
          pendingOrders: supplier.pending_orders || 0,
          lastOrderDate: supplier.last_order_date,
        })),
      });
    } catch (error) {
      console.error("Error fetching supplier performance:", error);
      res.status(500).json({ error: "Failed to fetch supplier performance" });
    }
  },

  // Get low stock alerts
  getLowStock: async (req, res) => {
    try {
      const query = `
        SELECT 
          p.*,
          s.name as supplier_name,
          CASE 
            WHEN p.stock_quantity = 0 THEN 'critical'
            WHEN p.stock_quantity <= (p.min_stock_level * 0.5) THEN 'high'
            ELSE 'medium'
          END as priority
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.stock_quantity <= p.min_stock_level
        ORDER BY 
          p.stock_quantity ASC,
          CASE 
            WHEN p.stock_quantity = 0 THEN 1
            WHEN p.stock_quantity <= (p.min_stock_level * 0.5) THEN 2
            ELSE 3
          END
        LIMIT 20
      `;

      const lowStockProducts = await executeQuery(query);

      res.json({
        products: lowStockProducts.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          currentStock: product.stock_quantity,
          minStock: product.min_stock_level,
          priority: product.priority,
          supplier: {
            id: product.supplier_id,
            name: product.supplier_name,
          },
          value: parseFloat(product.price) * product.stock_quantity,
        })),
      });
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  },
};

module.exports = dashboardController;
