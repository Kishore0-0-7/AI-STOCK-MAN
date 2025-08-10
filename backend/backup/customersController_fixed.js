const { executeQuery, buildQuery } = require("../config/database_fixed");

const customersController = {
  // Get all customers with statistics
  getAllCustomers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const search = req.query.search;
      const status = req.query.status;
      const customerType = req.query.customer_type;

      // Build WHERE conditions
      const whereConditions = [];

      if (search) {
        whereConditions.push({
          clause:
            "(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company LIKE ?)",
          params: [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`],
        });
      }

      if (status && status !== "all") {
        whereConditions.push({
          clause: "c.status = ?",
          params: [status],
        });
      }

      if (customerType && customerType !== "all") {
        whereConditions.push({
          clause: "c.customer_type = ?",
          params: [customerType],
        });
      }

      // Count query
      const countQueryBase = "SELECT COUNT(*) as total FROM customers c";
      const { query: countQuery, params: countParams } = buildQuery(
        countQueryBase,
        whereConditions
      );

      const countResult = await executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      // Data query - simplified without complex joins since we don't have sales/bills tables
      const dataQueryBase = `
        SELECT 
          c.*,
          0 as order_count,
          0 as total_spent,
          0 as avg_order_value,
          NULL as last_order_date,
          0 as total_items_purchased
        FROM customers c`;

      const { query: dataQuery, params: dataParams } = buildQuery(
        dataQueryBase,
        whereConditions,
        "c.name ASC",
        "LIMIT ? OFFSET ?"
      );

      // Add pagination parameters
      dataParams.push(limit, offset);

      const customers = await executeQuery(dataQuery, dataParams);

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
          creditLimit: parseFloat(customer.credit_limit) || 0,
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

  // Get single customer
  getCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          c.*,
          0 as order_count,
          0 as total_spent,
          0 as avg_order_value,
          NULL as last_order_date,
          0 as total_items_purchased
        FROM customers c
        WHERE c.id = ?
      `;

      const result = await executeQuery(query, [id]);

      if (result.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const customer = result[0];
      res.json({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        company: customer.company,
        customerType: customer.customer_type,
        status: customer.status,
        creditLimit: parseFloat(customer.credit_limit) || 0,
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

      // Validation
      if (!name) {
        return res.status(400).json({ error: "Customer name is required" });
      }

      const query = `
        INSERT INTO customers 
        (name, email, phone, address, company, customer_type, status, credit_limit, payment_terms, tax_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
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
      ];

      const result = await executeQuery(query, params);

      // Get the created customer
      const createdCustomer = await executeQuery(
        "SELECT * FROM customers WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        id: createdCustomer[0].id,
        name: createdCustomer[0].name,
        email: createdCustomer[0].email,
        phone: createdCustomer[0].phone,
        address: createdCustomer[0].address,
        company: createdCustomer[0].company,
        customerType: createdCustomer[0].customer_type,
        status: createdCustomer[0].status,
        creditLimit: parseFloat(createdCustomer[0].credit_limit),
        paymentTerms: createdCustomer[0].payment_terms,
        taxId: createdCustomer[0].tax_id,
        notes: createdCustomer[0].notes,
        stats: {
          orderCount: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          lastOrderDate: null,
          totalItemsPurchased: 0,
        },
        createdAt: createdCustomer[0].created_at,
        updatedAt: createdCustomer[0].updated_at,
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Customer email already exists" });
      } else {
        res.status(500).json({ error: "Failed to create customer" });
      }
    }
  },

  // Update customer
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
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

      // Check if customer exists
      const existingCustomer = await executeQuery(
        "SELECT id FROM customers WHERE id = ?",
        [id]
      );

      if (existingCustomer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const query = `
        UPDATE customers 
        SET name = ?, email = ?, phone = ?, address = ?, company = ?, customer_type = ?, 
            status = ?, credit_limit = ?, payment_terms = ?, tax_id = ?, notes = ?
        WHERE id = ?
      `;

      const params = [
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
        id,
      ];

      await executeQuery(query, params);

      // Get updated customer
      const updatedCustomer = await executeQuery(
        `SELECT 
          c.*,
          0 as order_count,
          0 as total_spent,
          0 as avg_order_value,
          NULL as last_order_date,
          0 as total_items_purchased
        FROM customers c
        WHERE c.id = ?`,
        [id]
      );

      const customer = updatedCustomer[0];
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
          lastOrderDate: customer.last_order_date,
          totalItemsPurchased: customer.total_items_purchased || 0,
        },
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Customer email already exists" });
      } else {
        res.status(500).json({ error: "Failed to update customer" });
      }
    }
  },

  // Delete customer
  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if customer exists
      const existingCustomer = await executeQuery(
        "SELECT id FROM customers WHERE id = ?",
        [id]
      );

      if (existingCustomer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // In a real application, you might want to check for related orders/invoices
      // For now, we'll allow deletion
      await executeQuery("DELETE FROM customers WHERE id = ?", [id]);

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  },

  // Get customer statistics
  getStats: async (req, res) => {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
          COUNT(CASE WHEN customer_type = 'business' THEN 1 END) as business_customers,
          COUNT(CASE WHEN customer_type = 'individual' THEN 1 END) as individual_customers,
          COALESCE(SUM(credit_limit), 0) as total_credit_limit,
          COALESCE(AVG(credit_limit), 0) as avg_credit_limit
        FROM customers
      `;

      const result = await executeQuery(statsQuery);
      const stats = result[0];

      res.json({
        totalCustomers: stats.total_customers || 0,
        activeCustomers: stats.active_customers || 0,
        businessCustomers: stats.business_customers || 0,
        individualCustomers: stats.individual_customers || 0,
        totalCreditLimit: parseFloat(stats.total_credit_limit) || 0,
        avgCreditLimit: parseFloat(stats.avg_credit_limit) || 0,
      });
    } catch (error) {
      console.error("Error fetching customer statistics:", error);
      res.status(500).json({ error: "Failed to fetch customer statistics" });
    }
  },

  // Get customer types breakdown
  getTypeBreakdown: async (req, res) => {
    try {
      const query = `
        SELECT 
          customer_type,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
          COALESCE(SUM(credit_limit), 0) as total_credit_limit
        FROM customers
        GROUP BY customer_type
      `;

      const breakdown = await executeQuery(query);

      res.json({
        breakdown: breakdown.map((item) => ({
          type: item.customer_type,
          count: item.count,
          activeCount: item.active_count,
          totalCreditLimit: parseFloat(item.total_credit_limit) || 0,
        })),
      });
    } catch (error) {
      console.error("Error fetching customer type breakdown:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch customer type breakdown" });
    }
  },
};

module.exports = customersController;
