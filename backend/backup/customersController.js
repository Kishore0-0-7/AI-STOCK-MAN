const { executeQuery } = require("../config/database");

const customersController = {
  // Get all customers with pagination and statistics
  getAllCustomers: async (req, res) => {
    try {
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

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM customers c WHERE ${whereClause}`;
      const [countResult] = await executeQuery(countQuery, queryParams);
      const total = countResult.total;

      // Data query with mock sales data for now
      const dataQuery = `
        SELECT 
          c.*,
          0 as order_count,
          0 as total_spent,
          0 as avg_order_value,
          NULL as last_order_date,
          0 as total_items_purchased
        FROM customers c
        WHERE ${whereClause}
        ORDER BY c.name ASC
        LIMIT ? OFFSET ?
      `;

      const customers = await executeQuery(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      res.json({
        customers: customers.map((customer) => ({
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
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  },

  // Get customer by ID with detailed information
  getCustomerById: async (req, res) => {
    try {
      const customerId = req.params.id;

      const customerQuery = `
        SELECT 
          c.*,
          0 as order_count,
          0 as total_spent,
          0 as avg_order_value
        FROM customers c
        WHERE c.id = ?
      `;

      const [customer] = await executeQuery(customerQuery, [customerId]);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

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
        recentOrders: [], // Will be populated when sales_orders table is created
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  },

  // Create new customer
  createCustomer: async (req, res) => {
    try {
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
        const [existingCustomer] = await executeQuery(
          "SELECT id FROM customers WHERE email = ?",
          [email]
        );
        if (existingCustomer) {
          return res
            .status(400)
            .json({ error: "Customer email already exists" });
        }
      }

      const insertQuery = `
        INSERT INTO customers (
          name, email, phone, address, company, customer_type, status,
          credit_limit, payment_terms, tax_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(insertQuery, [
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
      ]);

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customerId: result.insertId,
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  },

  // Update customer
  updateCustomer: async (req, res) => {
    try {
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
        const [existingCustomer] = await executeQuery(
          "SELECT id FROM customers WHERE email = ? AND id != ?",
          [email, customerId]
        );
        if (existingCustomer) {
          return res
            .status(400)
            .json({ error: "Customer email already exists" });
        }
      }

      const updateQuery = `
        UPDATE customers SET
          name = ?, email = ?, phone = ?, address = ?, company = ?,
          customer_type = ?, status = ?, credit_limit = ?, payment_terms = ?,
          tax_id = ?, notes = ?, updated_at = NOW()
        WHERE id = ?
      `;

      const result = await executeQuery(updateQuery, [
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
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({
        success: true,
        message: "Customer updated successfully",
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  },

  // Delete customer
  deleteCustomer: async (req, res) => {
    try {
      const customerId = req.params.id;

      // For now, just hard delete since we don't have sales_orders table yet
      const result = await executeQuery("DELETE FROM customers WHERE id = ?", [
        customerId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  },

  // Search customers (for quick lookups in forms)
  searchCustomers: async (req, res) => {
    try {
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

      const customers = await executeQuery(query, [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        limit,
      ]);

      res.json(
        customers.map((customer) => ({
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
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({ error: "Failed to search customers" });
    }
  },

  // Get customer statistics
  getCustomerStats: async (req, res) => {
    try {
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

      const [stats] = await executeQuery(query);

      res.json({
        totalCustomers: stats.total_customers || 0,
        activeCustomers: stats.active_customers || 0,
        inactiveCustomers: stats.inactive_customers || 0,
        businessCustomers: stats.business_customers || 0,
        individualCustomers: stats.individual_customers || 0,
        avgCreditLimit: parseFloat(stats.avg_credit_limit) || 0,
      });
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ error: "Failed to fetch customer statistics" });
    }
  },

  // Get top customers by spending (placeholder for now)
  getTopCustomers: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;

      // For now, return top customers by creation date since we don't have sales data
      const query = `
        SELECT 
          c.id,
          c.name,
          c.email,
          c.company,
          c.customer_type,
          0 as order_count,
          0 as total_spent,
          0 as avg_order_value,
          NULL as last_order_date
        FROM customers c
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT ?
      `;

      const customers = await executeQuery(query, [limit]);

      res.json(
        customers.map((customer) => ({
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
    } catch (error) {
      console.error("Error fetching top customers:", error);
      res.status(500).json({ error: "Failed to fetch top customers" });
    }
  },
};

module.exports = customersController;
