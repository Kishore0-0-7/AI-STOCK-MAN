const express = require("express");
const router = express.Router();
const db = require("../config/db.cjs");

// Get dashboard overview data
router.get("/overview", (req, res) => {
  const queries = {
    totalProducts: `SELECT COUNT(*) as count FROM products`,
    totalSuppliers: `SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1`,
    totalCustomers: `SELECT COUNT(*) as count FROM customers`,
    lowStockAlerts: `SELECT COUNT(*) as count FROM products WHERE current_stock <= low_stock_threshold AND alert_status = 'active'`,
    outOfStock: `SELECT COUNT(*) as count FROM products WHERE current_stock = 0`,
    totalInventoryValue: `SELECT SUM(current_stock * price) as total FROM products`,
    pendingOrders: `SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ('pending', 'sent', 'approved')`,
    monthlyRevenue: `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM purchase_orders WHERE status = 'completed' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, result) => {
      if (err) {
        console.error(`Error executing ${key} query:`, err);
        results[key] = 0;
      } else {
        results[key] =
          result[0].count || result[0].total || result[0].revenue || 0;
      }

      completed++;
      if (completed === totalQueries) {
        res.json(results);
      }
    });
  });
});

// Get recent activity for dashboard
router.get("/recent-activity", (req, res) => {
  const query = `
    SELECT 
      'product_added' as type,
      CONCAT('Added product: ', name) as description,
      created_at as timestamp
    FROM products 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    
    UNION ALL
    
    SELECT 
      'alert_created' as type,
      CONCAT('Low stock alert: ', name) as description,
      low_stock_alert_time as timestamp
    FROM products 
    WHERE low_stock_alert_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    AND alert_status = 'active'
    
    UNION ALL
    
    SELECT 
      'purchase_order' as type,
      CONCAT('Purchase Order ', po_number, ' created') as description,
      created_at as timestamp
    FROM purchase_orders 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    
    ORDER BY timestamp DESC 
    LIMIT 10
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching recent activity:", err);
      return res.status(500).json({ error: "Failed to fetch recent activity" });
    }
    res.json(results);
  });
});

// Get stock level trends for charts
router.get("/stock-trends", (req, res) => {
  const query = `
    SELECT 
      category,
      COUNT(*) as total_products,
      SUM(CASE WHEN current_stock <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count,
      SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
      AVG(current_stock) as avg_stock
    FROM products 
    GROUP BY category
    ORDER BY total_products DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching stock trends:", err);
      return res.status(500).json({ error: "Failed to fetch stock trends" });
    }
    res.json(results);
  });
});

// Get top low stock products
router.get("/top-alerts", (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.category,
      p.current_stock,
      p.low_stock_threshold,
      p.alert_priority,
      s.name as supplier_name,
      ROUND(((p.low_stock_threshold - p.current_stock) / p.low_stock_threshold * 100), 2) as urgency_score
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.current_stock <= p.low_stock_threshold 
    AND p.alert_status = 'active'
    ORDER BY p.current_stock ASC, p.alert_priority DESC
    LIMIT 10
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching top alerts:", err);
      return res.status(500).json({ error: "Failed to fetch top alerts" });
    }
    res.json(results);
  });
});

// Get monthly sales/purchase data for charts
router.get("/monthly-data/:year?", (req, res) => {
  const year = req.params.year || new Date().getFullYear();

  const query = `
    SELECT 
      MONTH(created_at) as month,
      MONTHNAME(created_at) as month_name,
      COUNT(*) as order_count,
      SUM(total_amount) as total_amount
    FROM purchase_orders 
    WHERE YEAR(created_at) = ? 
    AND status IN ('completed', 'delivered')
    GROUP BY MONTH(created_at), MONTHNAME(created_at)
    ORDER BY MONTH(created_at)
  `;

  db.query(query, [year], (err, results) => {
    if (err) {
      console.error("Error fetching monthly data:", err);
      return res.status(500).json({ error: "Failed to fetch monthly data" });
    }

    // Fill missing months with zero values
    const monthData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const existing = results.find((r) => r.month === month);
      return {
        month,
        month_name: new Date(year, i).toLocaleString("default", {
          month: "long",
        }),
        order_count: existing ? existing.order_count : 0,
        total_amount: existing ? parseFloat(existing.total_amount) : 0,
      };
    });

    res.json(monthData);
  });
});

// Get stock forecast data (simple prediction based on consumption trends)
router.get("/forecast", (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.category,
      p.current_stock,
      p.low_stock_threshold,
      p.reorder_point,
      COALESCE(AVG(po.quantity), 0) as avg_order_quantity,
      COUNT(po.id) as order_frequency,
      DATEDIFF(NOW(), MAX(po.created_at)) as days_since_last_order
    FROM products p
    LEFT JOIN po_line_items pli ON p.id = pli.product_id
    LEFT JOIN purchase_orders po ON pli.po_id = po.id
    WHERE p.current_stock > 0
    GROUP BY p.id, p.name, p.category, p.current_stock, p.low_stock_threshold, p.reorder_point
    HAVING p.current_stock <= (p.low_stock_threshold * 2)
    ORDER BY p.current_stock ASC
    LIMIT 20
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching forecast data:", err);
      return res.status(500).json({ error: "Failed to fetch forecast data" });
    }

    const forecast = results.map((item) => {
      // Simple forecast calculation
      const consumption_rate = item.avg_order_quantity || 10;
      const days_until_empty = Math.floor(
        item.current_stock / (consumption_rate / 30)
      );
      const suggested_order_quantity = Math.max(
        item.reorder_point,
        item.avg_order_quantity * 2
      );

      return {
        ...item,
        days_until_empty: days_until_empty > 0 ? days_until_empty : 1,
        suggested_order_quantity,
        forecast_status:
          days_until_empty <= 7
            ? "urgent"
            : days_until_empty <= 14
            ? "warning"
            : "normal",
      };
    });

    res.json(forecast);
  });
});

module.exports = router;
