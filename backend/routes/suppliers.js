const express = require("express");
const SuppliersController = require("../controllers/suppliersController");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

// Routes for suppliers endpoints
router.get("/", SuppliersController.getAllSuppliers);
router.get("/stats/overview", SuppliersController.getSuppliersStats);
router.get("/stats/top-performers", SuppliersController.getTopPerformers);
router.get("/:id", SuppliersController.getSupplierById);
router.get("/:id/performance", SuppliersController.getSupplierPerformance);

router.post("/", SuppliersController.createSupplier);
router.put("/:id", SuppliersController.updateSupplier);
router.patch("/:id/status", SuppliersController.updateSupplierStatus);
router.delete("/:id", SuppliersController.deleteSupplier);

module.exports = router;
