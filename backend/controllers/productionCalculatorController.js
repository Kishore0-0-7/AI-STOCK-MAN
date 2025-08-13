const { pool: db } = require("../config/database");

// Get all raw materials with stock information
const getRawMaterials = async (req, res) => {
  try {
    const query = `
            SELECT 
                rm.id,
                rm.name,
                rm.category,
                rm.current_stock,
                rm.unit,
                rm.cost_per_unit,
                rm.reorder_level,
                rm.supplier_name as supplier,
                rm.last_updated,
                rm.status
            FROM raw_materials rm
            WHERE rm.status = 'active'
            ORDER BY rm.name ASC
        `;

    const [materials] = await db.execute(query);

    // Format the response to match frontend expectations
    const formattedMaterials = materials.map((material) => ({
      id: material.id,
      name: material.name,
      currentStock: parseFloat(material.current_stock) || 0,
      unit: material.unit,
      costPerUnit: parseFloat(material.cost_per_unit) || 0,
      reorderLevel: parseFloat(material.reorder_level) || 0,
      supplier: material.supplier || "Unknown",
      category: material.category,
      lastUpdated: material.last_updated || new Date().toISOString(),
    }));

    res.json({
      success: true,
      data: formattedMaterials,
      count: formattedMaterials.length,
    });
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch raw materials",
      error: error.message,
    });
  }
};

// Get all products with their recipes
const getProducts = async (req, res) => {
  try {
    const query = `
            SELECT 
                p.id,
                p.name,
                p.category,
                p.description,
                pr.id as recipe_id,
                pr.estimated_time_hours,
                pr.complexity,
                pr.batch_size
            FROM products p
            LEFT JOIN product_recipes pr ON p.id = pr.product_id
            WHERE p.status = 'active' AND (pr.status = 'active' OR pr.status IS NULL)
            ORDER BY p.name ASC
        `;

    const [results] = await db.execute(query);

    // Group products with recipes
    const productsMap = new Map();

    results.forEach((row) => {
      if (!productsMap.has(row.id)) {
        productsMap.set(row.id, {
          id: row.id,
          name: row.name,
          category: row.category || "General",
          description: row.description || "",
          estimatedTime: parseFloat(row.estimated_time_hours) || 1,
          complexity: row.complexity
            ? row.complexity.charAt(0).toUpperCase() + row.complexity.slice(1)
            : "Medium",
          materials: [],
        });
      }
    });

    // Get recipe materials for each product
    for (const [productId, product] of productsMap) {
      const materialsQuery = `
                SELECT 
                    rm_recipe.material_id,
                    rm_recipe.material_name,
                    rm_recipe.required_quantity,
                    rm_recipe.unit,
                    rm_recipe.wastage_percent
                FROM recipe_materials rm_recipe
                JOIN product_recipes pr ON rm_recipe.recipe_id = pr.id
                WHERE pr.product_id = ? AND pr.status = 'active'
                ORDER BY rm_recipe.material_name ASC
            `;

      const [materials] = await db.execute(materialsQuery, [productId]);

      product.materials = materials.map((material) => ({
        materialId: material.material_id,
        materialName: material.material_name,
        requiredQuantity: parseFloat(material.required_quantity) || 0,
        unit: material.unit,
        wastagePercent: parseFloat(material.wastage_percent) || 0,
      }));
    }

    const products = Array.from(productsMap.values());

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Calculate production feasibility
const calculateProduction = async (req, res) => {
  try {
    const { productId, requestedQuantity } = req.body;

    if (!productId || !requestedQuantity || requestedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required",
      });
    }

    // Get product details
    const productQuery = `
            SELECT 
                p.id,
                p.name,
                p.category,
                pr.estimated_time_hours,
                pr.complexity
            FROM products p
            LEFT JOIN product_recipes pr ON p.id = pr.product_id
            WHERE p.id = ? AND p.status = 'active' AND (pr.status = 'active' OR pr.status IS NULL)
            LIMIT 1
        `;

    const [productResult] = await db.execute(productQuery, [productId]);

    if (productResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    const product = productResult[0];

    // Get recipe materials
    const materialsQuery = `
            SELECT 
                rm_recipe.material_id,
                rm_recipe.material_name,
                rm_recipe.required_quantity,
                rm_recipe.unit,
                rm_recipe.wastage_percent,
                rm.current_stock,
                rm.cost_per_unit
            FROM recipe_materials rm_recipe
            JOIN product_recipes pr ON rm_recipe.recipe_id = pr.id
            JOIN raw_materials rm ON rm_recipe.material_id = rm.id
            WHERE pr.product_id = ? AND pr.status = 'active' AND rm.status = 'active'
            ORDER BY rm_recipe.material_name ASC
        `;

    const [materials] = await db.execute(materialsQuery, [productId]);

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No recipe found for this product",
      });
    }

    // Calculate feasibility
    const materialBreakdown = [];
    const bottlenecks = [];
    let totalCost = 0;
    let possibleQuantity = requestedQuantity;

    for (const material of materials) {
      const requiredWithWastage =
        material.required_quantity * (1 + material.wastage_percent / 100);
      const totalRequired = requiredWithWastage * requestedQuantity;
      const currentStock = parseFloat(material.current_stock) || 0;
      const shortage = Math.max(0, totalRequired - currentStock);
      const availableForProduction =
        currentStock > 0 ? Math.floor(currentStock / requiredWithWastage) : 0;

      if (availableForProduction < requestedQuantity) {
        possibleQuantity = Math.min(possibleQuantity, availableForProduction);
        bottlenecks.push(
          `${material.material_name} (Available: ${currentStock} ${
            material.unit
          }, Required: ${totalRequired.toFixed(2)} ${material.unit})`
        );
      }

      const costForPossible =
        requiredWithWastage *
        possibleQuantity *
        (parseFloat(material.cost_per_unit) || 0);
      totalCost += costForPossible;

      materialBreakdown.push({
        materialId: material.material_id,
        materialName: material.material_name,
        required: totalRequired,
        available: currentStock,
        shortage: shortage,
        cost: costForPossible,
        unit: material.unit,
      });
    }

    const calculation = {
      productId: product.id,
      productName: product.name,
      requestedQuantity: parseInt(requestedQuantity),
      possibleQuantity: Math.max(0, possibleQuantity),
      totalCost: totalCost,
      estimatedTime:
        (parseFloat(product.estimated_time_hours) || 1) * possibleQuantity,
      materialBreakdown: materialBreakdown,
      feasible: possibleQuantity === requestedQuantity,
      bottlenecks: bottlenecks,
    };

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    console.error("Error calculating production:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate production",
      error: error.message,
    });
  }
};

