const mysql = require("mysql2");

// Database configuration
const dbConfig = {
  host: "13.127.244.139",
  user: "admin",
  password: "Hackathonintern",
  database: "ai_stock_management",
};

async function checkTables() {
  const connection = mysql.createConnection(dbConfig);

  try {
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check suppliers table structure and data
    const suppliersStructure = await new Promise((resolve, reject) => {
      connection.query("DESCRIBE suppliers", (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log("📊 Suppliers table structure:");
    suppliersStructure.forEach((col) => {
      console.log(
        `  ${col.Field}: ${col.Type} ${col.Key ? "[" + col.Key + "]" : ""}`
      );
    });

    // Check actual suppliers data
    const suppliersData = await new Promise((resolve, reject) => {
      connection.query("SELECT * FROM suppliers", (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log("📊 Suppliers data:");
    suppliersData.forEach((supplier) => {
      console.log(`  ID: ${supplier.id}, Name: ${supplier.name}`);
    });

    // Check purchase_orders table structure
    const ordersStructure = await new Promise((resolve, reject) => {
      connection.query("DESCRIBE purchase_orders", (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log("📊 Purchase orders table structure:");
    ordersStructure.forEach((col) => {
      console.log(
        `  ${col.Field}: ${col.Type} ${col.Key ? "[" + col.Key + "]" : ""}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    connection.end();
  }
}

checkTables();
