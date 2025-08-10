const express = require("express");
const router = express.Router();
const db = require("../config/db.cjs");

// Get all suppliers with related statistics
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search;
  const status = req.query.status;

  let whereClause = "1=1";
  let queryParams = [];

  if (search) {
    whereClause += " AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)";
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status && status !== "all") {
    whereClause += " AND s.status = ?";
    queryParams.push(status);
  }

  const countQuery = `SELECT COUNT(*) as total FROM suppliers s WHERE ${whereClause}`;

  const dataQuery = `
    SELECT 
      s.*,
      COUNT(DISTINCT p.id) as product_count,
      COUNT(DISTINCT po.id) as order_count,
      COALESCE(SUM(po.total_amount), 0) as total_orders_value,
      COALESCE(AVG(po.total_amount), 0) as avg_order_value,
      MAX(po.order_date) as last_order_date,
      COUNT(CASE WHEN po.status = 'pending' THEN 1 END) as pending_orders
    FROM suppliers s
    LEFT JOIN products p ON s.id = p.supplier_id
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    WHERE ${whereClause}
    GROUP BY s.id, s.name, s.email, s.phone, s.address, s.status, s.contact_person, 
             s.payment_terms, s.notes, s.created_at, s.updated_at
    ORDER BY s.name ASC
    LIMIT ? OFFSET ?
  `;

  // Get total count
  db.query(countQuery, queryParams, (err, countResult) => {
    if (err) {
      console.error("Error counting suppliers:", err);
      return res.status(500).json({ error: "Failed to count suppliers" });
    }

    const total = countResult[0].total;

    // Get suppliers data
    db.query(dataQuery, [...queryParams, limit, offset], (err, results) => {
      if (err) {
        console.error("Error fetching suppliers:", err);
        return res.status(500).json({ error: "Failed to fetch suppliers" });
      }

      res.json({
        suppliers: results.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          status: supplier.status,
          contactPerson: supplier.contact_person,
          paymentTerms: supplier.payment_terms,
          notes: supplier.notes,
          stats: {
            productCount: supplier.product_count || 0,
            orderCount: supplier.order_count || 0,
            totalOrdersValue: parseFloat(supplier.total_orders_value) || 0,
            avgOrderValue: parseFloat(supplier.avg_order_value) || 0,
            lastOrderDate: supplier.last_order_date,
            pendingOrders: supplier.pending_orders || 0,
          },
          createdAt: supplier.created_at,
          updatedAt: supplier.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    });
  });
});

// Get supplier by ID with detailed information
router.get("/:id", (req, res) => {
  const supplierId = req.params.id;

  const supplierQuery = `
    SELECT 
      s.*,
      COUNT(DISTINCT p.id) as product_count,
      COUNT(DISTINCT po.id) as order_count,
      COALESCE(SUM(po.total_amount), 0) as total_orders_value
    FROM suppliers s
    LEFT JOIN products p ON s.id = p.supplier_id
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    WHERE s.id = ?
    GROUP BY s.id
  `;

  // Get products supplied by this supplier
  const productsQuery = `
    SELECT 
      id, sku, name, category, price, cost, stock_quantity, min_stock_level,
      CASE 
        WHEN stock_quantity <= min_stock_level THEN 'low'
        WHEN stock_quantity <= (min_stock_level * 1.5) THEN 'medium'
        ELSE 'good'
      END as stock_status
    FROM products 
    WHERE supplier_id = ?
    ORDER BY name ASC
    LIMIT 20
  `;

  // Get recent purchase orders
  const ordersQuery = `
    SELECT 
      id, order_number, status, order_date, delivery_date, total_amount
    FROM purchase_orders 
    WHERE supplier_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `;

  db.query(supplierQuery, [supplierId], (err, supplierResult) => {
    if (err) {
      console.error("Error fetching supplier:", err);
      return res.status(500).json({ error: "Failed to fetch supplier" });
    }

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const supplier = supplierResult[0];

    // Get products
    db.query(productsQuery, [supplierId], (err, productsResult) => {
      if (err) {
        console.error("Error fetching supplier products:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch supplier products" });
      }

      // Get orders
      db.query(ordersQuery, [supplierId], (err, ordersResult) => {
        if (err) {
          console.error("Error fetching supplier orders:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch supplier orders" });
        }

        res.json({
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          status: supplier.status,
          contactPerson: supplier.contact_person,
          paymentTerms: supplier.payment_terms,
          notes: supplier.notes,
          stats: {
            productCount: supplier.product_count || 0,
            orderCount: supplier.order_count || 0,
            totalOrdersValue: parseFloat(supplier.total_orders_value) || 0,
          },
          products: productsResult.map((product) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            price: parseFloat(product.price),
            cost: parseFloat(product.cost),
            stock: product.stock_quantity,
            minStock: product.min_stock_level,
            stockStatus: product.stock_status,
          })),
          recentOrders: ordersResult.map((order) => ({
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            orderDate: order.order_date,
            deliveryDate: order.delivery_date,
            totalAmount: parseFloat(order.total_amount),
          })),
          createdAt: supplier.created_at,
          updatedAt: supplier.updated_at,
        });
      });
    });
  });
});

