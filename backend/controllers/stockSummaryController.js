const { pool } = require("../config/database");

/**
 * Get comprehensive stock summary with analytics
 * Includes product details,    // Execute main query
    console.log("⏳ Executing main stock query...");
    const [stockItems] = await pool.query(stockQuery, finalParams);
    console.log("✅ Query executed successfully. Retrieved", stockItems.length, "items");
    console.log("📊 First item sample:", stockItems[0] ? stockItems[0] : "No items found");

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
    `;
    
    const [countResult] = await pool.query(countQuery, queryParams);ovements, and    console.log("⏳ Executing stats query...");
    const [statsResult] = await pool.query(statsQuery, ["active"]);
    const stats = statsResult[0];
    console.log("📈 Stats retrieved:", stats);rformance metrics
 */
exports.getStockSummary = async (req, res) => {
  try {
    console.log("🔍 Stock Summary API called");
    console.log("📥 Request query params:", req.query);
    
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "all",
      stockFilter = "all",
      sortBy = "name",
      sortOrder = "asc"
    } = req.query;

    console.log("📊 Parsed parameters:", { page, limit, search, category, stockFilter, sortBy, sortOrder });

    const offset = (page - 1) * limit;

    // Build WHERE clause for filtering
    let whereConditions = ["p.status = ?"];
    let queryParams = ["active"];

    // Search filter
    if (search && search.trim() !== "") {
      whereConditions.push(
        "(p.name LIKE ? OR p.sku LIKE ? OR s.name LIKE ?)"
      );
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category && category !== "all") {
      whereConditions.push("p.category = ?");
      queryParams.push(category);
    }

    // Stock status filter
    if (stockFilter && stockFilter !== "all") {
      switch (stockFilter) {
        case "in_stock":
          whereConditions.push("p.current_stock > p.low_stock_threshold");
          break;
        case "low_stock":
          whereConditions.push("p.current_stock > 0 AND p.current_stock <= p.low_stock_threshold");
          break;
        case "out_of_stock":
          whereConditions.push("p.current_stock = 0");
          break;
      }
    }

    // Build ORDER BY clause
    let orderByClause;
    const direction = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";
    
    switch (sortBy) {
      case "stock":
        orderByClause = `p.current_stock ${direction}`;
        break;
      case "value":
        orderByClause = `stock_value ${direction}`;
        break;
      case "turnover":
        orderByClause = `0 ${direction}`; // Simplified for now
        break;
      case "lastMovement":
        orderByClause = `p.updated_at ${direction}`;
        break;
      default:
        orderByClause = `p.name ${direction}`;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    console.log("🔍 WHERE clause:", whereClause);
    console.log("📝 Query parameters before main query:", queryParams);

    // Simplified main query without complex joins
    const stockQuery = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category,
        p.current_stock,
        p.low_stock_threshold as reorder_level,
        p.max_stock_level as max_stock,
        p.unit,
        p.cost as cost_price,
        p.price as selling_price,
        p.location,
        p.created_at,
        p.updated_at,
        COALESCE(s.name, 'Unknown Supplier') as supplier,
        
        -- Calculate stock value
        (p.current_stock * p.cost) as stock_value,
        
        -- Simplified turnover calculation
        0 as stock_turnover,
        
        -- Days since last update (simplified using fixed value for now)
        1 as days_since_last_movement,
        
        -- Last restocked date (use creation date for now)
        p.created_at as last_restocked,
        
        -- Expiry date if applicable
        p.expiry_date
        
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      
      ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    // Add pagination parameters
    const finalParams = [...queryParams, parseInt(limit), parseInt(offset)];

    console.log("🔍 Final SQL Query:", stockQuery);
    console.log("📝 Final parameters:", finalParams);

    // Execute main query
    console.log("⏳ Executing main stock query...");
    const [stockItems] = await pool.query(stockQuery, finalParams);
    console.log("✅ Query executed successfully. Retrieved", stockItems.length, "items");
    console.log("📊 First item sample:", stockItems[0] ? stockItems[0] : "No items found");

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
    `;
    
    console.log("⏳ Executing count query...");
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;
    console.log("📊 Total products found:", total);

    // Get stock statistics (simplified)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN current_stock > low_stock_threshold THEN 1 ELSE 0 END) as in_stock,
        SUM(CASE WHEN current_stock > 0 AND current_stock <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(current_stock * cost) as total_value
      FROM products p
      WHERE p.status = ?
    `;

    console.log("⏳ Executing stats query...");
    const [statsResult] = await pool.query(statsQuery, ["active"]);
    const stats = statsResult[0];
    console.log("📈 Stats retrieved:", stats);

    // Get categories for filtering
    const categoriesQuery = `
      SELECT DISTINCT category 
      FROM products 
      WHERE status = ? AND category IS NOT NULL 
      ORDER BY category
    `;
    console.log("⏳ Executing categories query...");
        const [categoriesResult] = await pool.query(categoriesQuery, ["active"]);
    const categories = categoriesResult.map(row => row.category);
    console.log("🏷️ Categories found:", categories);

    // Format the response
    const formattedItems = stockItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      sku: item.sku,
      currentStock: item.current_stock,
      reorderLevel: item.reorder_level,
      maxStock: item.max_stock,
      unit: item.unit,
      costPrice: parseFloat(item.cost_price),
      sellingPrice: parseFloat(item.selling_price),
      supplier: item.supplier,
      lastRestocked: item.last_restocked,
      expiryDate: item.expiry_date,
      location: item.location,
      stockValue: parseFloat(item.stock_value),
      stockTurnover: parseFloat(item.stock_turnover),
      daysSinceLastMovement: item.days_since_last_movement
    }));

    console.log("🔄 Formatted items count:", formattedItems.length);
    console.log("📦 Sample formatted item:", formattedItems[0] || "No items");

    const responseData = {
      success: true,
      data: {
        items: formattedItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          total: stats.total_products,
          inStock: stats.in_stock,
          lowStock: stats.low_stock,
          outOfStock: stats.out_of_stock,
          totalValue: parseFloat(stats.total_value || 0),
          avgTurnover: 0 // Simplified for now
        },
        categories: categories
      }
    };

    console.log("📤 Sending response with data:", {
      itemsCount: formattedItems.length,
      total: total,
      categories: categories.length,
      stats: responseData.data.stats
    });

    res.json(responseData);

  } catch (error) {
    console.error("❌ Error fetching stock summary:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * Get stock movements for a specific product
 */
exports.getProductMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // For now, return empty movements since the table might not exist
    // Later, when stock_movements table is properly set up, we can use real queries
    const formattedMovements = [];

    res.json({
      success: true,
      data: {
        movements: formattedMovements
      }
    });

  } catch (error) {
    console.error("Error fetching product movements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product movements",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * Get stock movement trends for analytics
 */
exports.getMovementTrends = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Return empty trends for now since stock_movements table might not exist
    const formattedTrends = [];

    res.json({
      success: true,
      data: {
        trends: formattedTrends
      }
    });

  } catch (error) {
    console.error("Error fetching movement trends:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch movement trends",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * Get category-wise stock value distribution
 */
exports.getCategoryDistribution = async (req, res) => {
  try {
    console.log("🔍 Category Distribution API called");
    
    const distributionQuery = `
      SELECT 
        p.category,
        COUNT(*) as product_count,
        SUM(p.current_stock) as total_quantity,
        SUM(p.current_stock * p.cost) as total_value,
        AVG(p.current_stock) as avg_stock_level,
        SUM(CASE WHEN p.current_stock <= p.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_items
      FROM products p
      WHERE p.status = ? AND p.category IS NOT NULL
      GROUP BY p.category
      ORDER BY total_value DESC
    `;

    console.log("⏳ Executing category distribution query...");
        const [distribution] = await pool.query(distributionQuery, ["active"]);
    console.log("📊 Distribution data retrieved:", distribution.length, "categories");

    const formattedDistribution = distribution.map(item => ({
      category: item.category,
      productCount: item.product_count,
      totalQuantity: item.total_quantity,
      totalValue: parseFloat(item.total_value || 0),
      avgStockLevel: parseFloat(item.avg_stock_level || 0),
      lowStockItems: item.low_stock_items
    }));

    console.log("📤 Sending category distribution:", formattedDistribution);

    res.json({
      success: true,
      data: {
        distribution: formattedDistribution
      }
    });

  } catch (error) {
    console.error("❌ Error fetching category distribution:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category distribution",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
