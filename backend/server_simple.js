const express = require("express");
const cors = require("cors");
const path = require("path");

// Import the simple database configuration
const {
  testConnection,
  initializeTables,
} = require("./config/database_simple");

// Import simple controllers
const dashboardController = require("./controllers/dashboardController_simple");
const productsController = require("./controllers/productsController_simple");
const suppliersController = require("./controllers/suppliersController_simple");
const alertsController = require("./controllers/alertsController_simple");
const customersController = require("./controllers/customersController_simple");

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
    message: "🚀 AI Stock Management API Server - SIMPLE VERSION",
    version: "1.0.0-simple",
    status: "Running",
    note: "Using simplified controllers to avoid MySQL parameter binding issues",
    endpoints: {
      dashboard: "/api/dashboard/overview",
      products: "/api/products",
      suppliers: "/api/suppliers",
      customers: "/api/customers",
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
    version: "simple",
  });
});

// Dashboard routes - simplified
app.get("/api/dashboard/overview", dashboardController.getOverview);
app.get("/api/dashboard/activity", dashboardController.getActivity);

// Products routes - simplified
app.get("/api/products", productsController.getAllProducts);
app.get("/api/products/categories", productsController.getCategories);
app.get("/api/products/:id", productsController.getProduct);
app.post("/api/products", productsController.createProduct);

// Suppliers routes - simplified
app.get("/api/suppliers", suppliersController.getAllSuppliers);
app.post("/api/suppliers", suppliersController.createSupplier);

// Customers routes - simplified
app.get("/api/customers", customersController.getAllCustomers);
app.post("/api/customers", customersController.createCustomer);

// Alerts routes - simplified
app.get("/api/alerts", alertsController.getAllAlerts);
app.post("/api/alerts", alertsController.createAlert);

// Purchase Orders routes - basic endpoint
app.get("/api/purchase-orders", async (req, res) => {
  try {
    const { executeQuery } = require("./config/database_simple");

    console.log("Fetching purchase orders...");
    const query = `
      SELECT 
        po.*,
        s.name as supplier_name,
        s.email as supplier_email
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.created_at DESC
      LIMIT 50
    `;

    const orders = await executeQuery(query);
    console.log("Found orders:", orders.length);

    res.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        supplier: {
          id: order.supplier_id,
          name: order.supplier_name,
          email: order.supplier_email,
        },
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        expectedDeliveryDate: order.expected_delivery_date,
        status: order.status,
        totalAmount: parseFloat(order.total_amount),
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
    version: "simple",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
    version: "simple",
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
      console.log(
        "\n🚀 AI Stock Management API Server Started Successfully! (SIMPLE VERSION)"
      );
      console.log(
        "============================================================"
      );
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(
        "============================================================"
      );
      console.log("\n📡 API Endpoints Available (SIMPLIFIED):");
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
      console.log(
        `   Purchase Orders: http://localhost:${PORT}/api/purchase-orders`
      );
      console.log(`   Alerts System: http://localhost:${PORT}/api/alerts`);
      console.log(`   File Uploads: http://localhost:${PORT}/uploads/`);
      console.log("\n💡 Environment: development");
      console.log(
        "🗄️  Database: MySQL with Simple Query Execution (NO PARAMETER BINDING)"
      );
      console.log("🏗️  Architecture: MVC Pattern with Simplified Controllers");
      console.log("📁 File Storage: Local filesystem with upload support");
      console.log(
        "\n⚠️  NOTE: This is a simplified version to avoid MySQL parameter binding issues"
      );
      console.log("✅ Server is ready to handle requests!");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
