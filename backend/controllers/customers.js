const { executeQuery } = require("../config/db");

const customersController = {
  // Get all customers
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = (page - 1) * limit;
      const search = req.query.search || "";

      let whereClause = "WHERE 1=1";
      let params = [];

      if (search) {
        whereClause += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get customers
      const customersQuery = `
        SELECT *
        FROM customers
        ${whereClause}
        ORDER BY name ASC
        LIMIT ? OFFSET ?
      `;

      const customers = await executeQuery(customersQuery, [
        ...params,
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
          created_at: customer.created_at,
          updated_at: customer.updated_at,
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
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await executeQuery(
        "SELECT * FROM customers WHERE id = ?",
        [id]
      );

      if (customer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({
        id: customer[0].id,
        name: customer[0].name,
        email: customer[0].email,
        phone: customer[0].phone,
        address: customer[0].address,
        created_at: customer[0].created_at,
        updated_at: customer[0].updated_at,
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  },

  // Create new customer
  create: async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Customer name is required" });
      }

      // Check if customer with same email exists (if email provided)
      if (email) {
        const existingCustomer = await executeQuery(
          "SELECT id FROM customers WHERE email = ?",
          [email]
        );
        if (existingCustomer.length > 0) {
          return res
            .status(400)
            .json({ error: "Customer with this email already exists" });
        }
      }

      const query = `
        INSERT INTO customers (name, email, phone, address)
        VALUES (?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [name, email, phone, address]);

      // Fetch the created customer
      const createdCustomer = await executeQuery(
        "SELECT * FROM customers WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        message: "Customer created successfully",
        customer: {
          id: createdCustomer[0].id,
          name: createdCustomer[0].name,
          email: createdCustomer[0].email,
          phone: createdCustomer[0].phone,
          address: createdCustomer[0].address,
          createdAt: createdCustomer[0].created_at,
        },
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  },

  // Update customer
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, address } = req.body;

      // Check if customer exists
      const existingCustomer = await executeQuery(
        "SELECT id FROM customers WHERE id = ?",
        [id]
      );
      if (existingCustomer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Check if email conflicts with another customer
      if (email) {
        const emailConflict = await executeQuery(
          "SELECT id FROM customers WHERE email = ? AND id != ?",
          [email, id]
        );
        if (emailConflict.length > 0) {
          return res
            .status(400)
            .json({ error: "Email already exists for another customer" });
        }
      }

      const query = `
        UPDATE customers SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await executeQuery(query, [name, email, phone, address, id]);

      // Fetch updated customer
      const updatedCustomer = await executeQuery(
        "SELECT * FROM customers WHERE id = ?",
        [id]
      );

      res.json({
        message: "Customer updated successfully",
        customer: {
          id: updatedCustomer[0].id,
          name: updatedCustomer[0].name,
          email: updatedCustomer[0].email,
          phone: updatedCustomer[0].phone,
          address: updatedCustomer[0].address,
          updatedAt: updatedCustomer[0].updated_at,
        },
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  },

  // Delete customer
  delete: async (req, res) => {
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
      const queries = {
        total: "SELECT COUNT(*) as count FROM customers",
        recentlyAdded:
          "SELECT COUNT(*) as count FROM customers WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)",
      };

      const [total, recentlyAdded] = await Promise.all([
        executeQuery(queries.total),
        executeQuery(queries.recentlyAdded),
      ]);

      res.json({
        totalCustomers: total[0].count,
        recentlyAdded: recentlyAdded[0].count,
      });
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ error: "Failed to fetch customer statistics" });
    }
  },
};

module.exports = customersController;
