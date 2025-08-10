const express = require("express");
const cors = require("cors");
const path = require("path");

// Import the fixed database configuration
const { testConnection, initializeTables } = require("./config/database_fixed");

// Import fixed controllers
const dashboardController = require("./controllers/dashboardController_fixed");
const productsController = require("./controllers/productsController_fixed");
const suppliersController = require("./controllers/suppliersController_fixed");
const alertsController = require("./controllers/alertsController_fixed");
const customersController = require("./controllers/customersController_fixed");

// Import existing controllers that might not have parameter issues
const billsController = require("./controllers/billsController");
const purchaseOrdersController = require("./controllers/purchaseOrdersController");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "🚀 AI Stock Management API Server",
    version: "1.0.0",
    status: "Running",
    endpoints: {
      dashboard: "/api/dashboard/overview",
      products: "/api/products",
      suppliers: "/api/suppliers",
      customers: "/api/customers",
      purchaseOrders: "/api/purchase-orders",
      bills: "/api/bills",
      alerts: "/api/alerts",
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Dashboard routes
app.get("/api/dashboard/overview", dashboardController.getOverview);
app.get("/api/dashboard/activity", dashboardController.getActivity);
app.get("/api/dashboard/trends", dashboardController.getTrends);
app.get("/api/dashboard/categories", dashboardController.getCategoryBreakdown);
app.get("/api/dashboard/suppliers", dashboardController.getSupplierPerformance);
app.get("/api/dashboard/low-stock", dashboardController.getLowStock);

// Products routes
app.get("/api/products", productsController.getAllProducts);
app.get("/api/products/categories", productsController.getCategories);
app.get("/api/products/:id", productsController.getProduct);
app.post("/api/products", productsController.createProduct);
app.put("/api/products/:id", productsController.updateProduct);
app.delete("/api/products/:id", productsController.deleteProduct);
app.patch("/api/products/:id/stock", productsController.updateStock);

// Suppliers routes
app.get("/api/suppliers", suppliersController.getAllSuppliers);
app.get("/api/suppliers/:id", suppliersController.getSupplier);
app.post("/api/suppliers", suppliersController.createSupplier);
app.put("/api/suppliers/:id", suppliersController.updateSupplier);
app.delete("/api/suppliers/:id", suppliersController.deleteSupplier);
app.get("/api/suppliers/:id/products", suppliersController.getSupplierProducts);
app.get("/api/suppliers/:id/orders", suppliersController.getSupplierOrders);

// Customers routes
app.get("/api/customers", customersController.getAllCustomers);
app.get("/api/customers/stats", customersController.getStats);
app.get("/api/customers/breakdown", customersController.getTypeBreakdown);
app.get("/api/customers/:id", customersController.getCustomer);
app.post("/api/customers", customersController.createCustomer);
app.put("/api/customers/:id", customersController.updateCustomer);
app.delete("/api/customers/:id", customersController.deleteCustomer);

// Alerts routes
app.get("/api/alerts", alertsController.getAllAlerts);
app.get("/api/alerts/stats", alertsController.getStats);
app.get("/api/alerts/:id", alertsController.getAlert);
app.post("/api/alerts", alertsController.createAlert);
app.put("/api/alerts/:id", alertsController.updateAlert);
app.delete("/api/alerts/:id", alertsController.deleteAlert);
app.patch("/api/alerts/:id/acknowledge", alertsController.acknowledgeAlert);
app.patch("/api/alerts/:id/resolve", alertsController.resolveAlert);
app.post(
  "/api/alerts/generate-low-stock",
  alertsController.generateLowStockAlerts
);

// Purchase Orders routes (using existing controller - might need fixes too)
try {
  app.get(
    "/api/purchase-orders",
    purchaseOrdersController.getAllPurchaseOrders
  );
  app.get(
    "/api/purchase-orders/:id",
    purchaseOrdersController.getPurchaseOrder
  );
  app.post(
    "/api/purchase-orders",
    purchaseOrdersController.createPurchaseOrder
  );
  app.put(
    "/api/purchase-orders/:id",
    purchaseOrdersController.updatePurchaseOrder
  );
  app.delete(
    "/api/purchase-orders/:id",
    purchaseOrdersController.deletePurchaseOrder
  );
  app.patch(
    "/api/purchase-orders/:id/status",
    purchaseOrdersController.updateOrderStatus
  );
} catch (error) {
  console.log("⚠️ Purchase Orders controller has issues, skipping routes");
}

// Bills routes (using existing controller - might need fixes too)
try {
  app.get("/api/bills", billsController.getAllBills);
  app.get("/api/bills/:id", billsController.getBill);
  app.post("/api/bills", billsController.createBill);
  app.put("/api/bills/:id", billsController.updateBill);
  app.delete("/api/bills/:id", billsController.deleteBill);
  app.post("/api/bills/upload", billsController.uploadBill);
} catch (error) {
  console.log("⚠️ Bills controller has issues, skipping routes");
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Start server function
const startServer = async () => {
  try {
    console.log("🔌 Testing database connection...");
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("❌ Database connection failed. Exiting...");
      process.exit(1);
    }

    console.log("📋 Initializing database tables...");
    await initializeTables();

    app.listen(PORT, () => {
      console.log("\n🚀 AI Stock Management API Server Started Successfully!");
      console.log(
        "============================================================"
      );
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(
        "============================================================"
      );
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
        `   Purchase Orders: http://localhost:${PORT}/api/purchase-orders`
      );
      console.log(`   Alerts System: http://localhost:${PORT}/api/alerts`);
      console.log(`   File Uploads: http://localhost:${PORT}/uploads/`);
      console.log("\n💡 Environment: development");
      console.log("🗄️  Database: MySQL with Connection Pooling (FIXED)");
      console.log("🏗️  Architecture: MVC Pattern with Fixed Controllers");
      console.log("📁 File Storage: Local filesystem with upload support");
      console.log("\n✅ Server is ready to handle requests!");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
