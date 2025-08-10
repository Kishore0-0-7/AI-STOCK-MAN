const { executeQuery } = require("./config/db");

async function checkBills() {
  try {
    // Check if bills table exists
    const tables = await executeQuery("SHOW TABLES LIKE 'bills'");
    console.log("Bills table exists:", tables.length > 0);

    if (tables.length > 0) {
      const structure = await executeQuery("DESCRIBE bills");
      console.log("Bills table structure:");
      console.table(structure);

      const count = await executeQuery("SELECT COUNT(*) as count FROM bills");
      console.log("Bills count:", count[0].count);
    }

    // Also check related tables
    const billItems = await executeQuery("SHOW TABLES LIKE 'bill_items'");
    console.log("Bill_items table exists:", billItems.length > 0);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkBills();
