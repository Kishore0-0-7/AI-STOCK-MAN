const { executeQuery } = require("./config/db");

async function checkLowStock() {
  try {
    const result = await executeQuery(`
      SELECT name, sku, stock_quantity, min_stock_level,
             (stock_quantity <= min_stock_level) as is_low_stock
      FROM products 
      ORDER BY stock_quantity ASC 
      LIMIT 5
    `);

    console.log("Products with lowest stock:");
    console.table(result);

    const lowStockCount = await executeQuery(`
      SELECT COUNT(*) as low_stock_count 
      FROM products 
      WHERE stock_quantity <= min_stock_level
    `);

    console.log("Low stock products count:", lowStockCount[0].low_stock_count);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkLowStock();
