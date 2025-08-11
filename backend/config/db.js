const mysql = require("mysql2");

// Clean database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "ai_stock_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// Handle pool events
pool.on("connection", function (connection) {
  console.log("✅ Database connected as id " + connection.threadId);
});

pool.on("error", function (err) {
  console.error("❌ Database pool error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ETIMEDOUT") {
    console.log("🔄 Database connection lost, reconnecting...");
  } else {
    throw err;
  }
});

// Execute query function with proper error handling
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await promisePool.query(query, params);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await executeQuery("SELECT 1 as test");
    console.log("✅ Database connection test successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await executeQuery(
      "SELECT COUNT(*) as product_count FROM products"
    );
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      product_count: result[0].product_count,
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

module.exports = {
  pool,
  promisePool,
  executeQuery,
  testConnection,
  healthCheck,
};
