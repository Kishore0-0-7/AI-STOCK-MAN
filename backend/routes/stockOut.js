const express = require("express");
const router = express.Router();
const stockOutController = require("../controllers/stockOutController");

// Stock Out Management Routes
router.get("/requests", stockOutController.getStockOutRequests);
router.get("/metrics", stockOutController.getMetrics);
router.get("/dashboard", stockOutController.getDashboardData);
router.get("/requests/:id", stockOutController.getRequestById);
router.post("/requests", stockOutController.createRequest);
router.put("/requests/:id", stockOutController.updateRequest);

module.exports = router;
