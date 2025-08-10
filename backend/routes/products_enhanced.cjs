const express = require("express");
const router = express.Router();
const db = require("../config/db.cjs");

// Get all products with stock information
router.get("/", (req, res) => {
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
    whereClause += " AND (p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)";
    queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`;

  const dataQuery = `
    SELECT 
      p.*,
      s.name as supplier_name,
      COALESCE(stock_in.total_in, 0) as total_stock_in,
      COALESCE(stock_out.total_out, 0) as total_stock_out,
      COALESCE(recent_orders.order_count, 0) as recent_order_count,
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
    LEFT JOIN (
      SELECT poi.product_id, COUNT(*) as order_count
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchase_order_id = po.id
      WHERE po.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY poi.product_id
    ) recent_orders ON p.id = recent_orders.product_id
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  // Get total count
  db.query(countQuery, queryParams, (err, countResult) => {
    if (err) {
      console.error("Error counting products:", err);
      return res.status(500).json({ error: "Failed to count products" });
    }

    const total = countResult[0].total;

    // Get products data
    db.query(dataQuery, [...queryParams, limit, offset], (err, results) => {
      if (err) {
        console.error("Error fetching products:", err);
        return res.status(500).json({ error: "Failed to fetch products" });
      }

      res.json({
        products: results.map((product) => ({
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
          recentOrderCount: product.recent_order_count || 0,
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
    });
  });
});

// Get product by ID with detailed information
router.get("/:id", (req, res) => {
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

  // Get stock movements for the product
  const movementsQuery = `
    SELECT * FROM stock_movements 
    WHERE product_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `;

  // Get recent purchase orders for this product
  const ordersQuery = `
    SELECT 
      po.id as order_id,
      po.order_number,
      po.status as order_status,
      po.order_date,
      poi.quantity,
      poi.unit_price,
      poi.total_price
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.product_id = ?
    ORDER BY po.created_at DESC
    LIMIT 10
  `;

  db.query(productQuery, [productId], (err, productResult) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).json({ error: "Failed to fetch product" });
    }

    if (productResult.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = productResult[0];

    // Get stock movements
    db.query(movementsQuery, [productId], (err, movementsResult) => {
      if (err) {
        console.error("Error fetching stock movements:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch stock movements" });
      }

      // Get purchase orders
      db.query(ordersQuery, [productId], (err, ordersResult) => {
        if (err) {
          console.error("Error fetching purchase orders:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch purchase orders" });
        }

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
          stockMovements: movementsResult.map((movement) => ({
            id: movement.id,
            type: movement.movement_type,
            quantity: movement.quantity,
            reference: movement.reference_number,
            notes: movement.notes,
            createdAt: movement.created_at,
          })),
          recentOrders: ordersResult.map((order) => ({
            id: order.order_id,
            orderNumber: order.order_number,
            status: order.order_status,
            date: order.order_date,
            quantity: order.quantity,
            unitPrice: parseFloat(order.unit_price),
            totalPrice: parseFloat(order.total_price),
          })),
          createdAt: product.created_at,
          updatedAt: product.updated_at,
        });
      });
    });
  });
});

