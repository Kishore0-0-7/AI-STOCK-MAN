const express = require("express");
const router = express.Router();
const stockSummaryController = require("../controllers/stockSummaryController");

/**
 * @route GET /api/v1/stock-summary
 * @desc Get comprehensive stock summary with filtering, sorting, and pagination
 * @access Public
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @query {string} search - Search term for name, SKU, or supplier
 * @query {string} category - Filter by category (default: "all")
 * @query {string} stockFilter - Filter by stock status: "all", "in_stock", "low_stock", "out_of_stock"
 * @query {string} sortBy - Sort field: "name", "stock", "value", "turnover", "lastMovement"
 * @query {string} sortOrder - Sort direction: "asc" or "desc"
 */
router.get("/", stockSummaryController.getStockSummary);

/**
 * @route GET /api/v1/stock-summary/movements/:productId
 * @desc Get stock movements for a specific product
 * @access Public
 * @param {string} productId - Product ID
 * @query {number} limit - Number of movements to retrieve (default: 50)
 */
router.get("/movements/:productId", stockSummaryController.getProductMovements);

/**
 * @route GET /api/v1/stock-summary/trends
 * @desc Get stock movement trends for analytics
 * @access Public
 * @query {number} days - Number of days to analyze (default: 7)
 */
router.get("/trends", stockSummaryController.getMovementTrends);

/**
 * @route GET /api/v1/stock-summary/category-distribution
 * @desc Get category-wise stock value distribution
 * @access Public
 */
router.get("/category-distribution", stockSummaryController.getCategoryDistribution);

module.exports = router;
