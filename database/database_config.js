// =====================================================================
// AI Stock Management System - Database Configuration
// =====================================================================
// MySQL database connection and setup for Node.js backend
// =====================================================================

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "stock_user",
  password: process.env.DB_PASS || "stock_password_2024",
  database: process.env.DB_NAME || "ai_stock_management",
  charset: "utf8mb4",
  timezone: "+00:00",
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully!");

    // Test query
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?",
      [dbConfig.database]
    );
    console.log(`📊 Database has ${rows[0].table_count} tables`);

    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

// Initialize database with schema
const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, "ai_stock_management_schema.sql");

    if (!fs.existsSync(schemaPath)) {
      console.log("⚠️  Schema file not found, skipping initialization");
      return;
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    const statements = schema.split(";").filter((stmt) => stmt.trim());

    const connection = await pool.getConnection();

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    connection.release();
    console.log("✅ Database schema initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    throw error;
  }
};

// Database utility functions
const dbUtils = {
  // Execute query with error handling
  async query(sql, params = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  },

  // Execute transaction
  async transaction(queries) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const results = [];
      for (const query of queries) {
        const [result] = await connection.execute(
          query.sql,
          query.params || []
        );
        results.push(result);
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get table schema
  async getTableSchema(tableName) {
    const sql = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;
    return await this.query(sql, [dbConfig.database, tableName]);
  },

  // Check if table exists
  async tableExists(tableName) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `;
    const result = await this.query(sql, [dbConfig.database, tableName]);
    return result[0].count > 0;
  },

  // Get database statistics
  async getStats() {
    const tables = await this.query(
      `
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        DATA_LENGTH,
        INDEX_LENGTH,
        (DATA_LENGTH + INDEX_LENGTH) as TOTAL_SIZE
      FROM information_schema.tables 
      WHERE table_schema = ?
    `,
      [dbConfig.database]
    );

    return {
      totalTables: tables.length,
      totalRows: tables.reduce(
        (sum, table) => sum + (table.TABLE_ROWS || 0),
        0
      ),
      totalSize: tables.reduce(
        (sum, table) => sum + (table.TOTAL_SIZE || 0),
        0
      ),
      tables: tables,
    };
  },
};

// Express middleware for database connection
const dbMiddleware = (req, res, next) => {
  req.db = dbUtils;
  next();
};

module.exports = {
  pool,
  dbConfig,
  dbUtils,
  dbMiddleware,
  testConnection,
  initializeDatabase,
};