// Get production batches
const getProductionBatches = async (req, res) => {
  try {
    const query = `
            SELECT 
                pb.id,
                pb.batch_number,
                p.name as product_name,
                pb.planned_quantity as quantity,
                pb.status,
                pb.start_date,
                pb.estimated_completion_date,
                pb.actual_completion_date,
                pb.progress_percentage as progress,
                pb.total_cost,
                pb.created_at
            FROM production_batches pb
            JOIN products p ON pb.product_id = p.id
            ORDER BY pb.created_at DESC
            LIMIT 20
        `;

    const [batches] = await db.execute(query);

    // Get materials for each batch
    const batchesWithMaterials = await Promise.all(
      batches.map(async (batch) => {
        const materialsQuery = `
                    SELECT 
                        rm_recipe.material_id,
                        rm_recipe.material_name,
                        rm_recipe.required_quantity * ? as required,
                        rm.current_stock as available,
                        GREATEST(0, (rm_recipe.required_quantity * ?) - rm.current_stock) as shortage,
                        (rm_recipe.required_quantity * ? * rm.cost_per_unit) as cost,
                        rm_recipe.unit
                    FROM recipe_materials rm_recipe
                    JOIN product_recipes pr ON rm_recipe.recipe_id = pr.id
                    JOIN production_batches pb ON pr.product_id = pb.product_id
                    JOIN raw_materials rm ON rm_recipe.material_id = rm.id
                    WHERE pb.id = ?
                `;

        const [materials] = await db.execute(materialsQuery, [
          batch.quantity,
          batch.quantity,
          batch.quantity,
          batch.id,
        ]);

        return {
          id: batch.id,
          productName: batch.product_name,
          quantity: batch.quantity,
          status: batch.status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          startDate: batch.start_date
            ? batch.start_date.toISOString().split("T")[0]
            : "",
          estimatedCompletion: batch.estimated_completion_date
            ? batch.estimated_completion_date.toISOString().split("T")[0]
            : "",
          progress: parseFloat(batch.progress_percentage) || 0,
          materials: materials.map((material) => ({
            materialId: material.material_id,
            materialName: material.material_name,
            required: parseFloat(material.required) || 0,
            available: parseFloat(material.available) || 0,
            shortage: parseFloat(material.shortage) || 0,
            cost: parseFloat(material.cost) || 0,
            unit: material.unit,
          })),
        };
      })
    );

    res.json({
      success: true,
      data: batchesWithMaterials,
      count: batchesWithMaterials.length,
    });
  } catch (error) {
    console.error("Error fetching production batches:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch production batches",
      error: error.message,
    });
  }
};

