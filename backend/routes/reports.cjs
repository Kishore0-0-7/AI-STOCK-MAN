const express = require("express");
const router = express.Router();
const db = require("../config/db.cjs");

// Get sales summary data
router.get("/sales-summary", (req, res) => {
  const { period = "month", start_date, end_date } = req.query;

  let dateFilter = "";
  if (start_date && end_date) {
    dateFilter = `AND DATE(po.created_at) BETWEEN '${start_date}' AND '${end_date}'`;
  } else {
    switch (period) {
      case "today":
        dateFilter = `AND DATE(po.created_at) = CURDATE()`;
        break;
      case "week":
        dateFilter = `AND po.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        break;
      case "month":
        dateFilter = `AND MONTH(po.created_at) = MONTH(CURDATE()) AND YEAR(po.created_at) = YEAR(CURDATE())`;
        break;
      case "year":
        dateFilter = `AND YEAR(po.created_at) = YEAR(CURDATE())`;
        break;
    }
  }

  const summaryQuery = `
    SELECT 
      COUNT(DISTINCT po.id) as total_orders,
      COUNT(DISTINCT po.supplier_id) as active_suppliers,
      COALESCE(SUM(po.total_amount), 0) as total_revenue,
      COALESCE(AVG(po.total_amount), 0) as avg_order_value,
      COUNT(DISTINCT pli.product_id) as products_sold
    FROM purchase_orders po
    LEFT JOIN po_line_items pli ON po.id = pli.po_id
    WHERE po.status IN ('completed', 'delivered')
    ${dateFilter}
  `;

  db.query(summaryQuery, (err, summaryResult) => {
    if (err) {
      console.error("Error fetching sales summary:", err);
      return res.status(500).json({ error: "Failed to fetch sales summary" });
    }

    const summary = summaryResult[0];
    res.json({
      total_orders: summary.total_orders || 0,
      active_suppliers: summary.active_suppliers || 0,
      total_revenue: parseFloat(summary.total_revenue) || 0,
      avg_order_value: parseFloat(summary.avg_order_value) || 0,
      products_sold: summary.products_sold || 0,
    });
  });
});

// Get sales by category
router.get("/sales-by-category", (req, res) => {
  const { period = "month" } = req.query;

  let dateFilter = "";
  switch (period) {
    case "today":
      dateFilter = `AND DATE(po.created_at) = CURDATE()`;
      break;
    case "week":
      dateFilter = `AND po.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
      break;
    case "month":
      dateFilter = `AND MONTH(po.created_at) = MONTH(CURDATE()) AND YEAR(po.created_at) = YEAR(CURDATE())`;
      break;
    case "year":
      dateFilter = `AND YEAR(po.created_at) = YEAR(CURDATE())`;
      break;
  }

  const query = `
    SELECT 
      p.category,
      COUNT(pli.id) as total_orders,
      SUM(pli.quantity) as total_quantity,
      SUM(pli.line_total) as total_sales,
      AVG(pli.unit_price) as avg_price
    FROM purchase_orders po
    JOIN po_line_items pli ON po.id = pli.po_id
    JOIN products p ON pli.product_id = p.id
    WHERE po.status IN ('completed', 'delivered')
    ${dateFilter}
    GROUP BY p.category
    ORDER BY total_sales DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales by category:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch sales by category" });
    }

    const formattedResults = results.map((item) => ({
      category: item.category,
      total_orders: item.total_orders,
      total_quantity: item.total_quantity,
      total_sales: parseFloat(item.total_sales),
      avg_price: parseFloat(item.avg_price),
    }));

    res.json(formattedResults);
  });
});

// Get top selling products
router.get("/top-products", (req, res) => {
  const { period = "month", limit = 10 } = req.query;

  let dateFilter = "";
  switch (period) {
    case "today":
      dateFilter = `AND DATE(po.created_at) = CURDATE()`;
      break;
    case "week":
      dateFilter = `AND po.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
      break;
    case "month":
      dateFilter = `AND MONTH(po.created_at) = MONTH(CURDATE()) AND YEAR(po.created_at) = YEAR(CURDATE())`;
      break;
    case "year":
      dateFilter = `AND YEAR(po.created_at) = YEAR(CURDATE())`;
      break;
  }

  const query = `
    SELECT 
      p.id,
      p.name,
      p.category,
      p.price,
      COUNT(pli.id) as order_count,
      SUM(pli.quantity) as total_quantity_sold,
      SUM(pli.line_total) as total_revenue,
      AVG(pli.unit_price) as avg_selling_price,
      s.name as supplier_name
    FROM purchase_orders po
    JOIN po_line_items pli ON po.id = pli.po_id
    JOIN products p ON pli.product_id = p.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE po.status IN ('completed', 'delivered')
    ${dateFilter}
    GROUP BY p.id, p.name, p.category, p.price, s.name
    ORDER BY total_revenue DESC
    LIMIT ?
  `;

  db.query(query, [parseInt(limit)], (err, results) => {
    if (err) {
      console.error("Error fetching top products:", err);
      return res.status(500).json({ error: "Failed to fetch top products" });
    }

    const formattedResults = results.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      order_count: item.order_count,
      total_quantity_sold: item.total_quantity_sold,
      total_revenue: parseFloat(item.total_revenue),
      avg_selling_price: parseFloat(item.avg_selling_price),
      supplier_name: item.supplier_name,
    }));

    res.json(formattedResults);
  });
});

