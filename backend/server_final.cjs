const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
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

// Import routes
const dashboardRoutes = require("./routes/dashboard.cjs");
const reportsRoutes = require("./routes/reports.cjs");
const productsRoutes = require("./routes/products_enhanced.cjs");
const suppliersRoutes = require("./routes/suppliers_enhanced.cjs");
const customersRoutes = require("./routes/customers_enhanced.cjs");
const purchaseOrdersRoutes = require("./routes/purchase_orders.cjs");
const billsRoutes = require("./routes/bills_enhanced.cjs");
const alertsRoutes = require("./routes/alerts.cjs");

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/purchase-orders", purchaseOrdersRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/alerts", alertsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "AI Stock Management System API",
    version: "1.0.0",
    endpoints: {
      dashboard: "/api/dashboard",
      reports: "/api/reports",
      products: "/api/products",
      suppliers: "/api/suppliers",
      customers: "/api/customers",
      purchaseOrders: "/api/purchase-orders",
      bills: "/api/bills",
      alerts: "/api/alerts",
    },
    documentation: {
      health: "GET /health - Server health check",
      dashboard: {
        overview:
          "GET /api/dashboard/overview - Get dashboard overview statistics",
        activity: "GET /api/dashboard/activity - Get recent activities",
        trends: "GET /api/dashboard/trends - Get stock trends data",
        alerts: "GET /api/dashboard/alerts - Get active alerts",
        forecast: "GET /api/dashboard/forecast - Get demand forecasting",
      },
      reports: {
        sales: "GET /api/reports/sales - Get sales reports with filtering",
        trends: "GET /api/reports/trends - Get sales trends",
        categories: "GET /api/reports/categories - Get category-wise analysis",
        export: "GET /api/reports/export - Export reports as CSV",
      },
      products: {
        list: "GET /api/products - Get all products with pagination",
        details: "GET /api/products/:id - Get product details",
        create: "POST /api/products - Create new product",
        update: "PUT /api/products/:id - Update product",
        delete: "DELETE /api/products/:id - Delete product",
        stockMovement:
          "POST /api/products/:id/stock-movement - Add stock movement",
        stats: "GET /api/products/stats/summary - Get product statistics",
        lowStock: "GET /api/products/low-stock - Get low stock products",
      },
      suppliers: {
        list: "GET /api/suppliers - Get all suppliers with pagination",
        details: "GET /api/suppliers/:id - Get supplier details",
        create: "POST /api/suppliers - Create new supplier",
        update: "PUT /api/suppliers/:id - Update supplier",
        delete: "DELETE /api/suppliers/:id - Delete/deactivate supplier",
        performance:
          "GET /api/suppliers/:id/performance - Get supplier performance",
        stats: "GET /api/suppliers/stats/summary - Get supplier statistics",
      },
      customers: {
        list: "GET /api/customers - Get all customers with pagination",
        details: "GET /api/customers/:id - Get customer details",
        create: "POST /api/customers - Create new customer",
        update: "PUT /api/customers/:id - Update customer",
        delete: "DELETE /api/customers/:id - Delete/deactivate customer",
        search: "GET /api/customers/search - Search customers",
        stats: "GET /api/customers/stats/summary - Get customer statistics",
      },
      bills: {
        list: "GET /api/bills - Get all bills with pagination",
        details: "GET /api/bills/:id - Get bill details",
        upload: "POST /api/bills/upload - Upload bill for OCR processing",
        process:
          "POST /api/bills/process-extracted - Process OCR extracted data",
        updateStatus: "PATCH /api/bills/:id/status - Update bill status",
        delete: "DELETE /api/bills/:id - Delete bill",
        stats: "GET /api/bills/stats/summary - Get bills statistics",
      },
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum size is 10MB." });
    }
    return res.status(400).json({ error: "File upload error: " + err.message });
  }

  // Handle other errors
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "/api/dashboard/*",
      "/api/reports/*",
      "/api/products/*",
      "/api/suppliers/*",
      "/api/customers/*",
      "/api/purchase-orders/*",
      "/api/bills/*",
      "/api/alerts/*",
    ],
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Stock Management API Server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
  console.log(`📈 Reports API: http://localhost:${PORT}/api/reports`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🏪 Suppliers API: http://localhost:${PORT}/api/suppliers`);
  console.log(`👥 Customers API: http://localhost:${PORT}/api/customers`);
  console.log(
    `📋 Purchase Orders API: http://localhost:${PORT}/api/purchase-orders`
  );
  console.log(`🧾 Bills API: http://localhost:${PORT}/api/bills`);
  console.log(`🔔 Alerts API: http://localhost:${PORT}/api/alerts`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  console.log(`📁 File Uploads: http://localhost:${PORT}/uploads/`);
});

module.exports = app;