// Get inventory analytics for charts
const getInventoryAnalytics = async (req, res) => {
  try {
    // Stock levels analysis
    const stockAnalysisQuery = `
            SELECT 
                name,
                current_stock,
                reorder_level,
                cost_per_unit,
                category
            FROM raw_materials
            WHERE status = 'active'
            ORDER BY name ASC
        `;

    const [stockAnalysis] = await db.execute(stockAnalysisQuery);

    // Category distribution
    const categoryQuery = `
            SELECT 
                category,
                SUM(current_stock * cost_per_unit) as total_value,
                COUNT(*) as item_count,
                AVG(current_stock) as avg_stock
            FROM raw_materials
            WHERE status = 'active'
            GROUP BY category
            ORDER BY total_value DESC
        `;

    const [categoryData] = await db.execute(categoryQuery);

    // Summary statistics
    const summaryQuery = `
            SELECT 
                SUM(current_stock * cost_per_unit) as total_inventory_value,
                COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_count,
                COUNT(CASE WHEN current_stock > reorder_level * 2 THEN 1 END) as well_stocked_count,
                COUNT(*) as total_materials,
                SUM(GREATEST(0, reorder_level - current_stock) * cost_per_unit) as restock_investment
            FROM raw_materials
            WHERE status = 'active'
        `;

    const [summaryData] = await db.execute(summaryQuery);

    const analytics = {
      stockAnalysis: stockAnalysis.map((item) => ({
        name: item.name.split(" ")[0], // First word for chart readability
        current: parseFloat(item.current_stock) || 0,
        reorder: parseFloat(item.reorder_level) || 0,
        cost: parseFloat(item.cost_per_unit) || 0,
        category: item.category,
      })),
      categoryDistribution: categoryData.map((item) => ({
        name: item.category,
        value: parseFloat(item.total_value) || 0,
        itemCount: item.item_count,
        avgStock: parseFloat(item.avg_stock) || 0,
      })),
      summary: {
        totalInventoryValue:
          parseFloat(summaryData[0].total_inventory_value) || 0,
        lowStockCount: summaryData[0].low_stock_count || 0,
        wellStockedCount: summaryData[0].well_stocked_count || 0,
        totalMaterials: summaryData[0].total_materials || 0,
        restockInvestment: parseFloat(summaryData[0].restock_investment) || 0,
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching inventory analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory analytics",
      error: error.message,
    });
  }
};

// Create a new production batch
const createProductionBatch = async (req, res) => {
  try {
    const { productId, quantity, startDate, estimatedCompletionDate, notes } =
      req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required",
      });
    }

    // Generate batch number
    const batchNumber = `BATCH-${Date.now()}`;

    // Get recipe ID
    const recipeQuery = `
            SELECT id FROM product_recipes 
            WHERE product_id = ? AND status = 'active' 
            LIMIT 1
        `;
    const [recipeResult] = await db.execute(recipeQuery, [productId]);

    if (recipeResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active recipe found for this product",
      });
    }

    const recipeId = recipeResult[0].id;

    // Insert production batch
    const insertQuery = `
            INSERT INTO production_batches 
            (batch_number, product_id, recipe_id, planned_quantity, status, 
             start_date, estimated_completion_date, notes, created_by)
            VALUES (?, ?, ?, ?, 'planned', ?, ?, ?, 'system')
        `;

    const [result] = await db.execute(insertQuery, [
      batchNumber,
      productId,
      recipeId,
      quantity,
      startDate || new Date().toISOString().split("T")[0],
      estimatedCompletionDate,
      notes || "",
    ]);

    res.json({
      success: true,
      message: "Production batch created successfully",
      data: {
        id: result.insertId,
        batchNumber: batchNumber,
        status: "planned",
      },
    });
  } catch (error) {
    console.error("Error creating production batch:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create production batch",
      error: error.message,
    });
  }
};

module.exports = {
  getRawMaterials,
  getProducts,
  calculateProduction,
  getProductionBatches,
  getInventoryAnalytics,
  createProductionBatch,
};
