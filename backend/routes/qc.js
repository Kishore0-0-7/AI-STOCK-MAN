const express = require("express");
const QCController = require("../controllers/qcController");
const { validateQueryParams } = require("../middleware/validation");

const router = express.Router();

// QC Routes
router.get("/metrics", QCController.getMetrics);
router.get("/defects", QCController.getDefects);
router.get("/rejection-trend", validateQueryParams, QCController.getRejectionTrend);
router.get("/hold-items", validateQueryParams, QCController.getHoldItems);
router.get("/stats", QCController.getStats);

// Update QC item status
router.put("/items/:id/status", QCController.updateItemStatus);

module.exports = router;
