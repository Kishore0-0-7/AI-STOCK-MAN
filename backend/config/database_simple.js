const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

// Database configuration - simplified without problematic options
const dbConfig = {
  host: "13.127.244.139",
  user: "admin",
  password: "Hackathonintern",
  database: "ai_stock_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Get promise-based pool
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
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
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      contact_person VARCHAR(255),
      payment_terms VARCHAR(100),
      status ENUM('active', 'inactive') DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_name (name),
      INDEX idx_status (status)
    )`,

    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sku VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      cost DECIMAL(10,2) NOT NULL,
      stock_quantity INT DEFAULT 0,
      min_stock_level INT DEFAULT 10,
      supplier_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_sku (sku),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      INDEX idx_category (category),
      INDEX idx_stock (stock_quantity),
      INDEX idx_supplier (supplier_id)
    )`,

    // Customers table
    `CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      company VARCHAR(255),
      customer_type ENUM('individual', 'business') DEFAULT 'individual',
      status ENUM('active', 'inactive') DEFAULT 'active',
      credit_limit DECIMAL(10,2) DEFAULT 0.00,
      payment_terms VARCHAR(100) DEFAULT 'Net 30',
      tax_id VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_email (email),
      INDEX idx_name (name),
      INDEX idx_status (status),
      INDEX idx_customer_type (customer_type)
    )`,

    // Purchase orders table
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(100) NOT NULL,
      supplier_id INT NOT NULL,
      order_date DATE NOT NULL,
      delivery_date DATE,
      expected_delivery_date DATE,
      status ENUM('draft', 'pending', 'approved', 'completed', 'cancelled') DEFAULT 'draft',
      total_amount DECIMAL(10,2) DEFAULT 0.00,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
      UNIQUE KEY unique_order_number (order_number),
      INDEX idx_supplier (supplier_id),
      INDEX idx_status (status),
      INDEX idx_order_date (order_date)
    )`,

    // Purchase order items table
    `CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      purchase_order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      INDEX idx_purchase_order (purchase_order_id),
      INDEX idx_product (product_id)
    )`,

    // Stock movements table
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      movement_type ENUM('in', 'out') NOT NULL,
      quantity INT NOT NULL,
      reference_number VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_product (product_id),
      INDEX idx_movement_type (movement_type),
      INDEX idx_created_at (created_at)
    )`,

    // Bills table
    `CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_number VARCHAR(100) NOT NULL,
      supplier_name VARCHAR(255) NOT NULL,
      supplier_id INT NULL,
      bill_date DATE NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status ENUM('unprocessed', 'processed', 'pending_review', 'approved') DEFAULT 'unprocessed',
      file_name VARCHAR(255),
      file_path VARCHAR(500),
      ocr_confidence DECIMAL(3,2) DEFAULT 0.00,
      extracted_data JSON,
      processed_by VARCHAR(255) DEFAULT 'System',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      INDEX idx_bill_number (bill_number),
      INDEX idx_supplier (supplier_id),
      INDEX idx_status (status),
      INDEX idx_date (bill_date)
    )`,

    // Bill items table
    `CREATE TABLE IF NOT EXISTS bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_id INT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      line_total DECIMAL(10,2) NOT NULL,
      ocr_confidence DECIMAL(3,2) DEFAULT 0.00,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      INDEX idx_bill (bill_id),
      INDEX idx_product (product_id)
    )`,

    // Alerts table
    `CREATE TABLE IF NOT EXISTS alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('low_stock', 'out_of_stock', 'expired_product', 'overdue_payment') NOT NULL,
      priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      related_id INT,
      status ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_type (type),
      INDEX idx_priority (priority),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
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

// Execute query with error handling - using query instead of execute to avoid parameter issues
const executeQuery = async (query, params = []) => {
  try {
    console.log(
      "Executing query:",
      query.substring(0, 200) + (query.length > 200 ? "..." : "")
    );
    console.log("With parameters:", params);

    // Use query instead of execute to avoid parameter binding issues
    const [results] = await promisePool.query(query, params);
    return results;
  } catch (error) {
    console.error("Database query error:", error.message);
    console.error("Query:", query);
    console.error("Parameters:", params);
    throw error;
  }
};

// Get database statistics
const getStats = async () => {
  try {
    const [results] = await promisePool.query(
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

module.exports = {
  pool: promisePool,
  testConnection,
  initializeTables,
  executeQuery,
  getStats,
};
