const mysql = require("mysql2");

// Database configuration
const dbConfig = {
  host: "13.127.244.139",
  user: "admin",
  password: "Hackathonintern",
  database: "ai_stock_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

async function testDatabase() {
  const connection = mysql.createConnection(dbConfig);

  try {
    // Test connection
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("✅ Database connected");

    // Test suppliers table
    const suppliers = await new Promise((resolve, reject) => {
      connection.query(
        "SELECT COUNT(*) as count FROM suppliers",
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    console.log("📊 Suppliers count:", suppliers[0].count);

    // Test purchase_orders table
    const orders = await new Promise((resolve, reject) => {
      connection.query(
        "SELECT COUNT(*) as count FROM purchase_orders",
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    console.log("📊 Purchase orders count:", orders[0].count);

    // Test the exact query from controller
    const results = await new Promise((resolve, reject) => {
      connection.query(
        `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.email as supplier_email
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.created_at DESC
        LIMIT 50
      `,
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    console.log("📋 Purchase orders with suppliers:", results.length);
    console.log(
      "📋 Sample data:",
      JSON.stringify(results.slice(0, 2), null, 2)
    );
  } catch (error) {
    console.error("❌ Database test failed:", error);
  } finally {
    connection.end();
  }
}

testDatabase();
