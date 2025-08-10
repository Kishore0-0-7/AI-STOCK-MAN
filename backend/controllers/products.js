const { executeQuery } = require("../config/db");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");

const productsController = {
  // Get all products with pagination and filtering
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = (page - 1) * limit;
      const search = req.query.search || "";
      const category = req.query.category || "";
      const lowStock = req.query.lowStock === "true";

      let whereClause = "WHERE 1=1";
      let params = [];

      if (search) {
        whereClause +=
          " AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (category) {
        whereClause += " AND p.category = ?";
        params.push(category);
      }

      if (lowStock) {
        whereClause += " AND p.stock_quantity <= p.min_stock_level";
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get products with supplier info
      const dataQuery = `
        SELECT 
          p.*,
          s.name as supplier_name,
          s.email as supplier_email
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ${whereClause}
        ORDER BY p.name ASC
        LIMIT ? OFFSET ?
      `;

      const products = await executeQuery(dataQuery, [
        ...params,
        limit,
        offset,
      ]);

      res.json({
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
          supplier: {
            id: product.supplier_id,
            name: product.supplier_name,
            email: product.supplier_email,
          },
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
      console.error("Error fetching products:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch products", details: error.message });
    }
  },

  // Get single product
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          p.*,
          s.name as supplier_name,
          s.contact_email as supplier_email,
          s.contact_phone as supplier_phone
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
        price: parseFloat(product.price || 0),
        cost: parseFloat(product.cost || 0),
        stock: product.stock_quantity,
        minStock: product.min_stock_level,
        supplier: {
          id: product.supplier_id,
          name: product.supplier_name,
          email: product.supplier_email,
          phone: product.supplier_phone,
        },
        status:
          product.stock_quantity <= product.min_stock_level
            ? "low_stock"
            : "in_stock",
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  },

  // Create new product
  create: async (req, res) => {
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

      // Validate required fields
      if (!name || !sku || !price || stock == null || minStock == null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if SKU already exists
      const existingProduct = await executeQuery(
        "SELECT id FROM products WHERE sku = ?",
        [sku]
      );
      if (existingProduct.length > 0) {
        return res.status(400).json({ error: "SKU already exists" });
      }

      const query = `
        INSERT INTO products (
          sku, name, description, category, price, cost, 
          stock_quantity, min_stock_level, supplier_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [
        sku,
        name,
        description,
        category,
        parseFloat(price),
        parseFloat(cost || 0),
        parseInt(stock),
        parseInt(minStock),
        supplierId || null,
      ]);

      // Fetch the created product
      const createdProduct = await executeQuery(
        `
        SELECT p.*, s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `,
        [result.insertId]
      );

      res.status(201).json({
        message: "Product created successfully",
        product: {
          id: createdProduct[0].id,
          sku: createdProduct[0].sku,
          name: createdProduct[0].name,
          description: createdProduct[0].description,
          category: createdProduct[0].category,
          price: parseFloat(createdProduct[0].price),
          cost: parseFloat(createdProduct[0].cost),
          stock: createdProduct[0].stock_quantity,
          minStock: createdProduct[0].min_stock_level,
          supplier: {
            id: createdProduct[0].supplier_id,
            name: createdProduct[0].supplier_name,
          },
          createdAt: createdProduct[0].created_at,
        },
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  },

  // Update product
  update: async (req, res) => {
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

      // Check if SKU conflicts with another product
      if (sku) {
        const skuConflict = await executeQuery(
          "SELECT id FROM products WHERE sku = ? AND id != ?",
          [sku, id]
        );
        if (skuConflict.length > 0) {
          return res
            .status(400)
            .json({ error: "SKU already exists for another product" });
        }
      }

      const query = `
        UPDATE products SET
          sku = COALESCE(?, sku),
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          price = COALESCE(?, price),
          cost = COALESCE(?, cost),
          stock_quantity = COALESCE(?, stock_quantity),
          min_stock_level = COALESCE(?, min_stock_level),
          supplier_id = COALESCE(?, supplier_id),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await executeQuery(query, [
        sku,
        name,
        description,
        category,
        price ? parseFloat(price) : null,
        cost ? parseFloat(cost) : null,
        stock != null ? parseInt(stock) : null,
        minStock != null ? parseInt(minStock) : null,
        supplierId,
        id,
      ]);

      // Fetch updated product
      const updatedProduct = await executeQuery(
        `
        SELECT p.*, s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `,
        [id]
      );

      res.json({
        message: "Product updated successfully",
        product: {
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
          updatedAt: updatedProduct[0].updated_at,
        },
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  },

  // Delete product
  delete: async (req, res) => {
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
      const categories = await executeQuery(`
        SELECT DISTINCT category, COUNT(*) as count
        FROM products 
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY category ASC
      `);

      res.json(
        categories.map((cat) => ({
          name: cat.category,
          count: cat.count,
        }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  },

  // Update stock quantity
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

      if (!quantity || !operation) {
        return res
          .status(400)
          .json({ error: "Quantity and operation are required" });
      }

      let query;
      let params;

      switch (operation) {
        case "add":
          query =
            "UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
          params = [parseInt(quantity), id];
          break;
        case "subtract":
          query =
            "UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?";
          params = [parseInt(quantity), id];
          break;
        case "set":
          query =
            "UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
          params = [parseInt(quantity), id];
          break;
        default:
          return res
            .status(400)
            .json({
              error: "Invalid operation. Use 'add', 'subtract', or 'set'",
            });
      }

      const result = await executeQuery(query, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Get updated product
      const updatedProduct = await executeQuery(
        "SELECT stock_quantity FROM products WHERE id = ?",
        [id]
      );

      res.json({
        message: "Stock updated successfully",
        newStock: updatedProduct[0].stock_quantity,
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ error: "Failed to update stock" });
    }
  },

  // Bulk create products for import functionality
  bulkCreate: async (req, res) => {
    try {
      const { products } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "Products array is required" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const productData of products) {
        try {
          const {
            sku,
            name,
            category,
            price,
            cost,
            stock,
            minStock,
            supplierId,
          } = productData;

          // Validate required fields
          if (!name || !category || price == null) {
            results.failed++;
            results.errors.push({
              product: name || "Unknown",
              error: "Missing required fields (name, category, price)",
            });
            continue;
          }

          // Generate SKU if not provided
          const productSku =
            sku ||
            `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          // Check if SKU already exists
          const existingProduct = await executeQuery(
            "SELECT id FROM products WHERE sku = ?",
            [productSku]
          );
          if (existingProduct.length > 0) {
            results.failed++;
            results.errors.push({
              product: name,
              error: `SKU ${productSku} already exists`,
            });
            continue;
          }

          const query = `
            INSERT INTO products (
              sku, name, description, category, price, cost, 
              stock_quantity, min_stock_level, supplier_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          await executeQuery(query, [
            productSku,
            name,
            `${name} - ${category}`,
            category,
            parseFloat(price),
            parseFloat(cost || price * 0.7), // 30% margin if cost not provided
            parseInt(stock || 0),
            parseInt(minStock || 10),
            supplierId || null,
          ]);

          results.success++;
        } catch (error) {
          console.error(`Error creating product ${productData.name}:`, error);
          results.failed++;
          results.errors.push({
            product: productData.name || "Unknown",
            error: error.message,
          });
        }
      }

      res.json({
        message: `Bulk import completed. ${results.success} products created, ${results.failed} failed.`,
        results,
      });
    } catch (error) {
      console.error("Error in bulk create:", error);
      res.status(500).json({ error: "Failed to bulk create products" });
    }
  },
};

module.exports = productsController;
