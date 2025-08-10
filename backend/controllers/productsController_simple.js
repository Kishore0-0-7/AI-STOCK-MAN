const { executeQuery } = require("../config/database_robust");

const productsController = {
  // Get all products - simplified
  getAllProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Simple count query without parameters
      const countQuery = "SELECT COUNT(*) as total FROM products";
      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      // Simple data query - avoid complex joins
      const dataQuery = `
        SELECT p.*, s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const products = await executeQuery(dataQuery);

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
          supplier: {
            id: product.supplier_id,
            name: product.supplier_name,
          },
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
        SELECT p.*, s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ${mysql.escape(id)}
      `;

      const result = await executeQuery(query);

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

      const mysql = require("mysql2");

      const query = `
        INSERT INTO products 
        (sku, name, description, category, price, cost, stock_quantity, min_stock_level, supplier_id)
        VALUES (
          ${mysql.escape(sku)},
          ${mysql.escape(name)},
          ${mysql.escape(description || null)},
          ${mysql.escape(category)},
          ${mysql.escape(price)},
          ${mysql.escape(cost)},
          ${mysql.escape(stock || 0)},
          ${mysql.escape(minStock || 10)},
          ${mysql.escape(supplierId || null)}
        )
      `;

      const result = await executeQuery(query);

      // Get the created product
      const createdProduct = await executeQuery(
        `SELECT * FROM products WHERE id = ${result.insertId}`
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
};

module.exports = productsController;