// Create new supplier
router.post("/", (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    contactPerson,
    paymentTerms,
    notes,
    status,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  // Check if supplier name already exists
  const checkNameQuery = `SELECT id FROM suppliers WHERE name = ?`;
  db.query(checkNameQuery, [name], (err, results) => {
    if (err) {
      console.error("Error checking supplier name:", err);
      return res.status(500).json({ error: "Failed to create supplier" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Supplier name already exists" });
    }

    const insertQuery = `
      INSERT INTO suppliers (
        name, email, phone, address, contact_person, payment_terms, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        name,
        email || null,
        phone || null,
        address || null,
        contactPerson || null,
        paymentTerms || null,
        notes || null,
        status || "active",
      ],
      (err, result) => {
        if (err) {
          console.error("Error creating supplier:", err);
          return res.status(500).json({ error: "Failed to create supplier" });
        }

        res.status(201).json({
          success: true,
          message: "Supplier created successfully",
          supplierId: result.insertId,
        });
      }
    );
  });
});

// Update supplier
router.put("/:id", (req, res) => {
  const supplierId = req.params.id;
  const {
    name,
    email,
    phone,
    address,
    contactPerson,
    paymentTerms,
    notes,
    status,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  // Check if supplier name exists for other suppliers
  const checkNameQuery = `SELECT id FROM suppliers WHERE name = ? AND id != ?`;
  db.query(checkNameQuery, [name, supplierId], (err, results) => {
    if (err) {
      console.error("Error checking supplier name:", err);
      return res.status(500).json({ error: "Failed to update supplier" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Supplier name already exists" });
    }

    const updateQuery = `
      UPDATE suppliers SET
        name = ?, email = ?, phone = ?, address = ?, 
        contact_person = ?, payment_terms = ?, notes = ?, status = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    db.query(
      updateQuery,
      [
        name,
        email || null,
        phone || null,
        address || null,
        contactPerson || null,
        paymentTerms || null,
        notes || null,
        status || "active",
        supplierId,
      ],
      (err, result) => {
        if (err) {
          console.error("Error updating supplier:", err);
          return res.status(500).json({ error: "Failed to update supplier" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Supplier not found" });
        }

        res.json({
          success: true,
          message: "Supplier updated successfully",
        });
      }
    );
  });
});

// Delete supplier (soft delete by setting status to inactive)
router.delete("/:id", (req, res) => {
  const supplierId = req.params.id;

  // Check if supplier has active products or orders
  const checkDependenciesQuery = `
    SELECT 
      (SELECT COUNT(*) FROM products WHERE supplier_id = ?) as product_count,
      (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = ? AND status IN ('pending', 'approved')) as active_orders
  `;

  db.query(checkDependenciesQuery, [supplierId, supplierId], (err, results) => {
    if (err) {
      console.error("Error checking supplier dependencies:", err);
      return res.status(500).json({ error: "Failed to delete supplier" });
    }

    const dependencies = results[0];

    if (dependencies.product_count > 0 || dependencies.active_orders > 0) {
      // Soft delete - set status to inactive
      const updateQuery = `UPDATE suppliers SET status = 'inactive', updated_at = NOW() WHERE id = ?`;

      db.query(updateQuery, [supplierId], (err, result) => {
        if (err) {
          console.error("Error deactivating supplier:", err);
          return res
            .status(500)
            .json({ error: "Failed to deactivate supplier" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Supplier not found" });
        }

        res.json({
          success: true,
          message:
            "Supplier deactivated successfully (has active products/orders)",
        });
      });
    } else {
      // Hard delete if no dependencies
      const deleteQuery = `DELETE FROM suppliers WHERE id = ?`;

      db.query(deleteQuery, [supplierId], (err, result) => {
        if (err) {
          console.error("Error deleting supplier:", err);
          return res.status(500).json({ error: "Failed to delete supplier" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Supplier not found" });
        }

        res.json({
          success: true,
          message: "Supplier deleted successfully",
        });
      });
    }
  });
});

// Get supplier performance metrics
router.get("/:id/performance", (req, res) => {
  const supplierId = req.params.id;

  const performanceQuery = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_value,
      AVG(total_amount) as avg_order_value,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
      COUNT(CASE WHEN delivery_date <= expected_delivery_date THEN 1 END) as on_time_deliveries,
      AVG(DATEDIFF(delivery_date, order_date)) as avg_delivery_days
    FROM purchase_orders 
    WHERE supplier_id = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
  `;

  const monthlyPerformanceQuery = `
    SELECT 
      DATE_FORMAT(order_date, '%Y-%m') as month,
      COUNT(*) as orders,
      SUM(total_amount) as value
    FROM purchase_orders 
    WHERE supplier_id = ? 
      AND order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `;

  db.query(performanceQuery, [supplierId], (err, performanceResult) => {
    if (err) {
      console.error("Error fetching supplier performance:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch supplier performance" });
    }

    db.query(monthlyPerformanceQuery, [supplierId], (err, monthlyResult) => {
      if (err) {
        console.error("Error fetching monthly performance:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch monthly performance" });
      }

      const performance = performanceResult[0];
      const totalOrders = performance.total_orders || 0;

      res.json({
        totalOrders: totalOrders,
        totalValue: parseFloat(performance.total_value) || 0,
        avgOrderValue: parseFloat(performance.avg_order_value) || 0,
        completionRate:
          totalOrders > 0
            ? (
                ((performance.completed_orders || 0) / totalOrders) *
                100
              ).toFixed(1)
            : 0,
        cancellationRate:
          totalOrders > 0
            ? (
                ((performance.cancelled_orders || 0) / totalOrders) *
                100
              ).toFixed(1)
            : 0,
        onTimeDeliveryRate:
          totalOrders > 0
            ? (
                ((performance.on_time_deliveries || 0) / totalOrders) *
                100
              ).toFixed(1)
            : 0,
        avgDeliveryDays: parseFloat(performance.avg_delivery_days) || 0,
        monthlyTrend: monthlyResult.map((month) => ({
          month: month.month,
          orders: month.orders,
          value: parseFloat(month.value),
        })),
      });
    });
  });
});

// Get suppliers statistics
router.get("/stats/summary", (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_suppliers,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_suppliers,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_suppliers,
      (SELECT COUNT(DISTINCT supplier_id) FROM purchase_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_this_month,
      (SELECT AVG(total_amount) FROM purchase_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_order_value
    FROM suppliers
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching supplier stats:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch supplier statistics" });
    }

    const stats = results[0];
    res.json({
      totalSuppliers: stats.total_suppliers || 0,
      activeSuppliers: stats.active_suppliers || 0,
      inactiveSuppliers: stats.inactive_suppliers || 0,
      activeThisMonth: stats.active_this_month || 0,
      avgOrderValue: parseFloat(stats.avg_order_value) || 0,
    });
  });
});

// Get top suppliers by various metrics
router.get("/stats/top-performers", (req, res) => {
  const metric = req.query.metric || "value"; // 'value', 'orders', 'products'
  const limit = parseInt(req.query.limit) || 10;

  let orderBy;
  switch (metric) {
    case "orders":
      orderBy = "order_count DESC";
      break;
    case "products":
      orderBy = "product_count DESC";
      break;
    default:
      orderBy = "total_value DESC";
  }

  const query = `
    SELECT 
      s.id,
      s.name,
      s.status,
      COUNT(DISTINCT p.id) as product_count,
      COUNT(DISTINCT po.id) as order_count,
      COALESCE(SUM(po.total_amount), 0) as total_value,
      MAX(po.order_date) as last_order_date
    FROM suppliers s
    LEFT JOIN products p ON s.id = p.supplier_id
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    WHERE s.status = 'active'
    GROUP BY s.id, s.name, s.status
    ORDER BY ${orderBy}
    LIMIT ?
  `;

  db.query(query, [limit], (err, results) => {
    if (err) {
      console.error("Error fetching top suppliers:", err);
      return res.status(500).json({ error: "Failed to fetch top suppliers" });
    }

    res.json(
      results.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        status: supplier.status,
        productCount: supplier.product_count || 0,
        orderCount: supplier.order_count || 0,
        totalValue: parseFloat(supplier.total_value) || 0,
        lastOrderDate: supplier.last_order_date,
      }))
    );
  });
});

module.exports = router;
