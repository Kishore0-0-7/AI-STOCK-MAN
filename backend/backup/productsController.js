const { executeQuery } = require("../config/database");

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

      let whereClause = "1=1";
      let queryParams = [];

      if (category && category !== "all") {
        whereClause += " AND p.category = ?";
        queryParams.push(category);
      }

      if (search) {
        whereClause +=
          " AND (p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`;
      const [countResult] = await executeQuery(countQuery, queryParams);
      const total = countResult.total;

      // Data query
      const dataQuery = `
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
        ) stock_out ON p.id = stock_out.product_id
        WHERE ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      const products = await executeQuery(dataQuery, [
        ...queryParams,
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

  // Get product by ID with detailed information
  getProductById: async (req, res) => {
    try {
      const productId = req.params.id;

      const productQuery = `
        SELECT 
          p.*,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `;

      const [product] = await executeQuery(productQuery, [productId]);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Get stock movements
      const movementsQuery = `
        SELECT * FROM stock_movements 
        WHERE product_id = ? 
        ORDER BY created_at DESC 
        LIMIT 20
      `;

      const movements = await executeQuery(movementsQuery, [productId]);

      const stockStatus =
        product.stock_quantity <= product.min_stock_level
          ? "low"
          : product.stock_quantity <= product.min_stock_level * 1.5
          ? "medium"
          : "good";

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
        stockStatus: stockStatus,
        supplier: {
          id: product.supplier_id,
          name: product.supplier_name,
          email: product.supplier_email,
          phone: product.supplier_phone,
        },
        stockMovements: movements.map((movement) => ({
          id: movement.id,
          type: movement.movement_type,
          quantity: movement.quantity,
          reference: movement.reference_number,
          notes: movement.notes,
          createdAt: movement.created_at,
        })),
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

      if (
        !sku ||
        !name ||
        !category ||
        price === undefined ||
        cost === undefined ||
        stock === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if SKU already exists
      const [existingSku] = await executeQuery(
        "SELECT id FROM products WHERE sku = ?",
        [sku]
      );
      if (existingSku) {
        return res.status(400).json({ error: "SKU already exists" });
      }

      const insertQuery = `
        INSERT INTO products (
          sku, name, description, category, price, cost,
          stock_quantity, min_stock_level, supplier_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(insertQuery, [
        sku,
        name,
        description,
        category,
        price,
        cost,
        stock,
        minStock || 10,
        supplierId,
      ]);

      // Create initial stock movement if stock > 0
      if (stock > 0) {
        const stockMovementQuery = `
          INSERT INTO stock_movements (
            product_id, movement_type, quantity, reference_number, notes
          ) VALUES (?, 'in', ?, ?, ?)
        `;

        await executeQuery(stockMovementQuery, [
          result.insertId,
          stock,
          "INITIAL_STOCK",
          "Initial stock entry",
        ]);
      }

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        productId: result.insertId,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  },

  // Update product
  updateProduct: async (req, res) => {
    try {
      const productId = req.params.id;
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

      if (
        !sku ||
        !name ||
        !category ||
        price === undefined ||
        cost === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if SKU exists for other products
      const [existingSku] = await executeQuery(
        "SELECT id FROM products WHERE sku = ? AND id != ?",
        [sku, productId]
      );
      if (existingSku) {
        return res.status(400).json({ error: "SKU already exists" });
      }

      // Get current stock to track changes
      const [currentProduct] = await executeQuery(
        "SELECT stock_quantity FROM products WHERE id = ?",
        [productId]
      );
      if (!currentProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      const currentStock = currentProduct.stock_quantity;

      const updateQuery = `
        UPDATE products SET
          sku = ?, name = ?, description = ?, category = ?, 
          price = ?, cost = ?, stock_quantity = ?, min_stock_level = ?, 
          supplier_id = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await executeQuery(updateQuery, [
        sku,
        name,
        description,
        category,
        price,
        cost,
        stock,
        minStock || 10,
        supplierId,
        productId,
      ]);

      // Create stock movement if stock changed
      if (stock !== currentStock) {
        const difference = stock - currentStock;
        const movementType = difference > 0 ? "in" : "out";
        const quantity = Math.abs(difference);

        const stockMovementQuery = `
          INSERT INTO stock_movements (
            product_id, movement_type, quantity, reference_number, notes
          ) VALUES (?, ?, ?, ?, ?)
        `;

        await executeQuery(stockMovementQuery, [
          productId,
          movementType,
          quantity,
          "MANUAL_ADJUSTMENT",
          `Stock adjusted from ${currentStock} to ${stock}`,
        ]);
      }

      res.json({
        success: true,
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      const productId = req.params.id;

      const result = await executeQuery("DELETE FROM products WHERE id = ?", [
        productId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  },

  // Add stock movement
  addStockMovement: async (req, res) => {
    try {
      const productId = req.params.id;
      const { type, quantity, reference, notes } = req.body;

      if (!type || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Invalid movement data" });
      }

      if (!["in", "out"].includes(type)) {
        return res
          .status(400)
          .json({ error: 'Movement type must be "in" or "out"' });
      }

      // Get current stock
      const [product] = await executeQuery(
        "SELECT stock_quantity FROM products WHERE id = ?",
        [productId]
      );
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const currentStock = product.stock_quantity;
      const newStock =
        type === "in" ? currentStock + quantity : currentStock - quantity;

      if (newStock < 0) {
        return res
          .status(400)
          .json({ error: "Insufficient stock for outward movement" });
      }

      // Insert stock movement
      const insertMovementQuery = `
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, reference_number, notes
        ) VALUES (?, ?, ?, ?, ?)
      `;

      await executeQuery(insertMovementQuery, [
        productId,
        type,
        quantity,
        reference || "",
        notes || "",
      ]);

      // Update product stock
      await executeQuery(
        "UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE id = ?",
        [newStock, productId]
      );

      res.json({
        success: true,
        message: "Stock movement recorded successfully",
        newStock: newStock,
      });
    } catch (error) {
      console.error("Error adding stock movement:", error);
      res.status(500).json({ error: "Failed to record stock movement" });
    }
  },

  // Get product statistics
  getProductStats: async (req, res) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_products,
          SUM(stock_quantity * cost) as total_inventory_value,
          COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_products,
          COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_products,
          AVG(stock_quantity) as avg_stock_level,
          COUNT(DISTINCT category) as total_categories
        FROM products
      `;

      const [stats] = await executeQuery(query);

      res.json({
        totalProducts: stats.total_products || 0,
        totalInventoryValue: parseFloat(stats.total_inventory_value) || 0,
        lowStockProducts: stats.low_stock_products || 0,
        outOfStockProducts: stats.out_of_stock_products || 0,
        avgStockLevel: parseFloat(stats.avg_stock_level) || 0,
        totalCategories: stats.total_categories || 0,
      });
    } catch (error) {
      console.error("Error fetching product stats:", error);
      res.status(500).json({ error: "Failed to fetch product statistics" });
    }
  },

  // Get category-wise statistics
  getCategoryStats: async (req, res) => {
    try {
      const query = `
        SELECT 
          category,
          COUNT(*) as product_count,
          SUM(stock_quantity) as total_stock,
          SUM(stock_quantity * cost) as inventory_value,
          COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_count
        FROM products
        GROUP BY category
        ORDER BY inventory_value DESC
      `;

      const categories = await executeQuery(query);

      res.json(
        categories.map((row) => ({
          category: row.category,
          productCount: row.product_count,
          totalStock: row.total_stock,
          inventoryValue: parseFloat(row.inventory_value),
          lowStockCount: row.low_stock_count,
        }))
      );
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ error: "Failed to fetch category statistics" });
    }
  },

  // Get low stock products
  getLowStockProducts: async (req, res) => {
    try {
      const query = `
        SELECT 
          p.*,
          s.name as supplier_name,
          CASE 
            WHEN p.stock_quantity = 0 THEN 'out_of_stock'
            WHEN p.stock_quantity <= p.min_stock_level THEN 'critical'
            WHEN p.stock_quantity <= (p.min_stock_level * 1.5) THEN 'low'
            ELSE 'good'
          END as stock_status
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.stock_quantity <= (p.min_stock_level * 1.5)
        ORDER BY p.stock_quantity ASC, p.min_stock_level DESC
      `;

      const products = await executeQuery(query);

      res.json(
        products.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          currentStock: product.stock_quantity,
          minStock: product.min_stock_level,
          stockStatus: product.stock_status,
          supplier: {
            id: product.supplier_id,
            name: product.supplier_name,
          },
        }))
      );
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  },
};

module.exports = productsController;