// Get monthly sales trend
router.get("/monthly-trend/:year?", (req, res) => {
  const year = req.params.year || new Date().getFullYear();

  const query = `
    SELECT 
      MONTH(po.created_at) as month,
      MONTHNAME(po.created_at) as month_name,
      COUNT(DISTINCT po.id) as order_count,
      SUM(po.total_amount) as total_sales,
      AVG(po.total_amount) as avg_order_value,
      COUNT(DISTINCT po.supplier_id) as active_suppliers
    FROM purchase_orders po
    WHERE YEAR(po.created_at) = ? 
    AND po.status IN ('completed', 'delivered')
    GROUP BY MONTH(po.created_at), MONTHNAME(po.created_at)
    ORDER BY MONTH(po.created_at)
  `;

  db.query(query, [year], (err, results) => {
    if (err) {
      console.error("Error fetching monthly trend:", err);
      return res.status(500).json({ error: "Failed to fetch monthly trend" });
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
        total_sales: existing ? parseFloat(existing.total_sales) : 0,
        avg_order_value: existing ? parseFloat(existing.avg_order_value) : 0,
        active_suppliers: existing ? existing.active_suppliers : 0,
      };
    });

    res.json(monthData);
  });
});

// Get supplier performance
router.get("/supplier-performance", (req, res) => {
  const { period = "month" } = req.query;

  let dateFilter = "";
  switch (period) {
    case "today":
      dateFilter = `AND DATE(po.created_at) = CURDATE()`;
      break;
    case "week":
      dateFilter = `AND po.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
      break;
    case "month":
      dateFilter = `AND MONTH(po.created_at) = MONTH(CURDATE()) AND YEAR(po.created_at) = YEAR(CURDATE())`;
      break;
    case "year":
      dateFilter = `AND YEAR(po.created_at) = YEAR(CURDATE())`;
      break;
  }

  const query = `
    SELECT 
      s.id,
      s.name,
      s.email,
      s.phone,
      COUNT(DISTINCT po.id) as total_orders,
      SUM(po.total_amount) as total_business,
      AVG(po.total_amount) as avg_order_value,
      COUNT(DISTINCT pli.product_id) as unique_products_supplied,
      AVG(DATEDIFF(po.actual_delivery_date, po.expected_delivery_date)) as avg_delivery_delay
    FROM suppliers s
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    LEFT JOIN po_line_items pli ON po.id = pli.po_id
    WHERE s.is_active = 1 
    AND po.status IN ('completed', 'delivered')
    ${dateFilter}
    GROUP BY s.id, s.name, s.email, s.phone
    ORDER BY total_business DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching supplier performance:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch supplier performance" });
    }

    const formattedResults = results.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      total_orders: item.total_orders || 0,
      total_business: parseFloat(item.total_business) || 0,
      avg_order_value: parseFloat(item.avg_order_value) || 0,
      unique_products_supplied: item.unique_products_supplied || 0,
      avg_delivery_delay: parseFloat(item.avg_delivery_delay) || 0,
      performance_score: Math.max(
        0,
        100 - (parseFloat(item.avg_delivery_delay) || 0)
      ),
    }));

    res.json(formattedResults);
  });
});

