const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { testConnection } = require("./config/database");

// Import routes
const dashboardRoutes = require("./routes/dashboard");
const productRoutes = require("./routes/products");
const alertRoutes = require("./routes/alerts");
const supplierRoutes = require("./routes/suppliers");
const qcRoutes = require("./routes/qc");
const productionCalculatorRoutes = require("./routes/productionCalculator");
const inboundRoutes = require("./routes/inbound");
const outboundRoutes = require("./routes/outbound");
const storageUtilizationRoutes = require("./routes/storageUtilization");
const stockOutRoutes = require("./routes/stockOut");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const purchaseOrderRoutes = require("./routes/purchaseOrders");
const stockSummaryRoutes = require("./routes/stockSummary");
// TODO: Add other route imports here

const app = express();
// Configuration
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting (disabled in development)
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
}

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite default
      "http://localhost:8080", // Alternative frontend port
      "http://localhost:3000", // React default
      "http://localhost:4000", // Alternative port
      "https://localhost",
      "https://hackathon.artechnology.pro",
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

// Handle preflight requests
app.options("*", cors());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
const API_PREFIX = process.env.API_PREFIX || "/api";
const API_VERSION = process.env.API_VERSION || "v1";

app.use(`${API_PREFIX}/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/products`, productRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/alerts`, alertRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/suppliers`, supplierRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/qc`, qcRoutes);
app.use(
  `${API_PREFIX}/${API_VERSION}/production-calculator`,
  productionCalculatorRoutes
);
app.use(`${API_PREFIX}/${API_VERSION}/inbound`, inboundRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/outbound`, outboundRoutes);
app.use(
  `${API_PREFIX}/${API_VERSION}/storage-utilization`,
  storageUtilizationRoutes
);
app.use(`${API_PREFIX}/${API_VERSION}/stock-out`, stockOutRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/auth`, authRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/purchase-orders`, purchaseOrderRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/stock-summary`, stockSummaryRoutes);
// TODO: Add other routes here
// app.use(`${API_PREFIX}/${API_VERSION}/customer-orders`, customerOrderRoutes);
// app.use(`${API_PREFIX}/${API_VERSION}/customer-orders`, customerOrderRoutes);
// app.use(`${API_PREFIX}/${API_VERSION}/inventory`, inventoryRoutes);
// app.use(`${API_PREFIX}/${API_VERSION}/warehouse`, warehouseRoutes);
// app.use(`${API_PREFIX}/${API_VERSION}/reports`, reportRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  const isDevelopment = process.env.NODE_ENV !== "production";

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `📊 Dashboard API: http://localhost:${PORT}${API_PREFIX}/${API_VERSION}/dashboard`
      );
      console.log(
        `📦 Products API: http://localhost:${PORT}${API_PREFIX}/${API_VERSION}/products`
      );
      console.log(
        `🚨 Alerts API: http://localhost:${PORT}${API_PREFIX}/${API_VERSION}/alerts`
      );
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Gracefully shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Gracefully shutting down server...");
  process.exit(0);
});

startServer();

module.exports = app;
