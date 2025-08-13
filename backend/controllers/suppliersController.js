const { pool } = require("../config/database");
const Joi = require("joi");

class SuppliersController {
  // Get all suppliers - matches suppliersAPI.getAll()
  static async getAllSuppliers(req, res) {
    try {
      console.log("Getting all suppliers...");

      const [suppliers] = await pool.execute(`
        SELECT 
          s.id,
          s.name,
          s.category,
          s.contact_person,
          s.email,
          s.phone,
          s.address,
          s.payment_terms,
          s.status,
          s.notes,
          s.created_at,
          s.updated_at,
          COUNT(DISTINCT p.id) as total_products,
          COALESCE(SUM(DISTINCT po.total_amount), 0) as total_value,
          COUNT(DISTINCT po.id) as total_orders
        FROM suppliers s
        LEFT JOIN products p ON s.id = p.supplier_id
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        GROUP BY s.id, s.name, s.category, s.contact_person, s.email, s.phone, s.address, s.payment_terms, s.status, s.notes, s.created_at, s.updated_at
        ORDER BY s.name ASC
      `);

      console.log("Found suppliers:", suppliers.length);

      // Transform data to match frontend expectations
      const transformedSuppliers = suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        contact_person: supplier.contact_person,
        contact_name: supplier.contact_person, // Alternative field name
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        payment_terms: supplier.payment_terms,
        status: supplier.status,
        notes: supplier.notes,
        created_at: supplier.created_at,
        updated_at: supplier.updated_at,
        total_products: parseInt(supplier.total_products) || 0,
        total_value: parseFloat(supplier.total_value) || 0,
        total_orders: parseInt(supplier.total_orders) || 0,
      }));

      res.json(transformedSuppliers);
    } catch (error) {
      console.error("Get all suppliers error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch suppliers",
        error: error.message,
      });
    }
  }

  // Get supplier by ID - matches suppliersAPI.getById()
  static async getSupplierById(req, res) {
    try {
      const { id } = req.params;

      const [suppliers] = await pool.execute(
        `
        SELECT 
          s.id,
          s.name,
          s.category,
          s.contact_person,
          s.email,
          s.phone,
          s.address,
          s.payment_terms,
          s.status,
          s.notes,
          s.created_at,
          s.updated_at,
          COUNT(p.id) as total_products,
          COALESCE(SUM(p.current_stock * p.cost), 0) as total_value,
          COUNT(po.id) as total_orders
        FROM suppliers s
        LEFT JOIN products p ON s.id = p.supplier_id
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE s.id = ?
        GROUP BY s.id
        `,
        [id]
      );

      if (suppliers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      const supplier = suppliers[0];

      // Get recent orders for this supplier
      const [recentOrders] = await pool.execute(
        `
        SELECT 
          po.id,
          po.order_number,
          po.order_date,
          po.total_amount,
          po.status,
          po.expected_delivery_date
        FROM purchase_orders po
        WHERE po.supplier_id = ?
        ORDER BY po.order_date DESC
        LIMIT 10
        `,
        [id]
      );

      // Transform data
      const transformedSupplier = {
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        contact_person: supplier.contact_person,
        contact_name: supplier.contact_person,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        payment_terms: supplier.payment_terms,
        status: supplier.status,
        notes: supplier.notes,
        created_at: supplier.created_at,
        updated_at: supplier.updated_at,
        total_products: supplier.total_products,
        total_value: parseFloat(supplier.total_value) || 0,
        total_orders: supplier.total_orders,
        recent_orders: recentOrders,
      };

      res.json(transformedSupplier);
    } catch (error) {
      console.error("Get supplier by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch supplier",
        error: error.message,
      });
    }
  }

  // Create new supplier - matches suppliersAPI.create()
  static async createSupplier(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().required().max(255),
        category: Joi.string().required().max(100),
        contact_person: Joi.string().required().max(255),
        email: Joi.string().email().required().max(255),
        phone: Joi.string().max(20),
        address: Joi.string().max(500),
        payment_terms: Joi.string().max(255),
        status: Joi.string().valid("active", "inactive").default("active"),
        notes: Joi.string().max(1000),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: error.details[0].message,
        });
      }

      const [result] = await pool.execute(
        `
        INSERT INTO suppliers (name, category, contact_person, email, phone, address, payment_terms, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          value.name,
          value.category,
          value.contact_person,
          value.email,
          value.phone,
          value.address,
          value.payment_terms,
          value.status,
          value.notes,
        ]
      );

      // Fetch the created supplier
      const [newSupplier] = await pool.execute(
        "SELECT * FROM suppliers WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        data: newSupplier[0],
      });
    } catch (error) {
      console.error("Create supplier error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "Supplier with this email already exists",
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to create supplier",
        error: error.message,
      });
    }
  }

  // Update supplier - matches suppliersAPI.update()
  static async updateSupplier(req, res) {
    try {
      const { id } = req.params;

      const schema = Joi.object({
        name: Joi.string().max(255),
        category: Joi.string().max(100),
        contact_person: Joi.string().max(255),
        email: Joi.string().email().max(255),
        phone: Joi.string().max(20),
        address: Joi.string().max(500),
        payment_terms: Joi.string().max(255),
        status: Joi.string().valid("active", "inactive"),
        notes: Joi.string().max(1000),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: error.details[0].message,
        });
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];

      Object.entries(value).forEach(([key, val]) => {
        if (val !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(val);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update",
        });
      }

      updateValues.push(id);

      const [result] = await pool.execute(
        `UPDATE suppliers SET ${updateFields.join(
          ", "
        )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      // Fetch updated supplier
      const [updatedSupplier] = await pool.execute(
        "SELECT * FROM suppliers WHERE id = ?",
        [id]
      );

      res.json({
        success: true,
        message: "Supplier updated successfully",
        data: updatedSupplier[0],
      });
    } catch (error) {
      console.error("Update supplier error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update supplier",
        error: error.message,
      });
    }
  }

  // Update supplier status - matches suppliersAPI.updateStatus()
  static async updateSupplierStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'active' or 'inactive'",
        });
      }

      const [result] = await pool.execute(
        "UPDATE suppliers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      res.json({
        success: true,
        message: `Supplier ${
          status === "active" ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Update supplier status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update supplier status",
        error: error.message,
      });
    }
  }

  // Delete supplier - matches suppliersAPI.delete()
  static async deleteSupplier(req, res) {
    try {
      const { id } = req.params;

      // Check if supplier has products
      const [products] = await pool.execute(
        "SELECT COUNT(*) as count FROM products WHERE supplier_id = ?",
        [id]
      );

      if (products[0].count > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot delete supplier with associated products. Please remove or reassign products first.",
        });
      }

      const [result] = await pool.execute(
        "DELETE FROM suppliers WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      res.json({
        success: true,
        message: "Supplier deleted successfully",
      });
    } catch (error) {
      console.error("Delete supplier error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete supplier",
        error: error.message,
      });
    }
  }

  // Get supplier performance metrics - matches suppliersAPI.getPerformance()
  static async getSupplierPerformance(req, res) {
    try {
      const { id } = req.params;
      const { period = 12 } = req.query; // months

      const [performance] = await pool.execute(
        `
        SELECT 
          COUNT(po.id) as total_orders,
          COALESCE(SUM(po.total_amount), 0) as total_value,
          AVG(DATEDIFF(po.delivery_date, po.expected_delivery_date)) as avg_delivery_delay,
          COUNT(CASE WHEN po.status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN po.status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM purchase_orders po
        WHERE po.supplier_id = ?
          AND po.order_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        `,
        [id, parseInt(period)]
      );

      const metrics = performance[0];
      const onTimeDeliveryRate =
        metrics.total_orders > 0
          ? ((metrics.total_orders - metrics.cancelled_orders) /
              metrics.total_orders) *
            100
          : 0;

      res.json({
        total_orders: metrics.total_orders,
        total_value: parseFloat(metrics.total_value) || 0,
        avg_delivery_delay: parseFloat(metrics.avg_delivery_delay) || 0,
        completed_orders: metrics.completed_orders,
        cancelled_orders: metrics.cancelled_orders,
        on_time_delivery_rate: Math.round(onTimeDeliveryRate * 100) / 100,
        period_months: parseInt(period),
      });
    } catch (error) {
      console.error("Get supplier performance error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch supplier performance",
        error: error.message,
      });
    }
  }

  // Get suppliers stats overview - matches suppliersAPI.getStats()
  static async getSuppliersStats(req, res) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_suppliers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_suppliers,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_suppliers,
          COUNT(DISTINCT category) as total_categories
        FROM suppliers
      `);

      const [valueStats] = await pool.execute(`
        SELECT 
          COALESCE(SUM(p.current_stock * p.cost), 0) as total_inventory_value,
          COUNT(DISTINCT s.id) as suppliers_with_products
        FROM suppliers s
        LEFT JOIN products p ON s.id = p.supplier_id
        WHERE s.status = 'active'
      `);

      res.json({
        total_suppliers: stats[0].total_suppliers,
        active_suppliers: stats[0].active_suppliers,
        inactive_suppliers: stats[0].inactive_suppliers,
        total_categories: stats[0].total_categories,
        total_inventory_value:
          parseFloat(valueStats[0].total_inventory_value) || 0,
        suppliers_with_products: valueStats[0].suppliers_with_products,
      });
    } catch (error) {
      console.error("Get suppliers stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch suppliers statistics",
        error: error.message,
      });
    }
  }

  // Get top performing suppliers - matches suppliersAPI.getTopPerformers()
  static async getTopPerformers(req, res) {
    try {
      const { limit = 10, period = 12 } = req.query;

      const [topPerformers] = await pool.execute(
        `
        SELECT 
          s.id,
          s.name,
          s.category,
          COUNT(po.id) as total_orders,
          COALESCE(SUM(po.total_amount), 0) as total_value,
          AVG(CASE WHEN po.delivery_date <= po.expected_delivery_date THEN 100 ELSE 0 END) as on_time_rate
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE s.status = 'active'
          AND (po.order_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) OR po.id IS NULL)
        GROUP BY s.id, s.name, s.category
        HAVING total_orders > 0
        ORDER BY total_value DESC, on_time_rate DESC
        LIMIT ?
        `,
        [parseInt(period), parseInt(limit)]
      );

      const transformedPerformers = topPerformers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        total_orders: supplier.total_orders,
        total_value: parseFloat(supplier.total_value) || 0,
        on_time_rate: Math.round((supplier.on_time_rate || 0) * 100) / 100,
      }));

      res.json(transformedPerformers);
    } catch (error) {
      console.error("Get top performers error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch top performing suppliers",
        error: error.message,
      });
    }
  }
}

module.exports = SuppliersController;
