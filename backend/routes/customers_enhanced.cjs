const express = require("express");
const router = express.Router();
const db = require("../config/db.cjs");

// Create customers table if it doesn't exist
const createCustomersTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(50),
      address TEXT,
      company VARCHAR(255),
      customer_type ENUM('individual', 'business') DEFAULT 'individual',
      status ENUM('active', 'inactive') DEFAULT 'active',
      credit_limit DECIMAL(10,2) DEFAULT 0.00,
      payment_terms VARCHAR(100) DEFAULT 'Net 30',
      tax_id VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_email (email),
      INDEX idx_status (status),
      INDEX idx_customer_type (customer_type)
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) console.error("Error creating customers table:", err);
  });
};

createCustomersTable();

// Get all customers with pagination and statistics
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search;
  const status = req.query.status;
  const customerType = req.query.type;

  let whereClause = "1=1";
  let queryParams = [];

  if (search) {
    whereClause +=
      " AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company LIKE ?)";
    queryParams.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  if (status && status !== "all") {
    whereClause += " AND c.status = ?";
    queryParams.push(status);
  }

  if (customerType && customerType !== "all") {
    whereClause += " AND c.customer_type = ?";
    queryParams.push(customerType);
  }

  const countQuery = `SELECT COUNT(*) as total FROM customers c WHERE ${whereClause}`;

  const dataQuery = `
    SELECT 
      c.*,
      COALESCE(sales.order_count, 0) as order_count,
      COALESCE(sales.total_spent, 0) as total_spent,
      COALESCE(sales.avg_order_value, 0) as avg_order_value,
      sales.last_order_date,
      COALESCE(sales.total_quantity, 0) as total_items_purchased
    FROM customers c
    LEFT JOIN (
      SELECT 
        customer_id,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_value,
        MAX(order_date) as last_order_date,
        SUM(total_quantity) as total_quantity
      FROM sales_orders
      GROUP BY customer_id
    ) sales ON c.id = sales.customer_id
    WHERE ${whereClause}
    ORDER BY c.name ASC
    LIMIT ? OFFSET ?
  `;

  // Get total count
  db.query(countQuery, queryParams, (err, countResult) => {
    if (err) {
      console.error("Error counting customers:", err);
      return res.status(500).json({ error: "Failed to count customers" });
    }

    const total = countResult[0].total;

    // Get customers data
    db.query(dataQuery, [...queryParams, limit, offset], (err, results) => {
      if (err) {
        console.error("Error fetching customers:", err);
        return res.status(500).json({ error: "Failed to fetch customers" });
      }

      res.json({
        customers: results.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          company: customer.company,
          customerType: customer.customer_type,
          status: customer.status,
          creditLimit: parseFloat(customer.credit_limit),
          paymentTerms: customer.payment_terms,
          taxId: customer.tax_id,
          notes: customer.notes,
          stats: {
            orderCount: customer.order_count || 0,
            totalSpent: parseFloat(customer.total_spent) || 0,
            avgOrderValue: parseFloat(customer.avg_order_value) || 0,
            lastOrderDate: customer.last_order_date,
            totalItemsPurchased: customer.total_items_purchased || 0,
          },
          createdAt: customer.created_at,
          updatedAt: customer.updated_at,
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

// Get customer by ID with detailed information
router.get("/:id", (req, res) => {
  const customerId = req.params.id;

  const customerQuery = `
    SELECT 
      c.*,
      COALESCE(stats.order_count, 0) as order_count,
      COALESCE(stats.total_spent, 0) as total_spent,
      COALESCE(stats.avg_order_value, 0) as avg_order_value
    FROM customers c
    LEFT JOIN (
      SELECT 
        customer_id,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_value
      FROM sales_orders
      WHERE customer_id = ?
      GROUP BY customer_id
    ) stats ON c.id = stats.customer_id
    WHERE c.id = ?
  `;

  const ordersQuery = `
    SELECT 
      id, order_number, order_date, status, total_amount, total_quantity
    FROM sales_orders 
    WHERE customer_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `;

  db.query(customerQuery, [customerId, customerId], (err, customerResult) => {
    if (err) {
      console.error("Error fetching customer:", err);
      return res.status(500).json({ error: "Failed to fetch customer" });
    }

    if (customerResult.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = customerResult[0];

    // Get recent orders (if sales_orders table exists)
    db.query(ordersQuery, [customerId], (err, ordersResult) => {
      // Don't fail if sales_orders table doesn't exist yet
      const orders = err ? [] : ordersResult;

      res.json({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        company: customer.company,
        customerType: customer.customer_type,
        status: customer.status,
        creditLimit: parseFloat(customer.credit_limit),
        paymentTerms: customer.payment_terms,
        taxId: customer.tax_id,
        notes: customer.notes,
        stats: {
          orderCount: customer.order_count || 0,
          totalSpent: parseFloat(customer.total_spent) || 0,
          avgOrderValue: parseFloat(customer.avg_order_value) || 0,
        },
        recentOrders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          orderDate: order.order_date,
          status: order.status,
          totalAmount: parseFloat(order.total_amount),
          totalQuantity: order.total_quantity,
        })),
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      });
    });
  });
});

// Create new customer
router.post("/", (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    company,
    customerType,
    status,
    creditLimit,
    paymentTerms,
    taxId,
    notes,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Customer name is required" });
  }

  // Check if email already exists (if provided)
  if (email) {
    const checkEmailQuery = `SELECT id FROM customers WHERE email = ?`;
    db.query(checkEmailQuery, [email], (err, results) => {
      if (err) {
        console.error("Error checking customer email:", err);
        return res.status(500).json({ error: "Failed to create customer" });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "Customer email already exists" });
      }

      createCustomer();
    });
  } else {
    createCustomer();
  }

  function createCustomer() {
    const insertQuery = `
      INSERT INTO customers (
        name, email, phone, address, company, customer_type, status,
        credit_limit, payment_terms, tax_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        name,
        email || null,
        phone || null,
        address || null,
        company || null,
        customerType || "individual",
        status || "active",
        creditLimit || 0.0,
        paymentTerms || "Net 30",
        taxId || null,
        notes || null,
      ],
      (err, result) => {
        if (err) {
          console.error("Error creating customer:", err);
          return res.status(500).json({ error: "Failed to create customer" });
        }

        res.status(201).json({
          success: true,
          message: "Customer created successfully",
          customerId: result.insertId,
        });
      }
    );
  }
});

// Update customer
router.put("/:id", (req, res) => {
  const customerId = req.params.id;
  const {
    name,
    email,
    phone,
    address,
    company,
    customerType,
    status,
    creditLimit,
    paymentTerms,
    taxId,
    notes,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Customer name is required" });
  }

  // Check if email exists for other customers (if provided)
  if (email) {
    const checkEmailQuery = `SELECT id FROM customers WHERE email = ? AND id != ?`;
    db.query(checkEmailQuery, [email, customerId], (err, results) => {
      if (err) {
        console.error("Error checking customer email:", err);
        return res.status(500).json({ error: "Failed to update customer" });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "Customer email already exists" });
      }

      updateCustomer();
    });
  } else {
    updateCustomer();
  }

  function updateCustomer() {
    const updateQuery = `
      UPDATE customers SET
        name = ?, email = ?, phone = ?, address = ?, company = ?,
        customer_type = ?, status = ?, credit_limit = ?, payment_terms = ?,
        tax_id = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;

    db.query(
      updateQuery,
      [
        name,
        email || null,
        phone || null,
        address || null,
        company || null,
        customerType || "individual",
        status || "active",
        creditLimit || 0.0,
        paymentTerms || "Net 30",
        taxId || null,
        notes || null,
        customerId,
      ],
      (err, result) => {
        if (err) {
          console.error("Error updating customer:", err);
          return res.status(500).json({ error: "Failed to update customer" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        res.json({
          success: true,
          message: "Customer updated successfully",
        });
      }
    );
  }
});

// Delete customer (soft delete by setting status to inactive)
router.delete("/:id", (req, res) => {
  const customerId = req.params.id;

  // Check if customer has orders
  const checkOrdersQuery = `SELECT COUNT(*) as order_count FROM sales_orders WHERE customer_id = ?`;

  db.query(checkOrdersQuery, [customerId], (err, results) => {
    // If sales_orders table doesn't exist, proceed with deletion
    const hasOrders = !err && results[0] && results[0].order_count > 0;

    if (hasOrders) {
      // Soft delete - set status to inactive
      const updateQuery = `UPDATE customers SET status = 'inactive', updated_at = NOW() WHERE id = ?`;

      db.query(updateQuery, [customerId], (err, result) => {
        if (err) {
          console.error("Error deactivating customer:", err);
          return res
            .status(500)
            .json({ error: "Failed to deactivate customer" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        res.json({
          success: true,
          message: "Customer deactivated successfully (has order history)",
        });
      });
    } else {
      // Hard delete if no orders
      const deleteQuery = `DELETE FROM customers WHERE id = ?`;

      db.query(deleteQuery, [customerId], (err, result) => {
        if (err) {
          console.error("Error deleting customer:", err);
          return res.status(500).json({ error: "Failed to delete customer" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Customer not found" });
        }

        res.json({
          success: true,
          message: "Customer deleted successfully",
        });
      });
    }
  });
});

// Get customer statistics
router.get("/stats/summary", (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_customers,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_customers,
      COUNT(CASE WHEN customer_type = 'business' THEN 1 END) as business_customers,
      COUNT(CASE WHEN customer_type = 'individual' THEN 1 END) as individual_customers,
      AVG(credit_limit) as avg_credit_limit
    FROM customers
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching customer stats:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch customer statistics" });
    }

    const stats = results[0];
    res.json({
      totalCustomers: stats.total_customers || 0,
      activeCustomers: stats.active_customers || 0,
      inactiveCustomers: stats.inactive_customers || 0,
      businessCustomers: stats.business_customers || 0,
      individualCustomers: stats.individual_customers || 0,
      avgCreditLimit: parseFloat(stats.avg_credit_limit) || 0,
    });
  });
});

// Get top customers by spending
router.get("/stats/top-customers", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const period = req.query.period || "12"; // months

  const query = `
    SELECT 
      c.id,
      c.name,
      c.email,
      c.company,
      c.customer_type,
      COALESCE(stats.order_count, 0) as order_count,
      COALESCE(stats.total_spent, 0) as total_spent,
      COALESCE(stats.avg_order_value, 0) as avg_order_value,
      stats.last_order_date
    FROM customers c
    LEFT JOIN (
      SELECT 
        customer_id,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_value,
        MAX(order_date) as last_order_date
      FROM sales_orders
      WHERE order_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY customer_id
    ) stats ON c.id = stats.customer_id
    WHERE c.status = 'active'
    ORDER BY stats.total_spent DESC
    LIMIT ?
  `;

  db.query(query, [period, limit], (err, results) => {
    if (err) {
      // If sales_orders table doesn't exist, return empty array
      console.warn("Sales orders table may not exist:", err.message);
      return res.json([]);
    }

    res.json(
      results.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        company: customer.company,
        customerType: customer.customer_type,
        orderCount: customer.order_count || 0,
        totalSpent: parseFloat(customer.total_spent) || 0,
        avgOrderValue: parseFloat(customer.avg_order_value) || 0,
        lastOrderDate: customer.last_order_date,
      }))
    );
  });
});

// Search customers (for quick lookups in forms)
router.get("/search", (req, res) => {
  const search = req.query.q;
  const limit = parseInt(req.query.limit) || 20;

  if (!search) {
    return res.json([]);
  }

  const query = `
    SELECT id, name, email, phone, company, customer_type
    FROM customers
    WHERE status = 'active'
      AND (name LIKE ? OR email LIKE ? OR company LIKE ?)
    ORDER BY name ASC
    LIMIT ?
  `;

  db.query(
    query,
    [`%${search}%`, `%${search}%`, `%${search}%`, limit],
    (err, results) => {
      if (err) {
        console.error("Error searching customers:", err);
        return res.status(500).json({ error: "Failed to search customers" });
      }

      res.json(
        results.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          customerType: customer.customer_type,
          displayName: customer.company
            ? `${customer.name} (${customer.company})`
            : customer.name,
        }))
      );
    }
  );
});

module.exports = router;