// Get recent transactions/orders
router.get("/recent-transactions", (req, res) => {
  const { limit = 50 } = req.query;

  const query = `
    SELECT 
      po.id,
      po.po_number,
      po.status,
      po.total_amount,
      po.created_at,
      po.expected_delivery_date,
      po.actual_delivery_date,
      s.name as supplier_name,
      GROUP_CONCAT(p.name SEPARATOR ', ') as products,
      COUNT(pli.id) as item_count
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN po_line_items pli ON po.id = pli.po_id
    LEFT JOIN products p ON pli.product_id = p.id
    GROUP BY po.id, po.po_number, po.status, po.total_amount, po.created_at, po.expected_delivery_date, po.actual_delivery_date, s.name
    ORDER BY po.created_at DESC
    LIMIT ?
  `;

  db.query(query, [parseInt(limit)], (err, results) => {
    if (err) {
      console.error("Error fetching recent transactions:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch recent transactions" });
    }

    const formattedResults = results.map((item) => ({
      id: item.id,
      po_number: item.po_number,
      status: item.status,
      total_amount: parseFloat(item.total_amount),
      created_at: item.created_at,
      expected_delivery_date: item.expected_delivery_date,
      actual_delivery_date: item.actual_delivery_date,
      supplier_name: item.supplier_name,
      products: item.products,
      item_count: item.item_count,
      is_delayed:
        item.actual_delivery_date &&
        item.expected_delivery_date &&
        new Date(item.actual_delivery_date) >
          new Date(item.expected_delivery_date),
    }));

    res.json(formattedResults);
  });
});

// Export sales data to CSV format
router.get("/export/:type", (req, res) => {
  const { type } = req.params;
  const { period = "month", format = "json" } = req.query;

  let query = "";

  switch (type) {
    case "sales-summary":
      query = `
        SELECT 
          po.po_number,
          po.created_at as order_date,
          s.name as supplier_name,
          po.total_amount,
          po.status,
          COUNT(pli.id) as item_count
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN po_line_items pli ON po.id = pli.po_id
        WHERE po.status IN ('completed', 'delivered')
        GROUP BY po.id, po.po_number, po.created_at, s.name, po.total_amount, po.status
        ORDER BY po.created_at DESC
      `;
      break;
    case "product-performance":
      query = `
        SELECT 
          p.name as product_name,
          p.category,
          COUNT(pli.id) as times_ordered,
          SUM(pli.quantity) as total_quantity,
          SUM(pli.line_total) as total_sales,
          AVG(pli.unit_price) as avg_price
        FROM po_line_items pli
        JOIN products p ON pli.product_id = p.id
        JOIN purchase_orders po ON pli.po_id = po.id
        WHERE po.status IN ('completed', 'delivered')
        GROUP BY p.id, p.name, p.category
        ORDER BY total_sales DESC
      `;
      break;
    default:
      return res.status(400).json({ error: "Invalid export type" });
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error exporting data:", err);
      return res.status(500).json({ error: "Failed to export data" });
    }

    if (format === "csv") {
      // Convert to CSV format
      const headers = Object.keys(results[0] || {});
      const csvData = [
        headers.join(","),
        ...results.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${type}-${Date.now()}.csv"`
      );
      res.send(csvData);
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
