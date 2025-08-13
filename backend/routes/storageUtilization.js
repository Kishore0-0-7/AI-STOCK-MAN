const express = require("express");
const router = express.Router();
const storageUtilizationController = require("../controllers/storageUtilizationController");

// Storage utilization dashboard routes
router.get("/overview", storageUtilizationController.getOverview);
router.get(
  "/rack-utilization",
  storageUtilizationController.getRackUtilization
);
router.get("/heat-map", storageUtilizationController.getHeatMap);
router.get("/trends", storageUtilizationController.getTrends);
router.get("/kpis", storageUtilizationController.getKPIs);
router.get("/forecast", storageUtilizationController.getForecast);
router.get("/summary", storageUtilizationController.getSummary);

module.exports = router;
