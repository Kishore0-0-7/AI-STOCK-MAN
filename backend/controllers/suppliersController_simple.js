const { executeQuery } = require("../config/database_robust");

const suppliersController = {
  // Get all suppliers - simplified
  getAllSuppliers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Simple count query
      const countQuery = "SELECT COUNT(*) as total FROM suppliers";
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      // Simple data query
      const dataQuery = `
        SELECT * FROM suppliers
        ORDER BY name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const suppliers = await executeQuery(dataQuery);

      res.json({
        suppliers: suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          status: supplier.status,
          contactPerson: supplier.contact_person,
          paymentTerms: supplier.payment_terms,
          notes: supplier.notes,
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
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  },

  // Create new supplier
  createSupplier: async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        address,
        contactPerson,
        paymentTerms,
        status,
        notes,
      } = req.body;

      // Validation
      if (!name) {
        return res.status(400).json({ error: "Supplier name is required" });
      }

      const mysql = require("mysql2");

      const query = `
        INSERT INTO suppliers 
        (name, email, phone, address, contact_person, payment_terms, status, notes)
        VALUES (
          ${mysql.escape(name)},
          ${mysql.escape(email || null)},
          ${mysql.escape(phone || null)},
          ${mysql.escape(address || null)},
          ${mysql.escape(contactPerson || null)},
          ${mysql.escape(paymentTerms || "Net 30")},
          ${mysql.escape(status || "active")},
          ${mysql.escape(notes || null)}
        )
      `;

      const result = await executeQuery(query);

      // Get the created supplier
      const createdSupplier = await executeQuery(
        `SELECT * FROM suppliers WHERE id = ${result.insertId}`
      );

      res.status(201).json({
        id: createdSupplier[0].id,
        name: createdSupplier[0].name,
        email: createdSupplier[0].email,
        phone: createdSupplier[0].phone,
        address: createdSupplier[0].address,
        contactPerson: createdSupplier[0].contact_person,
        paymentTerms: createdSupplier[0].payment_terms,
        status: createdSupplier[0].status,
        notes: createdSupplier[0].notes,
        createdAt: createdSupplier[0].created_at,
        updatedAt: createdSupplier[0].updated_at,
      });
    } catch (error) {
      console.error("Error creating supplier:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Supplier name already exists" });
      } else {
        res.status(500).json({ error: "Failed to create supplier" });
      }
    }
  },
};

module.exports = suppliersController;
