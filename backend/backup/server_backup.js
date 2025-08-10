const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { testConnection, initializeTables } = require("./config/database");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = 4000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://localhost:8080",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
const billsUploadsDir = path.join(uploadsDir, "bills");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(billsUploadsDir)) {
  fs.mkdirSync(billsUploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsDir));

// Root endpoint with API documentation
app.get("/", (req, res) => {
  res.json({
    message: "AI Stock Management System API",
    version: "2.0.0",
    status: "Active",
    architecture: "MVC Pattern with Separate Controllers",
    database: "MySQL with Connection Pooling",
    endpoints: {
      health: "/api/health",
      dashboard: "/api/dashboard/*",
      products: "/api/products/*",
      suppliers: "/api/suppliers/*",
      customers: "/api/customers/*",
      bills: "/api/bills/*",
      reports: "/api/reports/*",
      purchaseOrders: "/api/purchase-orders/*",
      alerts: "/api/alerts/*",
    },
    features: [
      "RESTful API Design",
      "Database Connection Pooling",
      "File Upload Support",
      "OCR Bill Processing Simulation",
      "Comprehensive Reporting",
      "Real-time Dashboard Analytics",
      "Stock Movement Tracking",
      "Automated Alert Generation",
      "CSV Export Functionality",
      "Advanced Filtering & Pagination",
    ],
    documentation: {
      dashboard: {
        overview: "GET /api/dashboard/overview - Dashboard statistics",
        activity: "GET /api/dashboard/activity - Recent activities",
        trends: "GET /api/dashboard/trends - Stock trends data",
        alerts: "GET /api/dashboard/alerts - Active alerts",
        forecast: "GET /api/dashboard/forecast - Demand forecasting",
      },
      products: {
        list: "GET /api/products - List products with pagination",
        details: "GET /api/products/:id - Product details",
        create: "POST /api/products - Create product",
        update: "PUT /api/products/:id - Update product",
        delete: "DELETE /api/products/:id - Delete product",
        stockMovement:
          "POST /api/products/:id/stock-movement - Add stock movement",
        stats: "GET /api/products/stats/* - Product statistics",
        lowStock: "GET /api/products/low-stock - Low stock products",
      },
      suppliers: {
        list: "GET /api/suppliers - List suppliers",
        details: "GET /api/suppliers/:id - Supplier details",
        create: "POST /api/suppliers - Create supplier",
        update: "PUT /api/suppliers/:id - Update supplier",
        delete: "DELETE /api/suppliers/:id - Delete supplier",
        performance: "GET /api/suppliers/:id/performance - Performance metrics",
        stats: "GET /api/suppliers/stats/* - Supplier statistics",
      },
      customers: {
        list: "GET /api/customers - List customers",
        details: "GET /api/customers/:id - Customer details",
        create: "POST /api/customers - Create customer",
        update: "PUT /api/customers/:id - Update customer",
        delete: "DELETE /api/customers/:id - Delete customer",
        search: "GET /api/customers/search - Search customers",
        stats: "GET /api/customers/stats/* - Customer statistics",
      },
      bills: {
        list: "GET /api/bills - List bills",
        details: "GET /api/bills/:id - Bill details",
        upload: "POST /api/bills/upload - Upload bill for OCR",
        process: "POST /api/bills/process-extracted - Process OCR data",
        updateStatus: "PATCH /api/bills/:id/status - Update status",
        delete: "DELETE /api/bills/:id - Delete bill",
        stats: "GET /api/bills/stats/summary - Bills statistics",
      },
      reports: {
        sales: "GET /api/reports/sales - Sales reports",
        trends: "GET /api/reports/trends - Sales trends",
        categories: "GET /api/reports/categories - Category analysis",
        suppliers: "GET /api/reports/suppliers - Supplier reports",
        export: "GET /api/reports/export - Export as CSV",
      },
    },
  });
});

// Use API routes
app.use("/api", apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ error: "Validation Error", details: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  // Default error response
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: message,
    stack: err.stack, // Show stack trace for debugging
  });
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
    availableRoutes: {
      root: "GET /",
      health: "GET /api/health",
      dashboard: "GET /api/dashboard/*",
      products: "GET /api/products",
      suppliers: "GET /api/suppliers",
      customers: "GET /api/customers",
      bills: "GET /api/bills",
      reports: "GET /api/reports/*",
      purchaseOrders: "GET /api/purchase-orders",
      alerts: "GET /api/alerts",
    },
    message:
      "Check the API documentation at the root endpoint for complete details",
  });
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Database initialization and server startup
const startServer = async () => {
  try {
    console.log("🔌 Testing database connection...");
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error(
        "❌ Failed to connect to database. Please check your database configuration."
      );
      process.exit(1);
    }

    console.log("📋 Initializing database tables...");
    await initializeTables();

    app.listen(PORT, () => {
      console.log("\n🚀 AI Stock Management API Server Started Successfully!");
      console.log("=".repeat(60));
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log("=".repeat(60));
      console.log("\n📡 API Endpoints Available:");
      console.log(
        `   Dashboard Analytics: http://localhost:${PORT}/api/dashboard/overview`
      );
      console.log(
        `   Products Management: http://localhost:${PORT}/api/products`
      );
      console.log(
        `   Suppliers Management: http://localhost:${PORT}/api/suppliers`
      );
      console.log(
        `   Customers Management: http://localhost:${PORT}/api/customers`
      );
      console.log(`   Bills Processing: http://localhost:${PORT}/api/bills`);
      console.log(
        `   Reports & Analytics: http://localhost:${PORT}/api/reports/sales`
      );
      console.log(
        `   Purchase Orders: http://localhost:${PORT}/api/purchase-orders`
      );
      console.log(`   Alerts System: http://localhost:${PORT}/api/alerts`);
      console.log(`   File Uploads: http://localhost:${PORT}/uploads/`);
      console.log("\n💡 Environment: development");
      console.log("🗄️  Database: MySQL with Connection Pooling");
      console.log("🏗️  Architecture: MVC Pattern with Separate Controllers");
      console.log("📁 File Storage: Local filesystem with upload support");
      console.log("\n✅ Server is ready to handle requests!");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
