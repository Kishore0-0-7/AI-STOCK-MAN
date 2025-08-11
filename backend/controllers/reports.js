const { executeQuery } = require("../config/db");

const reportsController = {
  // Procurement Overview API with accurate P&L calculation
  getSalesOverview: async (req, res) => {
    try {
      const periodParam = req.query.period || "daily";
      const daysParam = req.query.days || "7";
      const compareMode = (req.query.compare || "full").toLowerCase(); // 'full' | 'ptd'

      // Convert period to days if needed
      let days = parseInt(daysParam);
      if (isNaN(days) || days <= 0) {
        days = periodParam === "daily" ? 7 : periodParam === "weekly" ? 28 : 30;
      }

      // We'll use a consistent order date across the app
      const dateField = "COALESCE(po.order_date, po.created_at)";

      // Build a derived table that aggregates per order to avoid double counting when joining items
      const makeAggregateQuery = (rangeWhere) => `
        SELECT 
          SUM(t.order_revenue)                AS total_spending,
          COUNT(*)                            AS total_orders,
          AVG(t.order_revenue)                AS avg_order_value,
          COUNT(DISTINCT t.supplier_id)       AS active_suppliers,
          SUM(t.order_profit)                 AS actual_profit
        FROM (
          SELECT 
            po.id,
            po.supplier_id,
            ${dateField}        AS order_date,
            -- Real revenue from item lines when available, otherwise fall back to the order total
            COALESCE(SUM(poi.quantity * poi.unit_price), po.total_amount) AS order_revenue,
            -- Profit based on product price vs cost for each item; if missing cost/price, fallback to 5%
            COALESCE(SUM(CASE 
              WHEN p.cost IS NOT NULL AND p.price IS NOT NULL THEN poi.quantity * (p.price - p.cost)
              ELSE 0
            END), po.total_amount * 0.05) AS order_profit
          FROM purchase_orders po
          LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
          LEFT JOIN products p ON poi.product_id = p.id
          WHERE ${rangeWhere}
            AND po.status IN ('completed', 'delivered', 'pending', 'received', 'approved', 'shipped')
          GROUP BY po.id, po.supplier_id, ${dateField}
        ) t`;

      // Build aligned periods for comparison
      let currentAggQuery = "";
      let previousAggQuery = "";
      let currentParams = [];
      let previousParams = [];

      if (periodParam === "weekly") {
        // Weekly: use rolling 7-day windows ending today vs previous 7 days
        currentAggQuery = makeAggregateQuery(
          `${dateField} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND ${dateField} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`
        );
        previousAggQuery = makeAggregateQuery(
          `${dateField} >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND ${dateField} < DATE_SUB(CURDATE(), INTERVAL 6 DAY)`
        );
      } else if (compareMode === "ptd") {
        // Period-to-date comparisons
        if (periodParam === "monthly") {
          currentAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND ${dateField} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`
          );
          previousAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') AND ${dateField} < LEAST(DATE_ADD(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'), INTERVAL DAY(CURDATE()) DAY), DATE_ADD(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), INTERVAL 1 DAY))`
          );
        } else if (periodParam === "yearly") {
          currentAggQuery = makeAggregateQuery(
            `${dateField} >= MAKEDATE(YEAR(CURDATE()),1) AND ${dateField} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`
          );
          previousAggQuery = makeAggregateQuery(
            `${dateField} >= MAKEDATE(YEAR(CURDATE())-1,1) AND ${dateField} < DATE_ADD(MAKEDATE(YEAR(CURDATE())-1,1), INTERVAL DAYOFYEAR(CURDATE()) DAY)`
          );
        } else {
          const daysInt = Number.isFinite(days) ? parseInt(days, 10) : 7;
          const curStartOffset = Math.max(daysInt - 1, 0);
          const prevStartOffset = 2 * daysInt - 1;
          currentAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_SUB(CURDATE(), INTERVAL ${curStartOffset} DAY) AND ${dateField} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`
          );
          previousAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_SUB(CURDATE(), INTERVAL ${prevStartOffset} DAY) AND ${dateField} < DATE_SUB(CURDATE(), INTERVAL ${curStartOffset} DAY)`
          );
        }
      } else {
        // Full completed period comparisons
        if (periodParam === "monthly") {
          currentAggQuery = makeAggregateQuery(
            `DATE_FORMAT(${dateField}, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')`
          );
          previousAggQuery = makeAggregateQuery(
            `DATE_FORMAT(${dateField}, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m')`
          );
        } else if (periodParam === "weekly") {
          // For weekly, also use rolling 7-day windows to avoid data gaps
          currentAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND ${dateField} < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`
          );
          previousAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND ${dateField} < DATE_SUB(CURDATE(), INTERVAL 6 DAY)`
          );
        } else if (periodParam === "yearly") {
          currentAggQuery = makeAggregateQuery(
            `YEAR(${dateField}) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 YEAR))`
          );
          previousAggQuery = makeAggregateQuery(
            `YEAR(${dateField}) = YEAR(DATE_SUB(CURDATE(), INTERVAL 2 YEAR))`
          );
        } else {
          currentAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND ${dateField} < CURDATE()`
          );
          previousAggQuery = makeAggregateQuery(
            `${dateField} >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND ${dateField} < DATE_SUB(CURDATE(), INTERVAL ? DAY)`
          );
          currentParams = [days];
          previousParams = [days * 2, days];
        }
      }

      const currentResults = await executeQuery(currentAggQuery, currentParams);
      const current = currentResults[0] || {
        total_spending: 0,
        total_orders: 0,
        avg_order_value: 0,
        active_suppliers: 0,
        actual_profit: 0,
      };

      const previousResults = await executeQuery(
        previousAggQuery,
        previousParams
      );
      const previous = previousResults[0] || {
        total_spending: 0,
        total_orders: 0,
        actual_profit: 0,
      };

      // Precise growth calculations (no artificial caps)
      const pct = (curr, prev) => {
        const EPS = 1e-6;
        if (Math.abs(prev) > EPS) return ((curr - prev) / prev) * 100;
        // No baseline: avoid misleading 100% spikes
        return 0;
      };

      const revenueGrowth = pct(
        current.total_spending || 0,
        previous.total_spending || 0
      );
      const ordersGrowth = pct(
        current.total_orders || 0,
        previous.total_orders || 0
      );
      const profitGrowth = pct(
        current.actual_profit || 0,
        previous.actual_profit || 0
      );

      console.log("P&L calculation (accurate, per-order):", {
        current_revenue: current.total_spending,
        previous_revenue: previous.total_spending,
        current_profit: current.actual_profit,
        previous_profit: previous.actual_profit,
        current_orders: current.total_orders,
        previous_orders: previous.total_orders,
        revenueGrowth: revenueGrowth.toFixed(2),
        ordersGrowth: ordersGrowth.toFixed(2),
        profitGrowth: profitGrowth.toFixed(2),
        time_period: `${days} days`,
      });

      // Create a friendly period label
      const periodLabel = (() => {
        if (compareMode === "ptd") {
          if (periodParam === "monthly") return "Month to date";
          if (periodParam === "weekly") return "Week to date";
          if (periodParam === "yearly") return "Year to date";
          return `${days} days (incl. today)`;
        }
        if (periodParam === "monthly") return "Last Month";
        if (periodParam === "weekly") return "Last Week";
        if (periodParam === "yearly") return "Last Year";
        return `${days} days`;
      })();

      res.json({
        totalRevenue: parseFloat(current.total_spending || 0),
        totalProfit: parseFloat(current.actual_profit || 0),
        totalOrders: current.total_orders || 0,
        avgOrderValue: parseFloat(current.avg_order_value || 0),
        activeSuppliers: current.active_suppliers || 0,
        revenueGrowth: parseFloat((revenueGrowth || 0).toFixed(2)),
        ordersGrowth: parseFloat((ordersGrowth || 0).toFixed(2)),
        profitGrowth: parseFloat((profitGrowth || 0).toFixed(2)),
        period: periodLabel,
        previousRevenue: parseFloat(previous.total_spending || 0),
        previousProfit: parseFloat(previous.actual_profit || 0),
        previousOrders: previous.total_orders || 0,
        compareMode,
        profitMargin:
          (current.total_spending || 0) > 0
            ? parseFloat(
                (
                  (current.actual_profit / current.total_spending) *
                  100
                ).toFixed(2)
              )
            : 0,
      });
    } catch (error) {
      console.error("Error fetching procurement overview:", error);
      res.status(500).json({ error: "Failed to fetch procurement overview" });
    }
  },

  // Procurement Trends API (changed from Sales Trends)
  getSalesTrends: async (req, res) => {
    try {
      const periodParam = req.query.period || "daily";
      const daysParam = req.query.days || "7";

      // Convert period to days if needed
      let days = parseInt(daysParam);
      const dateField = "COALESCE(po.order_date, po.created_at)";
      let groupByClause = "";
      let selectClause = "";

      if (periodParam === "daily") {
        days = days || 7;
        groupByClause = "DATE(t.order_date)";
        selectClause =
          "DATE(t.order_date) as label, DATE(t.order_date) as date_only";
      } else if (periodParam === "weekly") {
        days = days || 28; // 4 weeks
        groupByClause = "YEARWEEK(t.order_date, 1)";
        selectClause =
          "YEARWEEK(t.order_date, 1) as label, MIN(DATE(t.order_date)) as date_only";
      } else if (periodParam === "monthly") {
        days = days || 365; // 1 year
        groupByClause = 'DATE_FORMAT(t.order_date, "%Y-%m")';
        selectClause =
          'DATE_FORMAT(t.order_date, "%Y-%m") as label, MIN(DATE(t.order_date)) as date_only';
      } else if (periodParam === "yearly") {
        days = days || 1095; // 3 years
        groupByClause = "YEAR(t.order_date)";
        selectClause =
          "YEAR(t.order_date) as label, MIN(DATE(t.order_date)) as date_only";
      }

      if (isNaN(days) || days <= 0) {
        days =
          periodParam === "daily"
            ? 7
            : periodParam === "weekly"
            ? 28
            : periodParam === "monthly"
            ? 365
            : 1095;
      }
      // Build a per-order aggregate first to avoid revenue duplication from joins
      const trendsQuery = `
        SELECT 
          ${selectClause},
          SUM(t.order_revenue) as revenue,
          SUM(t.order_profit)  as profit,
          COUNT(*)             as orders
        FROM (
          SELECT 
            po.id,
            ${dateField} AS order_date,
            COALESCE(SUM(poi.quantity * poi.unit_price), po.total_amount) AS order_revenue,
            COALESCE(SUM(CASE 
              WHEN p.cost IS NOT NULL AND p.price IS NOT NULL THEN poi.quantity * (p.price - p.cost)
              ELSE 0
            END), po.total_amount * 0.05) AS order_profit
          FROM purchase_orders po
          LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
          LEFT JOIN products p ON poi.product_id = p.id
          WHERE ${dateField} >= DATE_SUB(NOW(), INTERVAL ? DAY)
            AND po.status IN ('completed', 'delivered', 'pending', 'received', 'shipped', 'approved')
          GROUP BY po.id, ${dateField}
        ) t
        GROUP BY ${groupByClause}
        ORDER BY date_only ASC
      `;

      const finalResults = await executeQuery(trendsQuery, [days]);

      // Format results for frontend compatibility
      const formattedTrends = finalResults.map((row) => {
        let periodLabel = "";
        if (periodParam === "weekly") {
          periodLabel = `Week ${row.label}`;
        } else if (periodParam === "monthly") {
          periodLabel = row.label || "";
        } else if (periodParam === "yearly") {
          periodLabel = `${row.label}`;
        } else {
          periodLabel = row.date_only
            ? new Date(row.date_only).toISOString().split("T")[0]
            : "";
        }

        return {
          period: periodLabel,
          name: periodLabel, // For chart compatibility
          revenue: parseFloat(row.revenue),
          profit: parseFloat(row.profit),
          orders: row.orders,
        };
      });

      res.json({
        trends: formattedTrends,
      });
    } catch (error) {
      console.error("Error fetching procurement trends:", error);
      res.status(500).json({ error: "Failed to fetch procurement trends" });
    }
  },

  // Category Breakdown API (now based on purchased products)
  getCategoryBreakdown: async (req, res) => {
    try {
      const { days = "30" } = req.query; // days

      const query = `
        SELECT 
          p.category,
          COALESCE(SUM(CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN poi.quantity * poi.unit_price ELSE 0 END), 0) as revenue,
          COUNT(DISTINCT CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN po.id ELSE NULL END) as orders,
          COALESCE(SUM(CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN poi.quantity ELSE 0 END), 0) as total_quantity,
          COALESCE(SUM(CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN poi.quantity * (poi.unit_price - p.cost) ELSE 0 END), 0) as estimated_profit,
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

  // Get top suppliers (renamed from getTopCustomers for consistency)
  getTopCustomers: async (req, res) => {
    try {
      const { days = "30", limit = "5" } = req.query;

      const suppliersQuery = `
        SELECT 
          s.id,
          s.name,
          s.email,
          s.contact_person,
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
        revenue: parseFloat(supplier.total_spent || 0), // Keep field name for frontend compatibility
        last_order: supplier.last_order_date
          ? new Date(supplier.last_order_date).toISOString().split("T")[0]
          : null,
        total_profit: parseFloat((supplier.total_spent || 0) * 0.1), // Estimated savings
      }));

      res.json(formattedSuppliers);
    } catch (error) {
      console.error("Error fetching top suppliers:", error);
      res.status(500).json({ error: "Failed to fetch top suppliers" });
    }
  },

  // Get top products (based on purchase quantities)
  getTopProducts: async (req, res) => {
    try {
      const { days = "30", limit = "5" } = req.query;

      const productsQuery = `
        SELECT 
          p.id,
          p.name,
          p.category,
          p.price,
          p.cost,
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
        days,
        parseInt(limit),
      ]);

      const formattedProducts = products.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: parseFloat(product.price || 0),
        sales: product.total_quantity || 0, // Keep field name for frontend compatibility
        revenue: parseFloat(product.total_spent || 0),
        profit: parseFloat(product.potential_profit || 0),
      }));

      res.json(formattedProducts);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  },

  // Get recent transactions (Purchase Orders)
  getRecentTransactions: async (req, res) => {
    try {
      const { limit = "10", search = "" } = req.query;

      let transactionsQuery = `
        SELECT 
          po.id,
          po.created_at,
          po.status,
          po.total_amount,
          po.expected_delivery_date,
          s.name as supplier_name,
          COUNT(poi.id) as item_count,
          COALESCE(po.total_amount * 0.1, 0) as estimated_savings
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        WHERE po.status IN ('completed', 'delivered', 'pending', 'received')
      `;

      const queryParams = [];

      if (search) {
        transactionsQuery += ` AND (po.id LIKE ? OR s.name LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      transactionsQuery += ` GROUP BY po.id, po.created_at, po.status, po.total_amount, po.expected_delivery_date, s.name ORDER BY po.created_at DESC LIMIT ?`;
      queryParams.push(parseInt(limit));

      const transactions = await executeQuery(transactionsQuery, queryParams);

      const formattedTransactions = transactions.map((txn) => ({
        id: `PO-${String(txn.id).padStart(6, "0")}`,
        date: txn.created_at
          ? new Date(txn.created_at).toISOString().split("T")[0]
          : null,
        customer: txn.supplier_name || "Unknown Supplier", // Keep field name for frontend compatibility
        items: txn.item_count || 0,
        amount: parseFloat(txn.total_amount || 0),
        profit: parseFloat(txn.estimated_savings || 0),
        status: txn.status || "pending",
      }));

      res.json(formattedTransactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ error: "Failed to fetch recent transactions" });
    }
  },

  // Export sales report data
  exportSalesReport: async (req, res) => {
    try {
      const { format = "json", period = "daily", days = "30" } = req.query;

      // Get comprehensive report data
      const [overview, trends, categories, customers, products, transactions] =
        await Promise.all([
          reportsController.getSalesOverview(
            { query: { period, days } },
            { json: (data) => data }
          ),
          reportsController.getSalesTrends(
            { query: { period, days } },
            { json: (data) => data }
          ),
          reportsController.getCategoryBreakdown(
            { query: { days } },
            { json: (data) => data }
          ),
          reportsController.getTopCustomers(
            { query: { days, limit: "10" } },
            { json: (data) => data }
          ),
          reportsController.getTopProducts(
            { query: { days, limit: "10" } },
            { json: (data) => data }
          ),
          reportsController.getRecentTransactions(
            { query: { limit: "50" } },
            { json: (data) => data }
          ),
        ]);

      const reportData = {
        generated_at: new Date().toISOString(),
        period: { type: period, days: parseInt(days) },
        overview,
        trends,
        categories,
        top_customers: customers,
        top_products: products,
        recent_transactions: transactions,
      };

      if (format === "csv") {
        // Convert to CSV format for transactions
        const csvHeaders = "ID,Date,Customer,Items,Amount,Profit,Status\n";
        const csvRows = transactions
          .map(
            (txn) =>
              `${txn.id},"${txn.date}","${txn.customer}",${txn.items},${txn.amount},${txn.profit},"${txn.status}"`
          )
          .join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="sales-report.csv"'
        );
        res.send(csvHeaders + csvRows);
      } else {
        res.json(reportData);
      }
    } catch (error) {
      console.error("Error exporting sales report:", error);
      res.status(500).json({ error: "Failed to export sales report" });
    }
  },
};

module.exports = reportsController;
