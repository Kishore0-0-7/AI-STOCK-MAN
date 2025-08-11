const { executeQuery } = require("../config/db");

const suppliersController = {
  // Get all suppliers
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
      const countQuery = `SELECT COUNT(*) as total FROM suppliers ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get suppliers with product count
      const dataQuery = `
        SELECT 
          s.*,
          COUNT(p.id) as product_count,
          COALESCE(SUM(p.stock_quantity * p.cost), 0) as total_inventory_value
        FROM suppliers s
        LEFT JOIN products p ON s.id = p.supplier_id
        ${whereClause}
        GROUP BY s.id, s.name, s.contact_person, s.email, s.phone, s.address, s.status, s.created_at, s.updated_at
        ORDER BY s.name ASC
        LIMIT ? OFFSET ?
      `;

      const suppliers = await executeQuery(dataQuery, [
        ...params,
        limit,
        offset,
      ]);

      res.json({
        suppliers: suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          contact_person: supplier.contact_person, // Use snake_case to match frontend
          contactPerson: supplier.contact_person, // Keep camelCase for backward compatibility
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          payment_terms: supplier.payment_terms,
          status: supplier.status || "active",
          notes: supplier.notes,
          productCount: supplier.product_count,
          inventoryValue: parseFloat(supplier.total_inventory_value || 0),
          createdAt: supplier.created_at,
          created_at: supplier.created_at, // Snake case for compatibility
          updatedAt: supplier.updated_at,
          updated_at: supplier.updated_at, // Snake case for compatibility
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

  // Get single supplier
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get supplier details
      const supplierQuery = `
        SELECT 
          s.*,
          COUNT(p.id) as product_count,
          COALESCE(SUM(p.stock_quantity * p.cost), 0) as total_inventory_value
        FROM suppliers s
        LEFT JOIN products p ON s.id = p.supplier_id
        WHERE s.id = ?
        GROUP BY s.id
      `;

      const supplierResult = await executeQuery(supplierQuery, [id]);

      if (supplierResult.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const supplier = supplierResult[0];

      // Get supplier's products
      const productsQuery = `
        SELECT id, sku, name, category, stock_quantity, min_stock_level, price
        FROM products
        WHERE supplier_id = ?
        ORDER BY name ASC
        LIMIT 10
      `;

      const products = await executeQuery(productsQuery, [id]);

      res.json({
        id: supplier.id,
        name: supplier.name,
        contact_person: supplier.contact_person, // Use snake_case to match frontend
        contactPerson: supplier.contact_person, // Keep camelCase for backward compatibility
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        status: supplier.status || "active",
        productCount: supplier.product_count,
        inventoryValue: parseFloat(supplier.total_inventory_value || 0),
        products: products.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          stock: product.stock_quantity,
          minStock: product.min_stock_level,
          price: parseFloat(product.price || 0),
          status:
            product.stock_quantity <= product.min_stock_level
              ? "low_stock"
              : "in_stock",
        })),
        createdAt: supplier.created_at,
        created_at: supplier.created_at, // Snake case for compatibility
        updatedAt: supplier.updated_at,
        updated_at: supplier.updated_at, // Snake case for compatibility
      });
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  },

  // Create new supplier
  create: async (req, res) => {
    try {
      const {
        name,
        contactPerson,
        contact_person, // Handle both field names
        email,
        phone,
        address,
        payment_terms,
        notes,
        status = "active",
      } = req.body;

      // Use either contactPerson or contact_person
      const finalContactPerson = contactPerson || contact_person;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Supplier name is required" });
      }

      // Validate status
      if (status && !["active", "inactive"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Status must be 'active' or 'inactive'" });
      }

      // Check if supplier with same name exists
      const existingSupplier = await executeQuery(
        "SELECT id FROM suppliers WHERE name = ?",
        [name]
      );
      if (existingSupplier.length > 0) {
        return res
          .status(400)
          .json({ error: "Supplier with this name already exists" });
      }

      const query = `
        INSERT INTO suppliers (name, contact_person, email, phone, address, payment_terms, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [
        name,
        finalContactPerson,
        email,
        phone,
        address,
        payment_terms,
        notes,
        status,
      ]);

      // Fetch the created supplier
      const createdSupplier = await executeQuery(
        "SELECT * FROM suppliers WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        id: createdSupplier[0].id,
        name: createdSupplier[0].name,
        contact_person: createdSupplier[0].contact_person, // Use snake_case to match frontend
        contactPerson: createdSupplier[0].contact_person, // Keep camelCase for backward compatibility
        email: createdSupplier[0].email,
        phone: createdSupplier[0].phone,
        address: createdSupplier[0].address,
        payment_terms: createdSupplier[0].payment_terms,
        status: createdSupplier[0].status,
        notes: createdSupplier[0].notes,
        createdAt: createdSupplier[0].created_at,
        created_at: createdSupplier[0].created_at, // Snake case for compatibility
        updatedAt: createdSupplier[0].updated_at,
        updated_at: createdSupplier[0].updated_at, // Snake case for compatibility
      });
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  },

  // Update supplier
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        contactPerson,
        contact_person, // Handle both field names
        email,
        phone,
        address,
        status,
      } = req.body;

      // Use either contactPerson or contact_person
      const finalContactPerson = contactPerson || contact_person;

      // Check if supplier exists
      const existingSupplier = await executeQuery(
        "SELECT id FROM suppliers WHERE id = ?",
        [id]
      );
      if (existingSupplier.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Validate status if provided
      if (status && !["active", "inactive"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Status must be 'active' or 'inactive'" });
      }

      // Check if name conflicts with another supplier
      if (name) {
        const nameConflict = await executeQuery(
          "SELECT id FROM suppliers WHERE name = ? AND id != ?",
          [name, id]
        );
        if (nameConflict.length > 0) {
          return res
            .status(400)
            .json({ error: "Supplier name already exists" });
        }
      }

      const query = `
        UPDATE suppliers SET
          name = COALESCE(?, name),
          contact_person = COALESCE(?, contact_person),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await executeQuery(query, [
        name,
        finalContactPerson,
        email,
        phone,
        address,
        status,
        id,
      ]);

      // Fetch updated supplier
      const updatedSupplier = await executeQuery(
        "SELECT * FROM suppliers WHERE id = ?",
        [id]
      );

      res.json({
        message: "Supplier updated successfully",
        supplier: {
          id: updatedSupplier[0].id,
          name: updatedSupplier[0].name,
          contact_person: updatedSupplier[0].contact_person, // Use snake_case to match frontend
          contactPerson: updatedSupplier[0].contact_person, // Keep camelCase for backward compatibility
          email: updatedSupplier[0].email,
          phone: updatedSupplier[0].phone,
          address: updatedSupplier[0].address,
          status: updatedSupplier[0].status,
          updatedAt: updatedSupplier[0].updated_at,
          updated_at: updatedSupplier[0].updated_at, // Snake case for compatibility
        },
      });
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  },

  // Update supplier status only
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (!status || !["active", "inactive"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Status must be 'active' or 'inactive'" });
      }

      // Check if supplier exists
      const existingSupplier = await executeQuery(
        "SELECT id, name FROM suppliers WHERE id = ?",
        [id]
      );
      if (existingSupplier.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      await executeQuery(
        "UPDATE suppliers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, id]
      );

      res.json({
        message: `Supplier status updated to ${status}`,
        supplier: {
          id: parseInt(id),
          name: existingSupplier[0].name,
          status: status,
        },
      });
    } catch (error) {
      console.error("Error updating supplier status:", error);
      res.status(500).json({ error: "Failed to update supplier status" });
    }
  },

  // Delete supplier
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if supplier exists
      const existingSupplier = await executeQuery(
        "SELECT id FROM suppliers WHERE id = ?",
        [id]
      );
      if (existingSupplier.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Check if supplier has products
      const products = await executeQuery(
        "SELECT COUNT(*) as count FROM products WHERE supplier_id = ?",
        [id]
      );
      if (products[0].count > 0) {
        return res.status(400).json({
          error: `Cannot delete supplier. ${products[0].count} products are associated with this supplier.`,
          productCount: products[0].count,
        });
      }

      await executeQuery("DELETE FROM suppliers WHERE id = ?", [id]);

      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  },

  // Get supplier's products
  getProducts: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;

      // Check if supplier exists
      const supplier = await executeQuery(
        "SELECT name FROM suppliers WHERE id = ?",
        [id]
      );
      if (supplier.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Get total count
      const countResult = await executeQuery(
        "SELECT COUNT(*) as total FROM products WHERE supplier_id = ?",
        [id]
      );
      const total = countResult[0].total;

      // Get products
      const products = await executeQuery(
        `
        SELECT 
          id, sku, name, description, category, price, cost, 
          stock_quantity, min_stock_level, created_at, updated_at
        FROM products
        WHERE supplier_id = ?
        ORDER BY name ASC
        LIMIT ? OFFSET ?
      `,
        [id, limit, offset]
      );

      res.json({
        supplier: {
          id: parseInt(id),
          name: supplier[0].name,
        },
        products: products.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          price: parseFloat(product.price || 0),
          cost: parseFloat(product.cost || 0),
          stock: product.stock_quantity,
          minStock: product.min_stock_level,
          status:
            product.stock_quantity <= product.min_stock_level
              ? "low_stock"
              : "in_stock",
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      res.status(500).json({ error: "Failed to fetch supplier products" });
    }
  },
};

module.exports = suppliersController;
