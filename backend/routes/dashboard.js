const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboardController");
const {
  validateActivity,
  validateQueryParams,
} = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");

// Dashboard overview - main metrics
router.get("/overview", asyncHandler(DashboardController.getDashboardOverview));

// Recent activities - matches dashboardAPI.getActivity()
router.get(
  "/activity",
  validateQueryParams,
  asyncHandler(DashboardController.getActivity)
);

// Trends data - matches dashboardAPI.getTrends()
router.get(
  "/trends",
  validateQueryParams,
  asyncHandler(DashboardController.getTrends)
);

// Stock summary by category
router.get("/stock-summary", asyncHandler(DashboardController.getStockSummary));

// Active alerts
router.get(
  "/alerts",
  validateQueryParams,
  asyncHandler(DashboardController.getActiveAlerts)
);

// Recent stock movements
router.get(
  "/stock-movements",
  validateQueryParams,
  asyncHandler(DashboardController.getRecentStockMovements)
);

// Sales metrics
router.get(
  "/sales-metrics",
  validateQueryParams,
  asyncHandler(DashboardController.getSalesMetrics)
);

// Purchase metrics
router.get(
  "/purchase-metrics",
  validateQueryParams,
  asyncHandler(DashboardController.getPurchaseMetrics)
);

// Warehouse utilization metrics
router.get(
  "/warehouse-metrics",
  asyncHandler(DashboardController.getWarehouseMetrics)
);

// Quality control metrics
router.get(
  "/quality-metrics",
  validateQueryParams,
  asyncHandler(DashboardController.getQualityMetrics)
);

// Add user activity
router.post(
  "/activity",
  validateActivity,
  asyncHandler(DashboardController.addActivity)
);

module.exports = router;