// Create new product
router.post("/", (req, res) => {
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
  const checkSkuQuery = `SELECT id FROM products WHERE sku = ?`;
  db.query(checkSkuQuery, [sku], (err, results) => {
    if (err) {
      console.error("Error checking SKU:", err);
      return res.status(500).json({ error: "Failed to create product" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "SKU already exists" });
    }

    const insertQuery = `
      INSERT INTO products (
        sku, name, description, category, price, cost,
        stock_quantity, min_stock_level, supplier_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        sku,
        name,
        description,
        category,
        price,
        cost,
        stock,
        minStock || 10,
        supplierId,
      ],
      (err, result) => {
        if (err) {
          console.error("Error creating product:", err);
          return res.status(500).json({ error: "Failed to create product" });
        }

        // Create initial stock movement if stock > 0
        if (stock > 0) {
          const stockMovementQuery = `
          INSERT INTO stock_movements (
            product_id, movement_type, quantity, reference_number, notes
          ) VALUES (?, 'in', ?, ?, ?)
        `;

          db.query(stockMovementQuery, [
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
      }
    );
  });
});

// Update product
router.put("/:id", (req, res) => {
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

  if (!sku || !name || !category || price === undefined || cost === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check if SKU exists for other products
  const checkSkuQuery = `SELECT id FROM products WHERE sku = ? AND id != ?`;
  db.query(checkSkuQuery, [sku, productId], (err, results) => {
    if (err) {
      console.error("Error checking SKU:", err);
      return res.status(500).json({ error: "Failed to update product" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "SKU already exists" });
    }

    // Get current stock to track changes
    const getCurrentStockQuery = `SELECT stock_quantity FROM products WHERE id = ?`;
    db.query(getCurrentStockQuery, [productId], (err, currentResult) => {
      if (err) {
        console.error("Error getting current stock:", err);
        return res.status(500).json({ error: "Failed to update product" });
      }

      if (currentResult.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const currentStock = currentResult[0].stock_quantity;

      const updateQuery = `
        UPDATE products SET
          sku = ?, name = ?, description = ?, category = ?, 
          price = ?, cost = ?, stock_quantity = ?, min_stock_level = ?, 
          supplier_id = ?, updated_at = NOW()
        WHERE id = ?
      `;

      db.query(
        updateQuery,
        [
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
        ],
        (err, result) => {
          if (err) {
            console.error("Error updating product:", err);
            return res.status(500).json({ error: "Failed to update product" });
          }

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

            db.query(stockMovementQuery, [
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
        }
      );
    });
  });
});

// Delete product
router.delete("/:id", (req, res) => {
  const productId = req.params.id;

  const query = `DELETE FROM products WHERE id = ?`;

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({ error: "Failed to delete product" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  });
});

// Add stock movement
router.post("/:id/stock-movement", (req, res) => {
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
  const getCurrentStockQuery = `SELECT stock_quantity FROM products WHERE id = ?`;
  db.query(getCurrentStockQuery, [productId], (err, result) => {
    if (err) {
      console.error("Error getting current stock:", err);
      return res
        .status(500)
        .json({ error: "Failed to process stock movement" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const currentStock = result[0].stock_quantity;
    const newStock =
      type === "in" ? currentStock + quantity : currentStock - quantity;

    if (newStock < 0) {
      return res
        .status(400)
        .json({ error: "Insufficient stock for outward movement" });
    }

    // Start transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.status(500).json({ error: "Database transaction failed" });
      }

      // Insert stock movement
      const insertMovementQuery = `
        INSERT INTO stock_movements (
          product_id, movement_type, quantity, reference_number, notes
        ) VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertMovementQuery,
        [productId, type, quantity, reference || "", notes || ""],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error inserting stock movement:", err);
              res
                .status(500)
                .json({ error: "Failed to record stock movement" });
            });
          }

          // Update product stock
          const updateStockQuery = `UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE id = ?`;
          db.query(updateStockQuery, [newStock, productId], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error updating product stock:", err);
                res
                  .status(500)
                  .json({ error: "Failed to update product stock" });
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error("Error committing transaction:", err);
                  res
                    .status(500)
                    .json({ error: "Failed to process stock movement" });
                });
              }

              res.json({
                success: true,
                message: "Stock movement recorded successfully",
                newStock: newStock,
              });
            });
          });
        }
      );
    });
  });
});

// Get stock summary statistics
router.get("/stats/summary", (req, res) => {
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

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching product stats:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch product statistics" });
    }

    const stats = results[0];
    res.json({
      totalProducts: stats.total_products || 0,
      totalInventoryValue: parseFloat(stats.total_inventory_value) || 0,
      lowStockProducts: stats.low_stock_products || 0,
      outOfStockProducts: stats.out_of_stock_products || 0,
      avgStockLevel: parseFloat(stats.avg_stock_level) || 0,
      totalCategories: stats.total_categories || 0,
    });
  });
});

// Get category-wise stock summary
router.get("/stats/by-category", (req, res) => {
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

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching category stats:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch category statistics" });
    }

    res.json(
      results.map((row) => ({
        category: row.category,
        productCount: row.product_count,
        totalStock: row.total_stock,
        inventoryValue: parseFloat(row.inventory_value),
        lowStockCount: row.low_stock_count,
      }))
    );
  });
});

// Get low stock products
router.get("/low-stock", (req, res) => {
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

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching low stock products:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch low stock products" });
    }

    res.json(
      results.map((product) => ({
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
  });
});

module.exports = router;
