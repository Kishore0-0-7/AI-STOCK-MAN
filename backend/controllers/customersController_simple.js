const { executeQuery } = require("../config/database_robust");

const customersController = {
  // Get all customers - simplified
  getAllCustomers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Simple count query
      const countQuery = "SELECT COUNT(*) as total FROM customers";
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      // Simple data query
      const dataQuery = `
        SELECT * FROM customers
        ORDER BY name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const customers = await executeQuery(dataQuery);

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

      const mysql = require("mysql2");

      const query = `
        INSERT INTO customers 
        (name, email, phone, address, company, customer_type, status, credit_limit, payment_terms, tax_id, notes)
        VALUES (
          ${mysql.escape(name)},
          ${mysql.escape(email || null)},
          ${mysql.escape(phone || null)},
          ${mysql.escape(address || null)},
          ${mysql.escape(company || null)},
          ${mysql.escape(customerType || "individual")},
          ${mysql.escape(status || "active")},
          ${mysql.escape(creditLimit || 0.0)},
          ${mysql.escape(paymentTerms || "Net 30")},
          ${mysql.escape(taxId || null)},
          ${mysql.escape(notes || null)}
        )
      `;

      const result = await executeQuery(query);

      // Get the created customer
      const createdCustomer = await executeQuery(
        `SELECT * FROM customers WHERE id = ${result.insertId}`
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
};

module.exports = customersController;
