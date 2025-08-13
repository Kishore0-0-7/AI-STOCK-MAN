const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder
} = require('../controllers/purchaseOrdersController');

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the purchase order
 *         order_number:
 *           type: string
 *           description: Auto-generated order number
 *         supplier_id:
 *           type: string
 *           description: ID of the supplier
 *         supplier_name:
 *           type: string
 *           description: Name of the supplier
 *         order_date:
 *           type: string
 *           format: date
 *           description: Date the order was created
 *         expected_delivery_date:
 *           type: string
 *           format: date
 *           description: Expected delivery date
 *         actual_delivery_date:
 *           type: string
 *           format: date
 *           description: Actual delivery date
 *         status:
 *           type: string
 *           enum: [draft, pending, approved, shipped, received, completed, cancelled]
 *           description: Current status of the order
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Priority level of the order
 *         total_amount:
 *           type: number
 *           description: Total order amount before tax and discount
 *         final_amount:
 *           type: number
 *           description: Final amount after tax and discount
 *         notes:
 *           type: string
 *           description: Additional notes for the order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseOrderItem'
 *     
 *     PurchaseOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the item
 *         product_id:
 *           type: string
 *           description: ID of the product
 *         product_name:
 *           type: string
 *           description: Name of the product
 *         quantity:
 *           type: integer
 *           description: Quantity ordered
 *         unit_price:
 *           type: number
 *           description: Price per unit
 *         total_price:
 *           type: number
 *           description: Total price for this item
 *         received_quantity:
 *           type: integer
 *           description: Quantity received
 *         quality_status:
 *           type: string
 *           enum: [pending, approved, rejected, hold]
 *           description: Quality check status
 */

/**
 * @swagger
 * /api/v1/purchase-orders:
 *   get:
 *     summary: Get all purchase orders with filtering and pagination
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for order number, supplier name, or notes
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, draft, pending, approved, shipped, received, completed, cancelled]
 *           default: all
 *         description: Filter by order status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, low, medium, high, urgent]
 *           default: all
 *         description: Filter by priority
 *       - in: query
 *         name: supplier
 *         schema:
 *           type: string
 *           default: all
 *         description: Filter by supplier ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [order_date, order_number, supplier, total_amount, status, priority, expected_delivery]
 *           default: order_date
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of purchase orders with pagination and statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PurchaseOrder'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_orders:
 *                       type: integer
 *                     orders_per_page:
 *                       type: integer
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                     approved:
 *                       type: integer
 *                     shipped:
 *                       type: integer
 *                     received:
 *                       type: integer
 *                     cancelled:
 *                       type: integer
 *                     totalValue:
 *                       type: number
 *                     avgOrderValue:
 *                       type: number
 *                 suppliers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/', getPurchaseOrders);

/**
 * @swagger
 * /api/v1/purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID with all items
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order details with items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getPurchaseOrderById);

/**
 * @swagger
 * /api/v1/purchase-orders:
 *   post:
 *     summary: Create a new purchase order
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier_id
 *               - items
 *             properties:
 *               supplier_id:
 *                 type: string
 *                 description: ID of the supplier
 *               expected_delivery_date:
 *                 type: string
 *                 format: date
 *                 description: Expected delivery date
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Priority level
 *               payment_terms:
 *                 type: string
 *                 description: Payment terms
 *               delivery_address:
 *                 type: string
 *                 description: Delivery address
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               created_by:
 *                 type: string
 *                 description: Name of the person creating the order
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - product_name
 *                     - quantity
 *                     - unit_price
 *                     - total_price
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       description: ID of the product
 *                     product_name:
 *                       type: string
 *                       description: Name of the product
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity to order
 *                     unit_price:
 *                       type: number
 *                       minimum: 0
 *                       description: Price per unit
 *                     total_price:
 *                       type: number
 *                       minimum: 0
 *                       description: Total price for this item
 *                     notes:
 *                       type: string
 *                       description: Item-specific notes
 *           example:
 *             supplier_id: "sup-001"
 *             expected_delivery_date: "2024-02-15"
 *             priority: "high"
 *             payment_terms: "NET_30"
 *             delivery_address: "Warehouse A, Industrial Area"
 *             notes: "Urgent requirement for production"
 *             created_by: "John Doe"
 *             items:
 *               - product_id: "prod-001"
 *                 product_name: "Steel Bars"
 *                 quantity: 100
 *                 unit_price: 150.00
 *                 total_price: 15000.00
 *                 notes: "Grade A quality required"
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', createPurchaseOrder);

/**
 * @swagger
 * /api/v1/purchase-orders/{id}/status:
 *   patch:
 *     summary: Update purchase order status
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, pending, approved, shipped, received, completed, cancelled]
 *                 description: New status for the order
 *               approved_by:
 *                 type: string
 *                 description: Name of the person approving (required for approved status)
 *               notes:
 *                 type: string
 *                 description: Additional notes for status change
 *           example:
 *             status: "approved"
 *             approved_by: "Manager Name"
 *             notes: "Approved for immediate processing"
 *     responses:
 *       200:
 *         description: Purchase order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', updatePurchaseOrderStatus);

/**
 * @swagger
 * /api/v1/purchase-orders/{id}:
 *   delete:
 *     summary: Delete a purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase order ID
 *     responses:
 *       200:
 *         description: Purchase order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete order (invalid status)
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deletePurchaseOrder);

module.exports = router;
