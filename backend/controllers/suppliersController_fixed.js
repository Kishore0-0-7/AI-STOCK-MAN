const { executeQuery, buildQuery } = require("../config/database_fixed");

const suppliersController = {
  // Get all suppliers with statistics
  getAllSuppliers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const search = req.query.search;
      const status = req.query.status;

      // Build WHERE conditions
      const whereConditions = [];

      if (search) {
        whereConditions.push({
          clause: "(s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)",
          params: [`%${search}%`, `%${search}%`, `%${search}%`],
        });
      }

      if (status && status !== "all") {
        whereConditions.push({
          clause: "s.status = ?",
          params: [status],
        });
      }

      // Count query
      const countQueryBase = "SELECT COUNT(*) as total FROM suppliers s";
      const { query: countQuery, params: countParams } = buildQuery(
        countQueryBase,
        whereConditions
      );

      const countResult = await executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      // Data query
      const dataQueryBase = `
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
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id`;

      const groupBy = `GROUP BY s.id, s.name, s.email, s.phone, s.address, s.status, s.contact_person, 
                       s.payment_terms, s.notes, s.created_at, s.updated_at`;

      const { query: baseQuery, params: dataParams } = buildQuery(
        dataQueryBase,
        whereConditions
      );

      const fullQuery = `${baseQuery} ${groupBy} ORDER BY s.name ASC LIMIT ? OFFSET ?`;
      dataParams.push(limit, offset);

      const suppliers = await executeQuery(fullQuery, dataParams);

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
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  },

  // Get single supplier
  getSupplier: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
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
        WHERE s.id = ?
        GROUP BY s.id, s.name, s.email, s.phone, s.address, s.status, s.contact_person, 
                 s.payment_terms, s.notes, s.created_at, s.updated_at
      `;

      const result = await executeQuery(query, [id]);

      if (result.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const supplier = result[0];
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
          avgOrderValue: parseFloat(supplier.avg_order_value) || 0,
          lastOrderDate: supplier.last_order_date,
          pendingOrders: supplier.pending_orders || 0,
        },
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at,
      });
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ error: "Failed to fetch supplier" });
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

      const query = `
        INSERT INTO suppliers 
        (name, email, phone, address, contact_person, payment_terms, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        name,
        email || null,
        phone || null,
        address || null,
        contactPerson || null,
        paymentTerms || "Net 30",
        status || "active",
        notes || null,
      ];

      const result = await executeQuery(query, params);

      // Get the created supplier
      const createdSupplier = await executeQuery(
        "SELECT * FROM suppliers WHERE id = ?",
        [result.insertId]
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
        stats: {
          productCount: 0,
          orderCount: 0,
          totalOrdersValue: 0,
          avgOrderValue: 0,
          lastOrderDate: null,
          pendingOrders: 0,
        },
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

  // Update supplier
  updateSupplier: async (req, res) => {
    try {
      const { id } = req.params;
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

      // Check if supplier exists
      const existingSupplier = await executeQuery(
        "SELECT id FROM suppliers WHERE id = ?",
        [id]
      );

      if (existingSupplier.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const query = `
        UPDATE suppliers 
        SET name = ?, email = ?, phone = ?, address = ?, contact_person = ?, 
            payment_terms = ?, status = ?, notes = ?
        WHERE id = ?
      `;

      const params = [
        name,
        email,
        phone,
        address,
        contactPerson,
        paymentTerms,
        status,
        notes,
        id,
      ];

      await executeQuery(query, params);

      // Get updated supplier with stats
      const updatedSupplier = await executeQuery(
        `SELECT 
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
        WHERE s.id = ?
        GROUP BY s.id, s.name, s.email, s.phone, s.address, s.status, s.contact_person, 
                 s.payment_terms, s.notes, s.created_at, s.updated_at`,
        [id]
      );

      const supplier = updatedSupplier[0];
      res.json({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        contactPerson: supplier.contact_person,
        paymentTerms: supplier.payment_terms,
        status: supplier.status,
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
      });
    } catch (error) {
      console.error("Error updating supplier:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Supplier name already exists" });
      } else {
        res.status(500).json({ error: "Failed to update supplier" });
      }
    }
  },

  // Delete supplier
  deleteSupplier: async (req, res) => {
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

      // Check if supplier has related products or purchase orders
      const relatedProducts = await executeQuery(
        "SELECT COUNT(*) as count FROM products WHERE supplier_id = ?",
        [id]
      );

      const relatedOrders = await executeQuery(
        "SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?",
        [id]
      );

      if (relatedProducts[0].count > 0 || relatedOrders[0].count > 0) {
        return res.status(400).json({
          error:
            "Cannot delete supplier with existing products or purchase orders",
        });
      }

      await executeQuery("DELETE FROM suppliers WHERE id = ?", [id]);

      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  },

  // Get supplier products
  getSupplierProducts: async (req, res) => {
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

      const query = `
        SELECT 
          p.*,
          CASE 
            WHEN p.stock_quantity <= p.min_stock_level THEN 'low'
            WHEN p.stock_quantity <= (p.min_stock_level * 1.5) THEN 'medium'
            ELSE 'good'
          END as stock_status
        FROM products p
        WHERE p.supplier_id = ?
        ORDER BY p.name ASC
      `;

      const products = await executeQuery(query, [id]);

      res.json({
        products: products.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          price: parseFloat(product.price),
          cost: parseFloat(product.cost),
          stock: product.stock_quantity,
          minStock: product.min_stock_level,
          stockStatus: product.stock_status,
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        })),
      });
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      res.status(500).json({ error: "Failed to fetch supplier products" });
    }
  },

  // Get supplier purchase orders
  getSupplierOrders: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      // Check if supplier exists
      const existingSupplier = await executeQuery(
        "SELECT name FROM suppliers WHERE id = ?",
        [id]
      );

      if (existingSupplier.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Count query
      const countResult = await executeQuery(
        "SELECT COUNT(*) as total FROM purchase_orders WHERE supplier_id = ?",
        [id]
      );
      const total = countResult[0].total;

      // Data query
      const query = `
        SELECT 
          po.*,
          COUNT(poi.id) as item_count
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        WHERE po.supplier_id = ?
        GROUP BY po.id
        ORDER BY po.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const orders = await executeQuery(query, [id, limit, offset]);

      res.json({
        supplierName: existingSupplier[0].name,
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          orderDate: order.order_date,
          deliveryDate: order.delivery_date,
          expectedDeliveryDate: order.expected_delivery_date,
          status: order.status,
          totalAmount: parseFloat(order.total_amount),
          itemCount: order.item_count || 0,
          notes: order.notes,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching supplier orders:", error);
      res.status(500).json({ error: "Failed to fetch supplier orders" });
    }
  },
};

module.exports = suppliersController;
