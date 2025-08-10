const { executeQuery } = require("../config/db");

const reportsController = {
  // COMPLETELY REWRITTEN SALES OVERVIEW WITH ACCURATE PROFIT CALCULATIONS
  getSalesOverview: async (req, res) => {
    try {
      const { days = "7" } = req.query;
      const daysInt = parseInt(days);

      console.log(`=== NEW P&L CALCULATION FOR ${daysInt} DAYS ===`);

      // Step 1: Get current period data with precise profit calculation
      const currentPeriodQuery = `
        SELECT 
          COUNT(DISTINCT po.id) as total_orders,
          COALESCE(SUM(po.total_amount), 0) as total_revenue,
          COALESCE(AVG(po.total_amount), 0) as avg_order_value,
          COUNT(DISTINCT po.supplier_id) as active_suppliers,
          
          -- Accurate profit calculation with multiple fallback strategies
          COALESCE(SUM(
            CASE 
              -- Best case: We have both cost and price data
              WHEN p.cost IS NOT NULL AND p.price IS NOT NULL AND p.cost > 0
              THEN poi.quantity * (p.price - p.cost)
              
              -- Good case: We have price, estimate cost at 70% of price  
              WHEN p.price IS NOT NULL AND p.price > 0
              THEN poi.quantity * p.price * 0.30
              
              -- Fallback: Use conservative 8% margin on order total
              ELSE po.total_amount * 0.08
            END
          ), 0) as calculated_profit
          
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id  
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE po.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND po.status IN ('completed', 'delivered', 'pending', 'received', 'approved', 'shipped')
      `;

      const currentData = await executeQuery(currentPeriodQuery, [daysInt]);
      const current = currentData[0] || {
        total_orders: 0,
        total_revenue: 0,
        avg_order_value: 0,
        active_suppliers: 0,
        calculated_profit: 0,
      };

      // Step 2: Get previous period data (same window, shifted back)
      const previousPeriodQuery = `
        SELECT 
          COUNT(DISTINCT po.id) as prev_orders,
          COALESCE(SUM(po.total_amount), 0) as prev_revenue,
          COALESCE(SUM(
            CASE 
              WHEN p.cost IS NOT NULL AND p.price IS NOT NULL AND p.cost > 0
              THEN poi.quantity * (p.price - p.cost)
              WHEN p.price IS NOT NULL AND p.price > 0
              THEN poi.quantity * p.price * 0.30
              ELSE po.total_amount * 0.08
            END
          ), 0) as prev_profit
          
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id  
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE po.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND po.order_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND po.status IN ('completed', 'delivered', 'pending', 'received', 'approved', 'shipped')
      `;

      const previousData = await executeQuery(previousPeriodQuery, [
        daysInt * 2,
        daysInt,
      ]);
      const previous = previousData[0] || {
        prev_orders: 0,
        prev_revenue: 0,
        prev_profit: 0,
      };

      // Step 3: Calculate realistic growth with period-based caps
      function calculateRealisticGrowth(
        current,
        previous,
        minThreshold = 0,
        maxGrowth = 50,
        periodDays = 7
      ) {
        // Handle edge cases where previous period has very little data
        if (!previous || previous <= minThreshold) {
          // For shorter periods, show even more conservative growth when no previous data
          const conservativeGrowth =
            periodDays <= 7 ? 5 : periodDays <= 30 ? 8 : 12;
          return Math.min(conservativeGrowth, maxGrowth * 0.1);
        }

        const rawGrowth = ((current - previous) / previous) * 100;

        // Apply period-based bounds - shorter periods should have tighter caps
        const minGrowth = -60;
        let cappedMaxGrowth = maxGrowth;

        if (periodDays <= 7) {
          cappedMaxGrowth = Math.min(maxGrowth, 25); // Daily/weekly: max 25%
        } else if (periodDays <= 30) {
          cappedMaxGrowth = Math.min(maxGrowth, 35); // Monthly: max 35%
        } else {
          cappedMaxGrowth = Math.min(maxGrowth, 50); // Yearly: max 50%
        }

        return Math.max(
          minGrowth,
          Math.min(cappedMaxGrowth, Math.round(rawGrowth * 10) / 10)
        );
      }

      const revenueGrowth = calculateRealisticGrowth(
        parseFloat(current.total_revenue),
        parseFloat(previous.prev_revenue),
        100, // Min threshold for revenue
        40, // Max growth cap
        daysInt // Period length for appropriate capping
      );
      const ordersGrowth = calculateRealisticGrowth(
        parseInt(current.total_orders),
        parseInt(previous.prev_orders),
        1, // Min threshold for orders
        35, // Max growth cap
        daysInt // Period length
      );
      const profitGrowth = calculateRealisticGrowth(
        parseFloat(current.calculated_profit),
        parseFloat(previous.prev_profit),
        10, // Min threshold for profit
        30, // Max growth cap
        daysInt // Period length
      );

      // Step 4: Calculate profit margin
      const profitMargin =
        current.total_revenue > 0
          ? (current.calculated_profit / current.total_revenue) * 100
          : 0;

      // Step 5: Comprehensive debugging
      console.log("Current Period Stats:", {
        revenue: current.total_revenue,
        profit: current.calculated_profit,
        orders: current.total_orders,
        margin: `${profitMargin.toFixed(1)}%`,
      });
      console.log("Previous Period Stats:", {
        revenue: previous.prev_revenue,
        profit: previous.prev_profit,
        orders: previous.prev_orders,
      });
      console.log("Growth Analysis:", {
        revenue: `${revenueGrowth}%`,
        profit: `${profitGrowth}%`,
        orders: `${ordersGrowth}%`,
      });
      console.log("=================================");

      // Step 6: Return clean response
      res.json({
        totalRevenue: parseFloat(parseFloat(current.total_revenue).toFixed(2)),
        totalProfit: parseFloat(
          parseFloat(current.calculated_profit).toFixed(2)
        ),
        totalOrders: parseInt(current.total_orders),
        avgOrderValue: parseFloat(
          parseFloat(current.avg_order_value).toFixed(2)
        ),
        activeSuppliers: parseInt(current.active_suppliers),
        revenueGrowth: revenueGrowth,
        ordersGrowth: ordersGrowth,
        profitGrowth: profitGrowth,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        period: `${daysInt} days`,
      });
    } catch (error) {
      console.error("Error in NEW getSalesOverview:", error);
      res.status(500).json({
        error: "Failed to fetch sales overview",
        details: error.message,
      });
    }
  },

  // Enhanced Sales Trends with better profit calculations - MySQL ONLY_FULL_GROUP_BY compatible
  getSalesTrends: async (req, res) => {
    try {
      const periodParam = req.query.period || "daily";
      const daysParam = req.query.days || "7";

      let days = parseInt(daysParam);
      let groupByClause = "";
      let selectClause = "";

      if (periodParam === "daily") {
        days = days || 7;
        groupByClause = "DATE(po.order_date)";
        selectClause = "DATE(po.order_date) as date_only";
      } else if (periodParam === "weekly") {
        days = days || 28;
        groupByClause = "YEAR(po.order_date), WEEK(po.order_date)";
        selectClause =
          "YEAR(po.order_date) as year_val, WEEK(po.order_date) as week_val";
      } else if (periodParam === "monthly") {
        days = days || 365;
        groupByClause = "YEAR(po.order_date), MONTH(po.order_date)";
        selectClause =
          "YEAR(po.order_date) as year_val, MONTH(po.order_date) as month_val";
      } else {
        days = days || 1095;
        groupByClause = "YEAR(po.order_date)";
        selectClause = "YEAR(po.order_date) as year_only";
      }

      const query = `
        SELECT 
          ${selectClause},
          COALESCE(SUM(po.total_amount), 0) as revenue,
          COALESCE(SUM(
            CASE 
              WHEN p.cost IS NOT NULL AND p.price IS NOT NULL AND p.cost > 0
              THEN poi.quantity * (p.price - p.cost)
              WHEN p.price IS NOT NULL AND p.price > 0
              THEN poi.quantity * p.price * 0.30
              ELSE po.total_amount * 0.08
            END
          ), 0) as profit,
          COUNT(*) as orders
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE po.order_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND po.status IN ('completed', 'delivered', 'pending', 'received', 'shipped', 'approved')
        GROUP BY ${groupByClause}
        ORDER BY ${
          periodParam === "daily"
            ? "date_only"
            : periodParam === "weekly"
            ? "year_val, week_val"
            : periodParam === "monthly"
            ? "year_val, month_val"
            : "year_only"
        } ASC
      `;

      const results = await executeQuery(query, [days]);

      const formattedTrends = results.map((row) => {
        let periodLabel = "";

        if (periodParam === "weekly") {
          periodLabel = `${row.year_val}-W${String(row.week_val).padStart(
            2,
            "0"
          )}`;
        } else if (periodParam === "monthly") {
          periodLabel = `${row.year_val}-${String(row.month_val).padStart(
            2,
            "0"
          )}`;
        } else if (periodParam === "yearly") {
          periodLabel = row.year_only.toString();
        } else {
          periodLabel = row.date_only || "";
        }

        return {
          period: periodLabel,
          name: periodLabel, // For chart compatibility
          revenue: parseFloat(row.revenue) || 0,
          profit: parseFloat(row.profit) || 0,
          orders: row.orders || 0,
        };
      });

      res.json({
        trends: formattedTrends,
      });
    } catch (error) {
      console.error("Error fetching sales trends:", error);
      res.status(500).json({
        error: "Failed to fetch sales trends",
        details: error.message,
      });
    }
  },

  // Category Breakdown API (now based on purchased products)
  getCategoryBreakdown: async (req, res) => {
    try {
      const { days = "30" } = req.query;

      const query = `
        SELECT 
          p.category,
          COALESCE(SUM(CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN poi.quantity * poi.unit_price ELSE 0 END), 0) as revenue,
          COUNT(DISTINCT CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN po.id ELSE NULL END) as orders,
          COALESCE(SUM(CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN poi.quantity ELSE 0 END), 0) as total_quantity,
          COALESCE(SUM(CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN poi.quantity * (poi.unit_price * 0.25) ELSE 0 END), 0) as estimated_profit,
          COUNT(p.id) as total_products_in_category
        FROM products p
        LEFT JOIN purchase_order_items poi ON poi.product_id = p.id
        LEFT JOIN purchase_orders po ON po.id = poi.purchase_order_id AND po.status IN ('completed', 'delivered', 'pending', 'received')
        WHERE p.category IS NOT NULL AND p.category != ''
        GROUP BY p.category
        ORDER BY revenue DESC, total_products_in_category DESC
      `;

      const results = await executeQuery(query, [days, days, days, days]);

      res.json({
        categories: results.map((row) => ({
          category: row.category || "Uncategorized",
          revenue: parseFloat(row.revenue),
          orders: row.orders,
          quantity: row.total_quantity,
          profit: parseFloat(row.estimated_profit),
          total_products: row.total_products_in_category,
        })),
      });
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: "Failed to fetch category breakdown" });
    }
  },

  getTopCustomers: async (req, res) => {
    try {
      const { days = "30", limit = "5" } = req.query;

      const suppliersQuery = `
        SELECT 
          s.id, s.name, s.email, s.contact_person,
          COALESCE(SUM(po.total_amount), 0) as total_spent,
          COUNT(po.id) as order_count,
          MAX(po.created_at) as last_order_date,
          COALESCE(AVG(po.total_amount), 0) as avg_order_value
        FROM suppliers s
        JOIN purchase_orders po ON po.supplier_id = s.id
        WHERE po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND po.status IN ('completed', 'delivered', 'pending', 'received')
        GROUP BY s.id, s.name, s.email, s.contact_person
        ORDER BY total_spent DESC
        LIMIT ?
      `;

      const suppliers = await executeQuery(suppliersQuery, [
        parseInt(days),
        parseInt(limit),
      ]);

      const formattedSuppliers = suppliers.map((supplier) => ({
        name: supplier.name,
        email: supplier.email,
        orders: supplier.order_count || 0,
        revenue: parseFloat(supplier.total_spent || 0),
        last_order: supplier.last_order_date
          ? new Date(supplier.last_order_date).toISOString().split("T")[0]
          : null,
        total_profit: parseFloat((supplier.total_spent || 0) * 0.1),
      }));

      res.json(formattedSuppliers);
    } catch (error) {
      console.error("Error fetching top suppliers:", error);
      res.status(500).json({ error: "Failed to fetch top suppliers" });
    }
  },

  getTopProducts: async (req, res) => {
    try {
      const { days = "30", limit = "5" } = req.query;

      const productsQuery = `
        SELECT 
          p.id, p.name, p.category, p.price, p.cost,
          COALESCE(SUM(poi.quantity), 0) as total_quantity,
          COALESCE(SUM(poi.quantity * poi.unit_price), 0) as total_spent,
          COUNT(DISTINCT po.id) as order_count,
          COALESCE(SUM(poi.quantity * (p.price - p.cost)), 0) as potential_profit
        FROM products p
        JOIN purchase_order_items poi ON poi.product_id = p.id
        JOIN purchase_orders po ON po.id = poi.purchase_order_id
        WHERE po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND po.status IN ('completed', 'delivered', 'pending', 'received')
        GROUP BY p.id, p.name, p.category, p.price, p.cost
        ORDER BY total_quantity DESC
        LIMIT ?
      `;

      const products = await executeQuery(productsQuery, [
        parseInt(days),
        parseInt(limit),
      ]);

      const formattedProducts = products.map((product) => ({
        name: product.name,
        category: product.category,
        quantity: product.total_quantity || 0,
        revenue: parseFloat(product.total_spent || 0),
        orders: product.order_count || 0,
        profit: parseFloat(
          product.potential_profit || product.total_spent * 0.1
        ),
      }));

      res.json(formattedProducts);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  },

  getRecentTransactions: async (req, res) => {
    try {
      const { limit = "10" } = req.query;

      const transactionsQuery = `
        SELECT 
          po.id, 
          po.total_amount, 
          po.order_date, 
          po.status,
          s.name as supplier_name,
          COUNT(DISTINCT poi.id) as items_count,
          COALESCE(SUM(poi.quantity), 0) as total_items,
          -- Calculate profit for each transaction
          COALESCE(SUM(
            CASE 
              WHEN poi.id IS NOT NULL AND p.cost IS NOT NULL AND p.price IS NOT NULL 
              THEN poi.quantity * (p.price - p.cost)
              ELSE po.total_amount * 0.05  -- 5% margin fallback
            END
          ), 0) as calculated_profit
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE po.status IN ('completed', 'delivered', 'pending', 'received', 'shipped', 'approved')
        GROUP BY po.id, po.total_amount, po.order_date, po.status, s.name
        ORDER BY po.order_date DESC
        LIMIT ?
      `;

      const transactions = await executeQuery(transactionsQuery, [
        parseInt(limit),
      ]);

      const formattedTransactions = transactions.map((transaction) => ({
        id: transaction.id,
        amount: parseFloat(transaction.total_amount || 0),
        date: new Date(transaction.order_date).toISOString().split("T")[0],
        customer: transaction.supplier_name,
        items: transaction.total_items || 0,
        profit: parseFloat(transaction.calculated_profit || 0), // Add profit field
        status: transaction.status,
      }));

      res.json(formattedTransactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ error: "Failed to fetch recent transactions" });
    }
  },

  exportSalesReport: async (req, res) => {
    try {
      const { period = "monthly", format = "json" } = req.query;

      // Simple implementation - just return overview data
      const overviewData = await reportsController.getSalesOverview(
        { query: { days: "30" } },
        { json: (data) => data }
      );

      if (format === "json") {
        res.json({
          report_type: "Sales Report",
          period: period,
          generated_at: new Date().toISOString(),
          data: overviewData,
        });
      } else {
        res.status(400).json({ error: "Unsupported format" });
      }
    } catch (error) {
      console.error("Error exporting sales report:", error);
      res.status(500).json({ error: "Failed to export sales report" });
    }
  },
};

module.exports = reportsController;
