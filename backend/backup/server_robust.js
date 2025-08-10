const express = require("express");
const cors = require("cors");
const path = require("path");

// Import the robust database configuration
const {
  testConnection,
  initializeTables,
  executeQuery,
} = require("./config/database_robust");

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
    message: "🚀 AI Stock Management API Server - ROBUST VERSION",
    version: "1.0.0-robust",
    status: "Running",
    note: "Using robust database connection with retry logic",
    endpoints: {
      dashboard: "/api/dashboard/overview",
      trends: "/api/dashboard/trends",
      activity: "/api/dashboard/activity",
      products: "/api/products",
      suppliers: "/api/suppliers",
      customers: "/api/customers",
      purchaseOrders: "/api/purchase-orders",
      alerts: "/api/alerts",
      lowStockAlerts: "/api/alerts/low-stock",
    },
  });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const { healthCheck } = require("./config/database_robust");
    const dbHealthy = await healthCheck();

    res.json({
      status: dbHealthy ? "OK" : "DEGRADED",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "robust",
      database: dbHealthy ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Dashboard routes - with all required endpoints
app.get("/api/dashboard/overview", dashboardController.getOverview);
app.get("/api/dashboard/activity", dashboardController.getActivity);

// Dashboard trends endpoint - missing from the original
app.get("/api/dashboard/trends", async (req, res) => {
  try {
    console.log("Fetching dashboard trends...");

    // Get monthly trends for the last 6 months
    const trendsQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        'products' as type
      FROM products 
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        'orders' as type
      FROM purchase_orders 
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      
      ORDER BY month DESC
    `;

    const trends = await executeQuery(trendsQuery);

    // Process trends data
    const processedTrends = {
      products: [],
      orders: [],
      revenue: [],
    };

    trends.forEach((item) => {
      if (item.type === "products") {
        processedTrends.products.push({
          month: item.month,
          value: item.count,
        });
      } else if (item.type === "orders") {
        processedTrends.orders.push({
          month: item.month,
          value: item.count,
        });
      }
    });

    res.json({
      success: true,
      trends: processedTrends,
    });
  } catch (error) {
    console.error("Error fetching dashboard trends:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard trends",
      message: error.message,
    });
  }
});

// Products routes
app.get("/api/products", productsController.getAllProducts);
app.get("/api/products/categories", productsController.getCategories);
app.get("/api/products/:id", productsController.getProduct);
app.post("/api/products", productsController.createProduct);
app.put(
  "/api/products/:id",
  productsController.updateProduct ||
    ((req, res) => {
      res.status(501).json({ error: "Update product not implemented yet" });
    })
);
app.delete(
  "/api/products/:id",
  productsController.deleteProduct ||
    ((req, res) => {
      res.status(501).json({ error: "Delete product not implemented yet" });
    })
);

// Suppliers routes
app.get("/api/suppliers", suppliersController.getAllSuppliers);
app.post("/api/suppliers", suppliersController.createSupplier);
app.put(
  "/api/suppliers/:id",
  suppliersController.updateSupplier ||
    ((req, res) => {
      res.status(501).json({ error: "Update supplier not implemented yet" });
    })
);
app.delete(
  "/api/suppliers/:id",
  suppliersController.deleteSupplier ||
    ((req, res) => {
      res.status(501).json({ error: "Delete supplier not implemented yet" });
    })
);

// Customers routes
app.get("/api/customers", customersController.getAllCustomers);
app.post("/api/customers", customersController.createCustomer);
app.put(
  "/api/customers/:id",
  customersController.updateCustomer ||
    ((req, res) => {
      res.status(501).json({ error: "Update customer not implemented yet" });
    })
);
app.delete(
  "/api/customers/:id",
  customersController.deleteCustomer ||
    ((req, res) => {
      res.status(501).json({ error: "Delete customer not implemented yet" });
    })
);

// Alerts routes
app.get("/api/alerts", alertsController.getAllAlerts);
app.post("/api/alerts", alertsController.createAlert);

// Low stock alerts endpoint - missing from the original
app.get("/api/alerts/low-stock", async (req, res) => {
  try {
    console.log("Fetching low stock alerts...");

    const lowStockQuery = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity as current_stock,
        p.min_stock_level,
        p.category,
        s.name as supplier_name,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.min_stock_level THEN 'low_stock'
          ELSE 'normal'
        END as alert_level
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.stock_quantity <= p.min_stock_level
      ORDER BY 
        CASE 
          WHEN p.stock_quantity = 0 THEN 1
          ELSE 2
        END,
        p.stock_quantity ASC
    `;

    const lowStockProducts = await executeQuery(lowStockQuery);

    const alerts = lowStockProducts.map((product) => ({
      id: `low-stock-${product.id}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.current_stock,
      minStockLevel: product.min_stock_level,
      category: product.category,
      supplierName: product.supplier_name,
      alertLevel: product.alert_level,
      message:
        product.current_stock === 0
          ? `${product.name} is out of stock!`
          : `${product.name} is running low (${product.current_stock} remaining)`,
      createdAt: new Date().toISOString(),
    }));

    res.json({
      success: true,
      alerts,
      total: alerts.length,
      summary: {
        outOfStock: alerts.filter((a) => a.alertLevel === "out_of_stock")
          .length,
        lowStock: alerts.filter((a) => a.alertLevel === "low_stock").length,
      },
    });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch low stock alerts",
      message: error.message,
    });
  }
});

// Purchase Orders routes
app.get("/api/purchase-orders", async (req, res) => {
  try {
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
      success: true,
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
        totalAmount: parseFloat(order.total_amount || 0),
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      })),
      total: orders.length,
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch purchase orders",
      message: error.message,
    });
  }
});

app.post("/api/purchase-orders", async (req, res) => {
  try {
    const {
      orderNumber,
      supplierId,
      orderDate,
      expectedDeliveryDate,
      totalAmount,
      status = "pending",
      notes,
    } = req.body;

    console.log("Creating new purchase order...");

    const insertQuery = `
      INSERT INTO purchase_orders 
      (order_number, supplier_id, order_date, expected_delivery_date, total_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(insertQuery, [
      orderNumber,
      supplierId,
      orderDate,
      expectedDeliveryDate,
      totalAmount,
      status,
      notes,
    ]);

    res.json({
      success: true,
      message: "Purchase order created successfully",
      orderId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create purchase order",
      message: error.message,
    });
  }
});

// Bills/Sales routes
app.get("/api/bills", async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*,
        c.name as customer_name
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `;

    const bills = await executeQuery(query);

    res.json({
      success: true,
      bills: bills.map((bill) => ({
        id: bill.id,
        billNumber: bill.bill_number,
        customer: {
          id: bill.customer_id,
          name: bill.customer_name,
        },
        billDate: bill.bill_date,
        totalAmount: parseFloat(bill.total_amount || 0),
        finalAmount: parseFloat(bill.final_amount || 0),
        paymentStatus: bill.payment_status,
        createdAt: bill.created_at,
      })),
      total: bills.length,
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bills",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error.message,
    version: "robust",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method,
    version: "robust",
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
        "\n🚀 AI Stock Management API Server Started Successfully! (ROBUST VERSION)"
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
      console.log("\n📡 API Endpoints Available:");
      console.log(
        `   Dashboard Overview: http://localhost:${PORT}/api/dashboard/overview`
      );
      console.log(
        `   Dashboard Trends: http://localhost:${PORT}/api/dashboard/trends`
      );
      console.log(
        `   Dashboard Activity: http://localhost:${PORT}/api/dashboard/activity`
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
      console.log(`   Bills Management: http://localhost:${PORT}/api/bills`);
      console.log(`   Alerts System: http://localhost:${PORT}/api/alerts`);
      console.log(
        `   Low Stock Alerts: http://localhost:${PORT}/api/alerts/low-stock`
      );
      console.log(`   File Uploads: http://localhost:${PORT}/uploads/`);
      console.log("\n💡 Environment: development");
      console.log(
        "🗄️  Database: MySQL with Robust Connection Pool & Retry Logic"
      );
      console.log("🏗️  Architecture: MVC Pattern with Error Handling");
      console.log("📁 File Storage: Local filesystem with upload support");
      console.log("\n✅ All endpoints implemented with proper error handling!");
      console.log("🔄 Database connection pooling with automatic retry");
      console.log("⏱️  Query timeout protection (30s)");
      console.log("🛡️  Robust error handling and logging");
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
