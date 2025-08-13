const express = require("express");
const router = express.Router();
const outboundController = require("../controllers/outboundController");

// Outbound dashboard routes
router.get("/metrics", outboundController.getOutboundMetrics);
router.get("/customer-data", outboundController.getCustomerData);
router.get("/pending-orders", outboundController.getPendingOrders);
router.get("/ontime-metrics", outboundController.getOnTimeMetrics);
router.get("/activities", outboundController.getRecentActivities);
router.get("/summary", outboundController.getSummary);

module.exports = router;
