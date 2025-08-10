const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

// Database configuration with robust connection handling
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "ai_stock_management",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
};

// Create connection pool with retry logic
let pool;
let promisePool;

const createPool = () => {
  pool = mysql.createPool(dbConfig);
  promisePool = pool.promise();

  // Handle pool errors
  pool.on("connection", function (connection) {
    console.log("Database connection established as id " + connection.threadId);
  });

  pool.on("error", function (err) {
    console.error("Database pool error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ETIMEDOUT") {
      console.log("Recreating database pool...");
      createPool();
    } else {
      throw err;
    }
  });
};

// Initialize pool
createPool();

// Test database connection with retry
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await promisePool.getConnection();
      console.log("✅ Database connected successfully");
      connection.release();
      return true;
    } catch (error) {
      console.error(
        `❌ Database connection attempt ${i + 1} failed:`,
        error.message
      );
      if (i === retries - 1) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return false;
};

// Initialize database tables
const initializeTables = async () => {
  try {
    console.log("📝 Creating database schema...");
    await createTables();
  } catch (error) {
    console.error("❌ Error initializing database tables:", error.message);
  }
};

// Create tables programmatically
const createTables = async () => {
  const tables = [
    // Suppliers table
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      zip_code VARCHAR(20),
      country VARCHAR(100) DEFAULT 'India',
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      sku VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2),
      current_stock INT DEFAULT 0,
      min_stock_level INT DEFAULT 10,
      max_stock_level INT DEFAULT 100,
      unit VARCHAR(50) DEFAULT 'pieces',
      supplier_id INT,
      status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    )`,

    // Customers table
    `CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      zip_code VARCHAR(20),
      country VARCHAR(100) DEFAULT 'India',
      customer_type ENUM('individual', 'business') DEFAULT 'individual',
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Purchase Orders table
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(100) UNIQUE NOT NULL,
      supplier_id INT NOT NULL,
      order_date DATE NOT NULL,
      expected_delivery_date DATE,
      total_amount DECIMAL(12,2) NOT NULL,
      status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
    )`,

    // Purchase Order Items table
    `CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      purchase_order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(12,2) NOT NULL,
      received_quantity INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )`,

    // Bills/Sales table
    `CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_number VARCHAR(100) UNIQUE NOT NULL,
      customer_id INT,
      bill_date DATE NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      final_amount DECIMAL(12,2) NOT NULL,
      payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
      payment_method VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )`,

    // Bill Items table
    `CREATE TABLE IF NOT EXISTS bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )`,

    // Alerts table
    `CREATE TABLE IF NOT EXISTS alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
      priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
      category VARCHAR(100),
      related_table VARCHAR(100),
      related_id INT,
      is_read BOOLEAN DEFAULT FALSE,
      is_dismissed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Stock Movements table
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
      quantity INT NOT NULL,
      reference_type VARCHAR(50),
      reference_id INT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )`,
  ];

  try {
    for (const tableSQL of tables) {
      await promisePool.query(tableSQL);
    }
    console.log("✅ All database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
  }
};

// Execute query with robust error handling and retry logic
const executeQuery = async (query, params = [], retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(
        "Executing query:",
        query.substring(0, 100) + (query.length > 100 ? "..." : "")
      );
      console.log("With parameters:", params);

      // Add timeout to the query
      const queryPromise = promisePool.query(query, params);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 30000)
      );

      const [results] = await Promise.race([queryPromise, timeoutPromise]);
      return results;
    } catch (error) {
      console.error(`Database query error (attempt ${i + 1}):`, error.message);

      if (
        error.code === "PROTOCOL_CONNECTION_LOST" ||
        error.code === "ETIMEDOUT" ||
        error.message === "Query timeout"
      ) {
        if (i < retries) {
          console.log("Retrying query...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      console.error("Query:", query);
      console.error("Parameters:", params);
      throw error;
    }
  }
};

// Get database statistics
const getStats = async () => {
  try {
    const [results] = await executeQuery(
      `SELECT 
        TABLE_NAME as tableName,
        TABLE_ROWS as rowCount,
        DATA_LENGTH as dataSize,
        INDEX_LENGTH as indexSize
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?`,
      [dbConfig.database]
    );

    return results;
  } catch (error) {
    console.error("Error getting database stats:", error.message);
    return [];
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const [result] = await executeQuery("SELECT 1 as health");
    return result && result.length > 0;
  } catch (error) {
    console.error("Health check failed:", error.message);
    return false;
  }
};

module.exports = {
  pool: promisePool,
  testConnection,
  initializeTables,
  executeQuery,
  getStats,
  healthCheck,
};
