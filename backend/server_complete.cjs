const express = require("express");
const cors = require("cors");
const db = require("./config/db.cjs");

// Import route modules
const productsRoutes = require("./routes/products.cjs");
const suppliersRoutes = require("./routes/suppliers.cjs");
const customersRoutes = require("./routes/customers.cjs");
const purchaseOrdersRoutes = require("./routes/purchase_orders.cjs");
const alertsRoutes = require("./routes/alerts.cjs");
const billsRoutes = require("./routes/bills.cjs");
const dashboardRoutes = require("./routes/dashboard.cjs");
const reportsRoutes = require("./routes/reports.cjs");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/products", productsRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/purchase-orders", purchaseOrdersRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ AI Stock Management Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
  console.log("🔗 API Endpoints:");
  console.log("   - Products: /api/products");
  console.log("   - Suppliers: /api/suppliers");
  console.log("   - Purchase Orders: /api/purchase-orders");
  console.log("   - Alerts: /api/alerts");
  console.log("   - Bills: /api/bills");
  console.log("   - Dashboard: /api/dashboard");
  console.log("   - Reports: /api/reports");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  db.end(() => {
    console.log("Database connection closed.");
    process.exit(0);
  });
});

module.exports = app;
