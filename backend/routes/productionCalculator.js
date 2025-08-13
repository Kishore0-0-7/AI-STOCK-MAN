const express = require("express");
const router = express.Router();
const {
  getRawMaterials,
  getProducts,
  calculateProduction,
  getProductionBatches,
  getInventoryAnalytics,
  createProductionBatch,
} = require("../controllers/productionCalculatorController");

// Raw Materials routes
router.get("/raw-materials", getRawMaterials);

// Products routes
router.get("/products", getProducts);

// Production calculation routes
router.post(
  "/calculate",
  (req, res, next) => {
    console.log("Calculate route hit with body:", JSON.stringify(req.body));
    next();
  },
  calculateProduction
);

// Production batches routes
router.get("/batches", getProductionBatches);
router.post("/batches", createProductionBatch);

// Analytics routes
router.get("/analytics", getInventoryAnalytics);

module.exports = router;
