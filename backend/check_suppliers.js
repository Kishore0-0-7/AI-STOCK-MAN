const { executeQuery } = require("./config/db");

async function checkSuppliers() {
  try {
    const result = await executeQuery("DESCRIBE suppliers");
    console.log("Suppliers table structure:");
    console.table(result);

    const sample = await executeQuery("SELECT * FROM suppliers LIMIT 3");
    console.log("Sample suppliers data:");
    console.table(sample);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkSuppliers();
