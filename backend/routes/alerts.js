const express = require("express");
const router = express.Router();
const AlertsController = require("../controllers/alertsController");
const { validateQueryParams } = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");

// Get all alerts - matches alertsAPI.getAll()
router.get(
  "/",
  validateQueryParams,
  asyncHandler(AlertsController.getAllAlerts)
);

// Get alert statistics
router.get("/stats", asyncHandler(AlertsController.getAlertStats));

// Generate low stock alerts automatically
router.post(
  "/generate-low-stock",
  asyncHandler(AlertsController.generateLowStockAlerts)
);

// Get specific alert by ID
router.get("/:id", asyncHandler(AlertsController.getAlertById));

// Create new alert
router.post("/", asyncHandler(AlertsController.createAlert));

// Update alert (acknowledge, resolve, etc.)
router.put("/:id", asyncHandler(AlertsController.updateAlert));
router.patch("/:id", asyncHandler(AlertsController.updateAlert));

// Delete/dismiss alert
router.delete("/:id", asyncHandler(AlertsController.deleteAlert));

module.exports = router;
