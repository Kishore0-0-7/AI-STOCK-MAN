const express = require("express");
const cors = require("cors");
const { testConnection, healthCheck } = require("./config/db");

// Import clean controllers
const dashboardController = require("./controllers/dashboard");
const productsController = require("./controllers/products");
const suppliersController = require("./controllers/suppliers");
const alertsController = require("./controllers/alerts");
const purchaseOrdersController = require("./controllers/purchaseOrders");
const reportsController = require("./controllers/reports");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8080",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoints
app.get("/health", async (req, res) => {
  const health = await healthCheck();
  res.json(health);
});

app.get("/test-db", async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      connected: isConnected,
      message: isConnected
        ? "Database connection successful"
        : "Database connection failed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard routes
app.get("/api/dashboard/stats", dashboardController.getStats);
app.get("/api/dashboard/overview", dashboardController.getStats); // Alias for frontend compatibility
app.get("/api/dashboard/activities", dashboardController.getRecentActivities);
app.get("/api/dashboard/activity", dashboardController.getRecentActivities); // Alias for frontend compatibility
app.get("/api/dashboard/alerts", dashboardController.getLowStockAlerts);
app.get("/api/dashboard/sales", dashboardController.getSalesSummary);
app.get("/api/dashboard/trends", dashboardController.getSalesSummary); // Alias for trends data

// Products routes
app.get("/api/products/categories", productsController.getCategories);
app.get("/api/products/low-stock", productsController.getAll); // Filter low stock products via query params
app.get("/api/products/:id", productsController.getById);
app.get("/api/products", productsController.getAll);
app.post("/api/products", productsController.create);
app.post("/api/products/bulk", productsController.bulkCreate);
app.put("/api/products/:id", productsController.update);
app.patch("/api/products/:id/stock", productsController.updateStock);
app.delete("/api/products/:id", productsController.delete);

// Suppliers routes
app.get("/api/suppliers", suppliersController.getAll);
app.get("/api/suppliers/:id", suppliersController.getById);
app.get("/api/suppliers/:id/products", suppliersController.getProducts);
app.post("/api/suppliers", suppliersController.create);
app.put("/api/suppliers/:id", suppliersController.update);
app.put("/api/suppliers/:id/status", suppliersController.updateStatus);
app.delete("/api/suppliers/:id", suppliersController.delete);

// Alerts routes
app.get("/api/alerts", alertsController.getAll);
app.get("/api/alerts/summary", alertsController.getSummary);
app.get("/api/alerts/low-stock", alertsController.getAll); // Alias for low stock alerts
app.get("/api/alerts/category/:category", alertsController.getByCategory);
app.get(
  "/api/alerts/reorder-suggestions",
  alertsController.getReorderSuggestions
);
app.put("/api/alerts/threshold", alertsController.updateThreshold);
app.post("/api/alerts/:productId/acknowledge", alertsController.acknowledge);



// Purchase Orders routes
app.get("/api/purchase-orders", purchaseOrdersController.getAll);
app.get("/api/purchase-orders/stats", purchaseOrdersController.getStats);
app.get("/api/purchase-orders/:id", purchaseOrdersController.getById);
app.post("/api/purchase-orders", purchaseOrdersController.create);
app.put(
  "/api/purchase-orders/:id/status",
  purchaseOrdersController.updateStatus
);
app.put(
  "/api/purchase-orders/:id/receive",
  purchaseOrdersController.receiveItems
);
app.delete("/api/purchase-orders/:id", purchaseOrdersController.delete);

// Reports routes
app.get("/api/reports/sales/overview", reportsController.getSalesOverview);
app.get("/api/reports/sales/trends", reportsController.getSalesTrends);
app.get(
  "/api/reports/sales/categories",
  reportsController.getCategoryBreakdown
);
app.get("/api/reports/sales/customers", reportsController.getTopCustomers);
app.get("/api/reports/sales/products", reportsController.getTopProducts);
app.get(
  "/api/reports/sales/transactions",
  reportsController.getRecentTransactions
);
app.get("/api/reports/sales/export", reportsController.exportSalesReport);

// Legacy routes for backward compatibility (redirect to new routes)
app.get("/dashboard/stats", (req, res) =>
  res.redirect(301, "/api/dashboard/stats")
);
app.get("/products", (req, res) => res.redirect(301, "/api/products"));
app.get("/suppliers", (req, res) => res.redirect(301, "/api/suppliers"));
app.get("/alerts", (req, res) => res.redirect(301, "/api/alerts"));
app.get("/customers", (req, res) => res.redirect(301, "/api/customers"));
app.get("/bills", (req, res) => res.redirect(301, "/api/bills"));
app.get("/purchase-orders", (req, res) =>
  res.redirect(301, "/api/purchase-orders")
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error(
        "❌ Database connection failed. Please check your database configuration."
      );
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log("🚀 AI Stock Management Server Started");
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`�️  Database: Connected to ai_stock_management (localhost)`);
      console.log(`📋 Available endpoints:`);
      console.log(`   • Dashboard: GET /api/dashboard/stats`);
      console.log(`   • Products: GET /api/products`);
      console.log(`   • Suppliers: GET /api/suppliers`);
      console.log(`   • Alerts: GET /api/alerts`);
      console.log(`   • Customers: GET /api/customers`);
      console.log(`   • Bills: GET /api/bills`);
      console.log(`   • Purchase Orders: GET /api/purchase-orders`);
      console.log(`   • Sales Reports: GET /api/reports/sales/overview`);
      console.log(`   • Health Check: GET /health`);
      console.log("✅ All systems ready!");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  process.exit(0);
});

startServer();
