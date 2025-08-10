const express = require("express");

// Import controllers
const dashboardController = require("../controllers/dashboardController");
const productsController = require("../controllers/productsController");
const suppliersController = require("../controllers/suppliersController");
const customersController = require("../controllers/customersController");
const billsController = require("../controllers/billsController");
const reportsController = require("../controllers/reportsController");
const purchaseOrdersController = require("../controllers/purchaseOrdersController");
const alertsController = require("../controllers/alertsController");

const router = express.Router();

// Dashboard routes
router.get("/dashboard/overview", dashboardController.getOverview);
router.get("/dashboard/activity", dashboardController.getActivity);
router.get("/dashboard/trends", dashboardController.getTrends);
router.get("/dashboard/alerts", dashboardController.getAlerts);
router.get("/dashboard/forecast", dashboardController.getForecast);

// Products routes
router.get("/products", productsController.getAllProducts);
router.get("/products/stats/summary", productsController.getProductStats);
router.get("/products/stats/by-category", productsController.getCategoryStats);
router.get("/products/low-stock", productsController.getLowStockProducts);
router.get("/products/:id", productsController.getProductById);
router.post("/products", productsController.createProduct);
router.put("/products/:id", productsController.updateProduct);
router.delete("/products/:id", productsController.deleteProduct);
router.post(
  "/products/:id/stock-movement",
  productsController.addStockMovement
);

// Suppliers routes
router.get("/suppliers", suppliersController.getAllSuppliers);
router.get("/suppliers/stats/summary", suppliersController.getSupplierStats);
router.get(
  "/suppliers/stats/top-performers",
  suppliersController.getTopPerformers
);
router.get("/suppliers/:id", suppliersController.getSupplierById);
router.get(
  "/suppliers/:id/performance",
  suppliersController.getSupplierPerformance
);
router.post("/suppliers", suppliersController.createSupplier);
router.put("/suppliers/:id", suppliersController.updateSupplier);
router.delete("/suppliers/:id", suppliersController.deleteSupplier);

// Customers routes
router.get("/customers", customersController.getAllCustomers);
router.get("/customers/search", customersController.searchCustomers);
router.get("/customers/stats/summary", customersController.getCustomerStats);
router.get(
  "/customers/stats/top-customers",
  customersController.getTopCustomers
);
router.get("/customers/:id", customersController.getCustomerById);
router.post("/customers", customersController.createCustomer);
router.put("/customers/:id", customersController.updateCustomer);
router.delete("/customers/:id", customersController.deleteCustomer);

// Bills routes
router.get("/bills", billsController.getAllBills);
router.get("/bills/stats/summary", billsController.getBillStats);
router.get("/bills/:id", billsController.getBillById);
router.post("/bills/upload", billsController.uploadBill);
router.post("/bills/process-extracted", billsController.processExtractedData);
router.patch("/bills/:id/status", billsController.updateBillStatus);
router.delete("/bills/:id", billsController.deleteBill);

// Reports routes
router.get("/reports/sales", reportsController.getSalesReports);
router.get("/reports/trends", reportsController.getSalesTrends);
router.get("/reports/categories", reportsController.getCategoryAnalysis);
router.get("/reports/suppliers", reportsController.getSupplierReports);
router.get("/reports/export", reportsController.exportReports);

// Purchase Orders routes
router.get("/purchase-orders", purchaseOrdersController.getAllPurchaseOrders);
router.get(
  "/purchase-orders/:id",
  purchaseOrdersController.getPurchaseOrderById
);
router.post("/purchase-orders", purchaseOrdersController.createPurchaseOrder);
router.put(
  "/purchase-orders/:id",
  purchaseOrdersController.updatePurchaseOrder
);
router.delete(
  "/purchase-orders/:id",
  purchaseOrdersController.deletePurchaseOrder
);
router.patch(
  "/purchase-orders/:id/status",
  purchaseOrdersController.updateOrderStatus
);

// Alerts routes
router.get("/alerts", alertsController.getAllAlerts);
router.post("/alerts", alertsController.createAlert);
router.put("/alerts/:id", alertsController.updateAlert);
router.delete("/alerts/:id", alertsController.deleteAlert);
router.patch("/alerts/:id/status", alertsController.updateAlertStatus);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

module.exports = router;
