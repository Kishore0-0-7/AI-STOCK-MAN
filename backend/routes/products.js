const express = require("express");
const router = express.Router();
const ProductsController = require("../controllers/productsController");
const { validateQueryParams } = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");

// Get all products - matches productsAPI.getAll()
router.get(
  "/",
  validateQueryParams,
  asyncHandler(ProductsController.getAllProducts)
);

// Get low stock products - matches productsAPI.getLowStock()
router.get(
  "/low-stock",
  validateQueryParams,
  asyncHandler(ProductsController.getLowStockProducts)
);

// Get product categories
router.get("/categories", asyncHandler(ProductsController.getCategories));

// Get specific product by ID
router.get("/:id", asyncHandler(ProductsController.getProductById));

// Create new product
router.post("/", asyncHandler(ProductsController.createProduct));

// Update product
router.put("/:id", asyncHandler(ProductsController.updateProduct));
router.patch("/:id", asyncHandler(ProductsController.updateProduct));

// Delete product (soft delete)
router.delete("/:id", asyncHandler(ProductsController.deleteProduct));

module.exports = router;
