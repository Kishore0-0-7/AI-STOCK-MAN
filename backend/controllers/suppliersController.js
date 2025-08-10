const { executeQuery } = require("../config/database");

const suppliersController = {
  // Get all suppliers with statistics
  getAllSuppliers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const search = req.query.search;
      const status = req.query.status;

      let whereClause = "1=1";
      let queryParams = [];

      if (search) {
        whereClause +=
          " AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (status && status !== "all") {
        whereClause += " AND s.status = ?";
        queryParams.push(status);
      }

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM suppliers s WHERE ${whereClause}`;
      const [countResult] = await executeQuery(countQuery, queryParams);
      const total = countResult.total;

      // Data query
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

      const suppliers = await executeQuery(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

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

  // Get supplier by ID with detailed information
  getSupplierById: async (req, res) => {
    try {
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

      const [supplier] = await executeQuery(supplierQuery, [supplierId]);

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

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

      const products = await executeQuery(productsQuery, [supplierId]);

      // Get recent purchase orders
      const ordersQuery = `
        SELECT 
          id, order_number, status, order_date, delivery_date, total_amount
        FROM purchase_orders 
        WHERE supplier_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `;

      const orders = await executeQuery(ordersQuery, [supplierId]);

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
        products: products.map((product) => ({
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
        recentOrders: orders.map((order) => ({
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
        notes,
        status,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Supplier name is required" });
      }

      // Check if supplier name already exists
      const [existingSupplier] = await executeQuery(
        "SELECT id FROM suppliers WHERE name = ?",
        [name]
      );
      if (existingSupplier) {
        return res.status(400).json({ error: "Supplier name already exists" });
      }

      const insertQuery = `
        INSERT INTO suppliers (
          name, email, phone, address, contact_person, payment_terms, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(insertQuery, [
        name,
        email || null,
        phone || null,
        address || null,
        contactPerson || null,
        paymentTerms || null,
        notes || null,
        status || "active",
      ]);

      res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        supplierId: result.insertId,
      });
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  },

  // Update supplier
  updateSupplier: async (req, res) => {
    try {
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
      const [existingSupplier] = await executeQuery(
        "SELECT id FROM suppliers WHERE name = ? AND id != ?",
        [name, supplierId]
      );
      if (existingSupplier) {
        return res.status(400).json({ error: "Supplier name already exists" });
      }

      const updateQuery = `
        UPDATE suppliers SET
          name = ?, email = ?, phone = ?, address = ?, 
          contact_person = ?, payment_terms = ?, notes = ?, status = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      const result = await executeQuery(updateQuery, [
        name,
        email || null,
        phone || null,
        address || null,
        contactPerson || null,
        paymentTerms || null,
        notes || null,
        status || "active",
        supplierId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      res.json({
        success: true,
        message: "Supplier updated successfully",
      });
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  },

  // Delete supplier
  deleteSupplier: async (req, res) => {
    try {
      const supplierId = req.params.id;

      // Check if supplier has active products or orders
      const checkQuery = `
        SELECT 
          (SELECT COUNT(*) FROM products WHERE supplier_id = ?) as product_count,
          (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = ? AND status IN ('pending', 'approved')) as active_orders
      `;

      const [dependencies] = await executeQuery(checkQuery, [
        supplierId,
        supplierId,
      ]);

      if (dependencies.product_count > 0 || dependencies.active_orders > 0) {
        // Soft delete - set status to inactive
        const result = await executeQuery(
          "UPDATE suppliers SET status = 'inactive', updated_at = NOW() WHERE id = ?",
          [supplierId]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Supplier not found" });
        }

        res.json({
          success: true,
          message:
            "Supplier deactivated successfully (has active products/orders)",
        });
      } else {
        // Hard delete if no dependencies
        const result = await executeQuery(
          "DELETE FROM suppliers WHERE id = ?",
          [supplierId]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Supplier not found" });
        }

        res.json({
          success: true,
          message: "Supplier deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  },

  // Get supplier performance metrics
  getSupplierPerformance: async (req, res) => {
    try {
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

      const [performance] = await executeQuery(performanceQuery, [supplierId]);

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

      const monthlyPerformance = await executeQuery(monthlyPerformanceQuery, [
        supplierId,
      ]);

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
        monthlyTrend: monthlyPerformance.map((month) => ({
          month: month.month,
          orders: month.orders,
          value: parseFloat(month.value),
        })),
      });
    } catch (error) {
      console.error("Error fetching supplier performance:", error);
      res.status(500).json({ error: "Failed to fetch supplier performance" });
    }
  },

  // Get supplier statistics
  getSupplierStats: async (req, res) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_suppliers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_suppliers,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_suppliers,
          (SELECT COUNT(DISTINCT supplier_id) FROM purchase_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_this_month,
          (SELECT AVG(total_amount) FROM purchase_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_order_value
        FROM suppliers
      `;

      const [stats] = await executeQuery(query);

      res.json({
        totalSuppliers: stats.total_suppliers || 0,
        activeSuppliers: stats.active_suppliers || 0,
        inactiveSuppliers: stats.inactive_suppliers || 0,
        activeThisMonth: stats.active_this_month || 0,
        avgOrderValue: parseFloat(stats.avg_order_value) || 0,
      });
    } catch (error) {
      console.error("Error fetching supplier stats:", error);
      res.status(500).json({ error: "Failed to fetch supplier statistics" });
    }
  },

  // Get top suppliers by various metrics
  getTopPerformers: async (req, res) => {
    try {
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

      const suppliers = await executeQuery(query, [limit]);

      res.json(
        suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          status: supplier.status,
          productCount: supplier.product_count || 0,
          orderCount: supplier.order_count || 0,
          totalValue: parseFloat(supplier.total_value) || 0,
          lastOrderDate: supplier.last_order_date,
        }))
      );
    } catch (error) {
      console.error("Error fetching top suppliers:", error);
      res.status(500).json({ error: "Failed to fetch top suppliers" });
    }
  },
};

module.exports = suppliersController;
