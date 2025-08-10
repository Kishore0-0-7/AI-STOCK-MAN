const { executeQuery } = require("../config/database");

const reportsController = {
  // Get sales reports with filtering
  getSalesReports: async (req, res) => {
    try {
      const startDate =
        req.query.startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const endDate =
        req.query.endDate || new Date().toISOString().split("T")[0];
      const category = req.query.category;
      const supplierId = req.query.supplierId;

      // Since we don't have actual sales data, we'll create mock sales based on stock movements
      let whereClause = "sm.created_at >= ? AND sm.created_at <= ?";
      let queryParams = [startDate, endDate];

      if (category && category !== "all") {
        whereClause += " AND p.category = ?";
        queryParams.push(category);
      }

      if (supplierId && supplierId !== "all") {
        whereClause += " AND p.supplier_id = ?";
        queryParams.push(supplierId);
      }

      const salesQuery = `
        SELECT 
          DATE(sm.created_at) as sale_date,
          p.category,
          p.name as product_name,
          s.name as supplier_name,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as quantity_sold,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.price ELSE 0 END) as revenue,
          AVG(p.price) as avg_price
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE ${whereClause} AND sm.movement_type = 'out'
        GROUP BY DATE(sm.created_at), p.id, p.category, p.name, s.name
        ORDER BY sale_date DESC, revenue DESC
      `;

      const salesData = await executeQuery(salesQuery, queryParams);

      // Calculate summary statistics
      const summaryQuery = `
        SELECT 
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.price ELSE 0 END) as total_revenue,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.cost ELSE 0 END) as total_cost,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_quantity,
          COUNT(DISTINCT DATE(sm.created_at)) as active_days,
          COUNT(DISTINCT p.id) as products_sold,
          COUNT(DISTINCT p.supplier_id) as suppliers_involved
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE ${whereClause} AND sm.movement_type = 'out'
      `;

      const [summary] = await executeQuery(summaryQuery, queryParams);

      const totalRevenue = parseFloat(summary.total_revenue) || 0;
      const totalCost = parseFloat(summary.total_cost) || 0;

      res.json({
        summary: {
          totalRevenue: totalRevenue,
          totalCost: totalCost,
          grossProfit: totalRevenue - totalCost,
          profitMargin:
            totalRevenue > 0
              ? (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(2)
              : 0,
          totalQuantity: summary.total_quantity || 0,
          activeDays: summary.active_days || 0,
          productsSold: summary.products_sold || 0,
          suppliersInvolved: summary.suppliers_involved || 0,
          avgDailyRevenue:
            summary.active_days > 0
              ? (totalRevenue / summary.active_days).toFixed(2)
              : 0,
        },
        salesData: salesData.map((sale) => ({
          date: sale.sale_date,
          category: sale.category,
          productName: sale.product_name,
          supplierName: sale.supplier_name,
          quantitySold: sale.quantity_sold,
          revenue: parseFloat(sale.revenue) || 0,
          avgPrice: parseFloat(sale.avg_price) || 0,
        })),
        dateRange: {
          startDate,
          endDate,
        },
      });
    } catch (error) {
      console.error("Error fetching sales reports:", error);
      res.status(500).json({ error: "Failed to fetch sales reports" });
    }
  },

  // Get sales trends analysis
  getSalesTrends: async (req, res) => {
    try {
      const period = req.query.period || "30"; // days
      const groupBy = req.query.groupBy || "day"; // day, week, month

      let dateFormat, groupInterval;
      switch (groupBy) {
        case "week":
          dateFormat = "%Y-%u";
          groupInterval = "WEEK";
          break;
        case "month":
          dateFormat = "%Y-%m";
          groupInterval = "MONTH";
          break;
        default:
          dateFormat = "%Y-%m-%d";
          groupInterval = "DAY";
      }

      const trendsQuery = `
        SELECT 
          DATE_FORMAT(sm.created_at, '${dateFormat}') as period,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.price ELSE 0 END) as revenue,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as quantity,
          COUNT(DISTINCT CASE WHEN sm.movement_type = 'out' THEN p.id END) as products_sold
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND sm.movement_type = 'out'
        GROUP BY DATE_FORMAT(sm.created_at, '${dateFormat}')
        ORDER BY period ASC
      `;

      const trends = await executeQuery(trendsQuery, [period]);

      // Category trends
      const categoryTrendsQuery = `
        SELECT 
          p.category,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.price ELSE 0 END) as revenue,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as quantity
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND sm.movement_type = 'out'
        GROUP BY p.category
        ORDER BY revenue DESC
      `;

      const categoryTrends = await executeQuery(categoryTrendsQuery, [period]);

      res.json({
        timeTrends: trends.map((trend) => ({
          period: trend.period,
          revenue: parseFloat(trend.revenue) || 0,
          quantity: trend.quantity || 0,
          productsSold: trend.products_sold || 0,
        })),
        categoryTrends: categoryTrends.map((cat) => ({
          category: cat.category,
          revenue: parseFloat(cat.revenue) || 0,
          quantity: cat.quantity || 0,
        })),
        period: parseInt(period),
        groupBy: groupBy,
      });
    } catch (error) {
      console.error("Error fetching sales trends:", error);
      res.status(500).json({ error: "Failed to fetch sales trends" });
    }
  },

  // Get category-wise analysis
  getCategoryAnalysis: async (req, res) => {
    try {
      const period = req.query.period || "30";

      const categoryQuery = `
        SELECT 
          p.category,
          COUNT(DISTINCT p.id) as total_products,
          SUM(p.stock_quantity) as current_stock,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_sold,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.price ELSE 0 END) as category_revenue,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.cost ELSE 0 END) as category_cost,
          AVG(p.price) as avg_price,
          COUNT(CASE WHEN p.stock_quantity <= p.min_stock_level THEN 1 END) as low_stock_count
        FROM products p
        LEFT JOIN stock_movements sm ON p.id = sm.product_id 
          AND sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY p.category
        ORDER BY category_revenue DESC
      `;

      const categories = await executeQuery(categoryQuery, [period]);

      // Top products by category
      const topProductsQuery = `
        SELECT 
          p.category,
          p.name,
          p.price,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as quantity_sold,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.price ELSE 0 END) as product_revenue
        FROM products p
        LEFT JOIN stock_movements sm ON p.id = sm.product_id 
          AND sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND sm.movement_type = 'out'
        GROUP BY p.category, p.id, p.name, p.price
        HAVING quantity_sold > 0
        ORDER BY p.category, product_revenue DESC
      `;

      const topProducts = await executeQuery(topProductsQuery, [period]);

      // Group top products by category
      const topProductsByCategory = {};
      topProducts.forEach((product) => {
        if (!topProductsByCategory[product.category]) {
          topProductsByCategory[product.category] = [];
        }
        if (topProductsByCategory[product.category].length < 3) {
          topProductsByCategory[product.category].push({
            name: product.name,
            price: parseFloat(product.price),
            quantitySold: product.quantity_sold,
            revenue: parseFloat(product.product_revenue),
          });
        }
      });

      res.json({
        categoryAnalysis: categories.map((cat) => {
          const revenue = parseFloat(cat.category_revenue) || 0;
          const cost = parseFloat(cat.category_cost) || 0;
          return {
            category: cat.category,
            totalProducts: cat.total_products,
            currentStock: cat.current_stock,
            totalSold: cat.total_sold || 0,
            revenue: revenue,
            cost: cost,
            profit: revenue - cost,
            profitMargin:
              revenue > 0 ? (((revenue - cost) / revenue) * 100).toFixed(2) : 0,
            avgPrice: parseFloat(cat.avg_price) || 0,
            lowStockCount: cat.low_stock_count || 0,
            topProducts: topProductsByCategory[cat.category] || [],
          };
        }),
        period: parseInt(period),
      });
    } catch (error) {
      console.error("Error fetching category analysis:", error);
      res.status(500).json({ error: "Failed to fetch category analysis" });
    }
  },

  // Get supplier reports
  getSupplierReports: async (req, res) => {
    try {
      const period = req.query.period || "90";

      const supplierQuery = `
        SELECT 
          s.id,
          s.name,
          COUNT(DISTINCT po.id) as total_orders,
          SUM(po.total_amount) as total_order_value,
          AVG(po.total_amount) as avg_order_value,
          COUNT(DISTINCT p.id) as products_supplied,
          SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * p.price ELSE 0 END) as products_revenue,
          MAX(po.order_date) as last_order_date,
          AVG(DATEDIFF(po.delivery_date, po.order_date)) as avg_delivery_days
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id 
          AND po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        LEFT JOIN products p ON s.id = p.supplier_id
        LEFT JOIN stock_movements sm ON p.id = sm.product_id 
          AND sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        WHERE s.status = 'active'
        GROUP BY s.id, s.name
        ORDER BY total_order_value DESC
      `;

      const suppliers = await executeQuery(supplierQuery, [period, period]);

      res.json({
        supplierPerformance: suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          totalOrders: supplier.total_orders || 0,
          totalOrderValue: parseFloat(supplier.total_order_value) || 0,
          avgOrderValue: parseFloat(supplier.avg_order_value) || 0,
          productsSupplied: supplier.products_supplied || 0,
          productsRevenue: parseFloat(supplier.products_revenue) || 0,
          lastOrderDate: supplier.last_order_date,
          avgDeliveryDays: parseFloat(supplier.avg_delivery_days) || 0,
          performanceScore:
            supplier.total_orders > 0
              ? Math.min(
                  100,
                  Math.round(
                    supplier.total_orders * 10 +
                      (supplier.avg_delivery_days
                        ? Math.max(0, 100 - supplier.avg_delivery_days * 2)
                        : 50)
                  )
                )
              : 0,
        })),
        period: parseInt(period),
      });
    } catch (error) {
      console.error("Error fetching supplier reports:", error);
      res.status(500).json({ error: "Failed to fetch supplier reports" });
    }
  },

  // Export reports as CSV
  exportReports: async (req, res) => {
    try {
      const reportType = req.query.type || "sales";
      const startDate =
        req.query.startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      const endDate =
        req.query.endDate || new Date().toISOString().split("T")[0];

      let query, headers, filename;

      switch (reportType) {
        case "products":
          query = `
            SELECT 
              p.sku, p.name, p.category, p.price, p.cost, p.stock_quantity,
              p.min_stock_level, s.name as supplier_name
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY p.name
          `;
          headers = [
            "SKU",
            "Product Name",
            "Category",
            "Price",
            "Cost",
            "Stock",
            "Min Stock",
            "Supplier",
          ];
          filename = "products_export.csv";
          break;

        case "suppliers":
          query = `
            SELECT 
              s.name, s.email, s.phone, s.address, s.status, s.payment_terms,
              COUNT(p.id) as product_count
            FROM suppliers s
            LEFT JOIN products p ON s.id = p.supplier_id
            GROUP BY s.id
            ORDER BY s.name
          `;
          headers = [
            "Supplier Name",
            "Email",
            "Phone",
            "Address",
            "Status",
            "Payment Terms",
            "Products",
          ];
          filename = "suppliers_export.csv";
          break;

        case "stock_movements":
          query = `
            SELECT 
              sm.created_at, p.name as product_name, sm.movement_type, sm.quantity,
              sm.reference_number, sm.notes
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE sm.created_at >= ? AND sm.created_at <= ?
            ORDER BY sm.created_at DESC
          `;
          headers = [
            "Date",
            "Product",
            "Type",
            "Quantity",
            "Reference",
            "Notes",
          ];
          filename = "stock_movements_export.csv";
          break;

        default: // sales
          query = `
            SELECT 
              DATE(sm.created_at) as sale_date,
              p.name as product_name,
              p.category,
              sm.quantity,
              p.price as unit_price,
              (sm.quantity * p.price) as total_revenue,
              s.name as supplier_name
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE sm.movement_type = 'out' 
              AND sm.created_at >= ? AND sm.created_at <= ?
            ORDER BY sm.created_at DESC
          `;
          headers = [
            "Date",
            "Product",
            "Category",
            "Quantity",
            "Unit Price",
            "Revenue",
            "Supplier",
          ];
          filename = "sales_export.csv";
      }

      const queryParams =
        reportType === "stock_movements" || reportType === "sales"
          ? [startDate, endDate]
          : [];

      const data = await executeQuery(query, queryParams);

      // Convert to CSV format
      const csvContent = [
        headers.join(","),
        ...data.map((row) => {
          return Object.values(row)
            .map((value) => {
              // Handle null/undefined values and escape commas
              if (value === null || value === undefined) return "";
              const stringValue = String(value);
              return stringValue.includes(",")
                ? `"${stringValue}"`
                : stringValue;
            })
            .join(",");
        }),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting reports:", error);
      res.status(500).json({ error: "Failed to export reports" });
    }
  },
};

module.exports = reportsController;
