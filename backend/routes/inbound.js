const express = require("express");
const router = express.Router();
const {
  getInboundMetrics,
  getSupplierData,
  getPendingShipments,
  getQualityStatus,
  getRecentActivities,
  getInboundSummary,
} = require("../controllers/inboundController");

// Inbound metrics routes
router.get("/metrics", getInboundMetrics);

// Supplier data routes
router.get("/suppliers", getSupplierData);

// Shipments routes
router.get("/pending-shipments", getPendingShipments);

// Quality status routes
router.get("/quality-status", getQualityStatus);

// Activities routes
router.get("/activities", getRecentActivities);

// Summary/analytics routes
router.get("/summary", getInboundSummary);

module.exports = router;
