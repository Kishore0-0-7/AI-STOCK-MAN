const { pool } = require("../config/database");

class ProductsController {
  // Get all products - matches productsAPI.getAll()
  static async getAllProducts(req, res) {
    try {
      const { limit, category, status = "active", search } = req.query;

      // Build parameterized query
      let query = `
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.description,
          p.category,
          p.price,
          p.cost,
          p.current_stock,
          p.low_stock_threshold,
          p.max_stock_level,
          p.unit,
          p.barcode,
          p.supplier_id,
          p.reorder_level,
          p.reorder_quantity,
          p.location,
          p.status,
          p.created_at,
          p.updated_at,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.status = ?
      `;

      const params = [status || "active"];

      // Add category filter if provided
      if (category && category.trim() !== "") {
        query += " AND p.category = ?";
        params.push(category.trim());
      }

      // Add search filter if provided
      if (search && search.trim() !== "") {
        query += " AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)";
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Add ordering
      query += " ORDER BY p.name ASC";

      // Add limit if provided and valid
      if (limit) {
        const limitValue = parseInt(limit, 10);
        if (!isNaN(limitValue) && limitValue > 0 && limitValue <= 1000) {
          query += " LIMIT ?";
          params.push(limitValue);
        }
      }

      const [products] = await pool.query(query, params);

      // Transform data to match frontend expectations
      const transformedProducts = products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        cost: product.cost,
        current_stock: product.current_stock,
        stock: product.current_stock, // For frontend compatibility
        low_stock_threshold: product.low_stock_threshold,
        minStock: product.low_stock_threshold, // For frontend compatibility
        max_stock_level: product.max_stock_level,
        maxStock: product.max_stock_level, // For frontend compatibility
        unit: product.unit,
        barcode: product.barcode,
        supplier_id: product.supplier_id,
        reorder_level: product.reorder_level,
        reorder_quantity: product.reorder_quantity,
        location: product.location,
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at,
        supplier: product.supplier_name
          ? {
              id: product.supplier_id,
              name: product.supplier_name,
              email: product.supplier_email,
              phone: product.supplier_phone,
            }
          : null,
      }));

      res.json(transformedProducts);
    } catch (error) {
      console.error("Get all products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch products",
        error: error.message,
      });
    }
  }

  // Get low stock products - matches productsAPI.getLowStock()
  static async getLowStockProducts(req, res) {
    try {
      const [products] = await pool.execute(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.description,
          p.category,
          p.price,
          p.cost,
          p.current_stock,
          p.low_stock_threshold,
          p.max_stock_level,
          p.unit,
          p.supplier_id,
          p.reorder_level,
          p.reorder_quantity,
          p.location,
          p.status,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone,
          CASE 
            WHEN p.current_stock = 0 THEN 'out_of_stock'
            WHEN p.current_stock <= (p.low_stock_threshold * 0.5) THEN 'critical'
            WHEN p.current_stock <= p.low_stock_threshold THEN 'low'
            ELSE 'normal'
          END as stock_status
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.status = 'active' 
          AND p.current_stock <= p.low_stock_threshold
        ORDER BY p.current_stock ASC, p.name ASC
      `);

      // Transform data to match frontend expectations
      const transformedProducts = products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        cost: product.cost,
        current_stock: product.current_stock,
        stock: product.current_stock, // For frontend compatibility
        low_stock_threshold: product.low_stock_threshold,
        minStock: product.low_stock_threshold, // For frontend compatibility
        max_stock_level: product.max_stock_level,
        maxStock: product.max_stock_level, // For frontend compatibility
        unit: product.unit,
        supplier_id: product.supplier_id,
        reorder_level: product.reorder_level,
        reorder_quantity: product.reorder_quantity,
        location: product.location,
        status: product.status,
        stock_status: product.stock_status,
        supplier: product.supplier_name
          ? {
              id: product.supplier_id,
              name: product.supplier_name,
              email: product.supplier_email,
              phone: product.supplier_phone,
            }
          : null,
      }));

      res.json(transformedProducts);
    } catch (error) {
      console.error("Get low stock products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch low stock products",
        error: error.message,
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      const [products] = await pool.execute(
        `
        SELECT 
          p.*,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone,
          s.address as supplier_address,
          pc.name as category_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.id = ?
      `,
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const product = products[0];

      // Get stock movements for this product
      const [movements] = await pool.execute(
        `
        SELECT * FROM stock_movements 
        WHERE product_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `,
        [id]
      );

      res.json({
        ...product,
        stockMovements: movements,
      });
    } catch (error) {
      console.error("Get product by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch product",
        error: error.message,
      });
    }
  }

  // Create new product
  static async createProduct(req, res) {
    try {
      const {
        sku,
        name,
        description,
        category,
        category_id,
        price,
        cost,
        current_stock,
        low_stock_threshold,
        max_stock_level,
        unit,
        barcode,
        supplier_id,
        reorder_level,
        reorder_quantity,
        location,
      } = req.body;

      const [result] = await pool.execute(
        `
        INSERT INTO products (
          sku, name, description, category, category_id, price, cost,
          current_stock, low_stock_threshold, max_stock_level, unit,
          barcode, supplier_id, reorder_level, reorder_quantity, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          sku,
          name,
          description,
          category,
          category_id,
          price || 0,
          cost || 0,
          current_stock || 0,
          low_stock_threshold || 10,
          max_stock_level || 1000,
          unit || "pieces",
          barcode,
          supplier_id,
          reorder_level || 0,
          reorder_quantity || 0,
          location,
        ]
      );

      // Log activity
      await pool.execute(
        `
        INSERT INTO user_activities (activity_type, table_name, record_id, description, user_name)
        VALUES ('create', 'products', ?, ?, 'System')
      `,
        [result.insertId, `Created new product: ${name}`]
      );

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        id: result.insertId,
      });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create product",
        error: error.message,
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove id from update data if present
      delete updateData.id;

      const fields = Object.keys(updateData);
      const values = Object.values(updateData);

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      values.push(id);

      const [result] = await pool.execute(
        `
        UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Log activity
      await pool.execute(
        `
        INSERT INTO user_activities (activity_type, table_name, record_id, description, user_name)
        VALUES ('update', 'products', ?, ?, 'System')
      `,
        [id, `Updated product with ID: ${id}`]
      );

      res.json({
        success: true,
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update product",
        error: error.message,
      });
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      // Soft delete by updating status
      const [result] = await pool.execute(
        `
        UPDATE products SET status = 'discontinued', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Log activity
      await pool.execute(
        `
        INSERT INTO user_activities (activity_type, table_name, record_id, description, user_name)
        VALUES ('delete', 'products', ?, ?, 'System')
      `,
        [id, `Deleted product with ID: ${id}`]
      );

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete product",
        error: error.message,
      });
    }
  }

  // Get product categories
  static async getCategories(req, res) {
    try {
      const [categories] = await pool.execute(`
        SELECT 
          pc.id,
          pc.name,
          pc.description,
          pc.status,
          COUNT(p.id) as product_count
        FROM product_categories pc
        LEFT JOIN products p ON pc.id = p.category_id AND p.status = 'active'
        WHERE pc.status = 'active'
        GROUP BY pc.id, pc.name, pc.description, pc.status
        ORDER BY pc.name
      `);

      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
        error: error.message,
      });
    }
  }
}

module.exports = ProductsController;
