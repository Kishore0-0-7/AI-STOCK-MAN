const { executeQuery, buildQuery } = require("../config/database_fixed");

const productsController = {
  // Get all products with pagination and filtering
  getAllProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const category = req.query.category;
      const search = req.query.search;
      const sortBy = req.query.sortBy || "name";
      const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC";

      // Build WHERE conditions
      const whereConditions = [];

      if (category && category !== "all") {
        whereConditions.push({
          clause: "p.category = ?",
          params: [category],
        });
      }

      if (search) {
        whereConditions.push({
          clause: "(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)",
          params: [`%${search}%`, `%${search}%`, `%${search}%`],
        });
      }

      // Count query
      const countQueryBase = "SELECT COUNT(*) as total FROM products p";
      const { query: countQuery, params: countParams } = buildQuery(
        countQueryBase,
        whereConditions
      );

      console.log("Count query:", countQuery);
      console.log("Count params:", countParams);

      const countResult = await executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      // Data query
      const dataQueryBase = `
        SELECT 
          p.*,
          s.name as supplier_name,
          COALESCE(stock_in.total_in, 0) as total_stock_in,
          COALESCE(stock_out.total_out, 0) as total_stock_out,
          CASE 
            WHEN p.stock_quantity <= p.min_stock_level THEN 'low'
            WHEN p.stock_quantity <= (p.min_stock_level * 1.5) THEN 'medium'
            ELSE 'good'
          END as stock_status
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN (
          SELECT product_id, SUM(quantity) as total_in
          FROM stock_movements 
          WHERE movement_type = 'in' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY product_id
        ) stock_in ON p.id = stock_in.product_id
        LEFT JOIN (
          SELECT product_id, SUM(quantity) as total_out
          FROM stock_movements 
          WHERE movement_type = 'out' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY product_id
        ) stock_out ON p.id = stock_out.product_id`;

      const { query: dataQuery, params: dataParams } = buildQuery(
        dataQueryBase,
        whereConditions,
        `p.${sortBy} ${sortOrder}`,
        "LIMIT ? OFFSET ?"
      );

      // Add pagination parameters
      dataParams.push(limit, offset);

      console.log("Data query:", dataQuery);
      console.log("Data params:", dataParams);

      const products = await executeQuery(dataQuery, dataParams);

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
          supplier: {
            id: product.supplier_id,
            name: product.supplier_name,
          },
          totalStockIn: product.total_stock_in || 0,
          totalStockOut: product.total_stock_out || 0,
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
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },

  // Get single product
  getProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          p.*,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `;

      const result = await executeQuery(query, [id]);

      if (result.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const product = result[0];

      res.json({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        price: parseFloat(product.price),
        cost: parseFloat(product.cost),
        stock: product.stock_quantity,
        minStock: product.min_stock_level,
        supplier: {
          id: product.supplier_id,
          name: product.supplier_name,
          email: product.supplier_email,
          phone: product.supplier_phone,
        },
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  },

  // Create new product
  createProduct: async (req, res) => {
    try {
      const {
        sku,
        name,
        description,
        category,
        price,
        cost,
        stock,
        minStock,
        supplierId,
      } = req.body;

      // Validation
      if (
        !sku ||
        !name ||
        !category ||
        price === undefined ||
        cost === undefined
      ) {
        return res.status(400).json({
          error: "Required fields: sku, name, category, price, cost",
        });
      }

      const query = `
        INSERT INTO products 
        (sku, name, description, category, price, cost, stock_quantity, min_stock_level, supplier_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        sku,
        name,
        description || null,
        category,
        price,
        cost,
        stock || 0,
        minStock || 10,
        supplierId || null,
      ];

      const result = await executeQuery(query, params);

      // Get the created product
      const createdProduct = await executeQuery(
        "SELECT * FROM products WHERE id = ?",
        [result.insertId]
      );

      res.status(201).json({
        id: createdProduct[0].id,
        sku: createdProduct[0].sku,
        name: createdProduct[0].name,
        description: createdProduct[0].description,
        category: createdProduct[0].category,
        price: parseFloat(createdProduct[0].price),
        cost: parseFloat(createdProduct[0].cost),
        stock: createdProduct[0].stock_quantity,
        minStock: createdProduct[0].min_stock_level,
        supplierId: createdProduct[0].supplier_id,
        createdAt: createdProduct[0].created_at,
        updatedAt: createdProduct[0].updated_at,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Product SKU already exists" });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  },

  // Update product
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        sku,
        name,
        description,
        category,
        price,
        cost,
        stock,
        minStock,
        supplierId,
      } = req.body;

      // Check if product exists
      const existingProduct = await executeQuery(
        "SELECT id FROM products WHERE id = ?",
        [id]
      );

      if (existingProduct.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const query = `
        UPDATE products 
        SET sku = ?, name = ?, description = ?, category = ?, price = ?, 
            cost = ?, stock_quantity = ?, min_stock_level = ?, supplier_id = ?
        WHERE id = ?
      `;

      const params = [
        sku,
        name,
        description,
        category,
        price,
        cost,
        stock,
        minStock,
        supplierId,
        id,
      ];

      await executeQuery(query, params);

      // Get updated product
      const updatedProduct = await executeQuery(
        `SELECT p.*, s.name as supplier_name 
         FROM products p 
         LEFT JOIN suppliers s ON p.supplier_id = s.id 
         WHERE p.id = ?`,
        [id]
      );

      res.json({
        id: updatedProduct[0].id,
        sku: updatedProduct[0].sku,
        name: updatedProduct[0].name,
        description: updatedProduct[0].description,
        category: updatedProduct[0].category,
        price: parseFloat(updatedProduct[0].price),
        cost: parseFloat(updatedProduct[0].cost),
        stock: updatedProduct[0].stock_quantity,
        minStock: updatedProduct[0].min_stock_level,
        supplier: {
          id: updatedProduct[0].supplier_id,
          name: updatedProduct[0].supplier_name,
        },
        createdAt: updatedProduct[0].created_at,
        updatedAt: updatedProduct[0].updated_at,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Product SKU already exists" });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await executeQuery(
        "SELECT id FROM products WHERE id = ?",
        [id]
      );

      if (existingProduct.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      await executeQuery("DELETE FROM products WHERE id = ?", [id]);

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  },

  // Get product categories
  getCategories: async (req, res) => {
    try {
      const query = `
        SELECT DISTINCT category, COUNT(*) as product_count 
        FROM products 
        GROUP BY category 
        ORDER BY category
      `;

      const categories = await executeQuery(query);

      res.json({
        categories: categories.map((cat) => ({
          name: cat.category,
          count: cat.product_count,
        })),
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  },

  // Update stock quantity
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

      if (!quantity || !operation) {
        return res.status(400).json({
          error: "Quantity and operation are required",
        });
      }

      // Check if product exists
      const existingProduct = await executeQuery(
        "SELECT stock_quantity FROM products WHERE id = ?",
        [id]
      );

      if (existingProduct.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const currentStock = existingProduct[0].stock_quantity;
      let newStock;

      if (operation === "add") {
        newStock = currentStock + parseInt(quantity);
      } else if (operation === "subtract") {
        newStock = Math.max(0, currentStock - parseInt(quantity));
      } else {
        return res.status(400).json({
          error: "Operation must be 'add' or 'subtract'",
        });
      }

      await executeQuery(
        "UPDATE products SET stock_quantity = ? WHERE id = ?",
        [newStock, id]
      );

      // Record stock movement
      await executeQuery(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
         VALUES (?, ?, ?, ?)`,
        [
          id,
          operation === "add" ? "in" : "out",
          quantity,
          `Manual ${operation} operation`,
        ]
      );

      res.json({
        message: "Stock updated successfully",
        previousStock: currentStock,
        newStock: newStock,
        operation: operation,
        quantity: quantity,
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ error: "Failed to update stock" });
    }
  },
};

module.exports = productsController;
