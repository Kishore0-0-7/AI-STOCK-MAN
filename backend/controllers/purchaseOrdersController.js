const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Purchase Orders Controller
 * Handles all purchase order operations including:
 * - Create, Read, Update, Delete purchase orders
 * - Manage purchase order items
 * - Update order status
 * - Get statistics and analytics
 */

// Get all purchase orders with filtering, sorting, and pagination
const getPurchaseOrders = async (req, res) => {
  try {
    console.log('🛒 Purchase Orders API called');
    console.log('📥 Request query params:', req.query);

    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      priority = 'all',
      supplier = 'all',
      sortBy = 'order_date',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log('📊 Parsed parameters:', {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      priority,
      supplier,
      sortBy,
      sortOrder,
      offset
    });

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    // Search filter
    if (search && search.trim() !== '') {
      whereClause += ` AND (po.order_number LIKE ? OR s.name LIKE ? OR po.notes LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Status filter
    if (status !== 'all') {
      whereClause += ` AND po.status = ?`;
      queryParams.push(status);
    }

    // Priority filter
    if (priority !== 'all') {
      whereClause += ` AND po.priority = ?`;
      queryParams.push(priority);
    }

    // Supplier filter
    if (supplier !== 'all') {
      whereClause += ` AND po.supplier_id = ?`;
      queryParams.push(supplier);
    }

    console.log('🔍 WHERE clause:', whereClause);
    console.log('📝 Query parameters before main query:', queryParams);

    // Valid sort columns
    const validSortColumns = {
      'order_date': 'po.order_date',
      'order_number': 'po.order_number',
      'supplier': 's.name',
      'total_amount': 'po.final_amount',
      'status': 'po.status',
      'priority': 'po.priority',
      'expected_delivery': 'po.expected_delivery_date'
    };

    const sortColumn = validSortColumns[sortBy] || 'po.order_date';
    const sortDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Main query to get purchase orders
    const mainQuery = `
      SELECT
        po.id,
        po.order_number,
        po.supplier_id,
        s.name as supplier_name,
        po.order_date,
        po.expected_delivery_date,
        po.actual_delivery_date,
        po.status,
        po.priority,
        po.total_amount,
        po.tax_amount,
        po.discount_amount,
        po.final_amount,
        po.payment_terms,
        po.delivery_address,
        po.notes,
        po.created_by,
        po.approved_by,
        po.approved_at,
        po.created_at,
        po.updated_at,
        
        -- Calculate item count
        COUNT(poi.id) as item_count,
        
        -- Calculate received items
        SUM(CASE WHEN poi.received_quantity > 0 THEN 1 ELSE 0 END) as items_received

      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      
      ${whereClause}
      
      GROUP BY po.id
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...queryParams, parseInt(limit), offset];
    console.log('🔍 Final SQL Query:', mainQuery);
    console.log('📝 Final parameters:', finalParams);

    console.log('⏳ Executing main purchase orders query...');
    const [orders] = await pool.query(mainQuery, finalParams);
    console.log('✅ Query executed successfully. Retrieved', orders.length, 'orders');

    if (orders.length > 0) {
      console.log('📦 First order sample:', {
        id: orders[0].id,
        order_number: orders[0].order_number,
        supplier_name: orders[0].supplier_name,
        status: orders[0].status,
        final_amount: orders[0].final_amount
      });
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT po.id) as total
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ${whereClause}
    `;

    console.log('⏳ Executing count query...');
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;
    console.log('📊 Total purchase orders found:', total);

    // Get statistics
    console.log('⏳ Executing stats query...');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN po.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN po.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN po.status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN po.status = 'received' THEN 1 ELSE 0 END) as received,
        SUM(CASE WHEN po.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN po.status != 'cancelled' THEN po.final_amount ELSE 0 END) as total_value,
        AVG(CASE WHEN po.status != 'cancelled' THEN po.final_amount ELSE NULL END) as avg_order_value
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ${whereClause}
    `;

    const [statsResult] = await pool.query(statsQuery, queryParams);
    const stats = statsResult[0];
    
    console.log('📈 Stats retrieved:', {
      total_orders: stats.total_orders,
      pending: stats.pending,
      approved: stats.approved,
      total_value: stats.total_value
    });

    // Get suppliers for filter dropdown
    console.log('⏳ Executing suppliers query...');
    const [suppliers] = await pool.query(`
      SELECT DISTINCT s.id, s.name 
      FROM suppliers s 
      INNER JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE s.status = 'active'
      ORDER BY s.name
    `);
    console.log('🏢 Suppliers found:', suppliers.length);

    // Format orders data
    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_number: order.order_number,
      supplier_id: order.supplier_id,
      supplier_name: order.supplier_name,
      total_amount: parseFloat(order.final_amount || order.total_amount || 0),
      order_date: order.order_date,
      expected_delivery_date: order.expected_delivery_date,
      actual_delivery_date: order.actual_delivery_date,
      status: order.status,
      priority: order.priority,
      notes: order.notes,
      created_by: order.created_by,
      item_count: parseInt(order.item_count || 0),
      items_received: parseInt(order.items_received || 0),
      payment_terms: order.payment_terms,
      delivery_address: order.delivery_address,
      approved_by: order.approved_by,
      approved_at: order.approved_at,
      created_at: order.created_at,
      updated_at: order.updated_at
    }));

    console.log('🔄 Formatted orders count:', formattedOrders.length);
    if (formattedOrders.length > 0) {
      console.log('📦 Sample formatted order:', {
        id: formattedOrders[0].id,
        order_number: formattedOrders[0].order_number,
        supplier_name: formattedOrders[0].supplier_name,
        total_amount: formattedOrders[0].total_amount,
        status: formattedOrders[0].status
      });
    }

    // Prepare response
    const response = {
      orders: formattedOrders,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_orders: total,
        orders_per_page: parseInt(limit)
      },
      stats: {
        total: parseInt(stats.total_orders || 0),
        pending: parseInt(stats.pending || 0),
        approved: parseInt(stats.approved || 0),
        shipped: parseInt(stats.shipped || 0),
        received: parseInt(stats.received || 0),
        cancelled: parseInt(stats.cancelled || 0),
        totalValue: parseFloat(stats.total_value || 0),
        avgOrderValue: parseFloat(stats.avg_order_value || 0)
      },
      suppliers: suppliers
    };

    console.log('📤 Sending response with data:', {
      ordersCount: response.orders.length,
      total: response.pagination.total_orders,
      suppliersCount: response.suppliers.length,
      stats: response.stats
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error in getPurchaseOrders:', error);
    res.status(500).json({
      error: 'Failed to fetch purchase orders',
      message: error.message
    });
  }
};

// Get purchase order by ID with items
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting purchase order by ID:', id);

    // Get purchase order details
    const orderQuery = `
      SELECT 
        po.*,
        s.name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.address as supplier_address
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `;

    const [orderResult] = await pool.query(orderQuery, [id]);

    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const order = orderResult[0];

    // Get order items
    const itemsQuery = `
      SELECT 
        poi.*,
        p.name as product_name,
        p.sku,
        p.unit
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = ?
      ORDER BY poi.created_at
    `;

    const [items] = await pool.query(itemsQuery, [id]);

    // Format response
    const response = {
      id: order.id,
      order_number: order.order_number,
      supplier_id: order.supplier_id,
      supplier_name: order.supplier_name,
      supplier_email: order.supplier_email,
      supplier_phone: order.supplier_phone,
      supplier_address: order.supplier_address,
      order_date: order.order_date,
      expected_delivery_date: order.expected_delivery_date,
      actual_delivery_date: order.actual_delivery_date,
      status: order.status,
      priority: order.priority,
      total_amount: parseFloat(order.total_amount || 0),
      tax_amount: parseFloat(order.tax_amount || 0),
      discount_amount: parseFloat(order.discount_amount || 0),
      final_amount: parseFloat(order.final_amount || 0),
      payment_terms: order.payment_terms,
      delivery_address: order.delivery_address,
      notes: order.notes,
      created_by: order.created_by,
      approved_by: order.approved_by,
      approved_at: order.approved_at,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || item.product_name,
        sku: item.sku,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price),
        received_quantity: item.received_quantity,
        quality_status: item.quality_status,
        delivery_date: item.delivery_date,
        notes: item.notes
      }))
    };

    console.log('✅ Purchase order retrieved:', order.order_number);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in getPurchaseOrderById:', error);
    res.status(500).json({
      error: 'Failed to fetch purchase order',
      message: error.message
    });
  }
};

// Create new purchase order
const createPurchaseOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('🆕 Creating new purchase order');

    const {
      supplier_id,
      expected_delivery_date,
      priority = 'medium',
      payment_terms,
      delivery_address,
      notes,
      created_by,
      items = []
    } = req.body;

    // Validate required fields
    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Supplier ID and at least one item are required'
      });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(connection);
    const orderId = uuidv4();

    console.log('📝 Generated order number:', orderNumber);

    // Calculate totals
    let totalAmount = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    for (const item of items) {
      totalAmount += parseFloat(item.total_price || 0);
    }

    const finalAmount = totalAmount + taxAmount - discountAmount;

    // Insert purchase order
    const orderInsertQuery = `
      INSERT INTO purchase_orders (
        id, order_number, supplier_id, order_date, expected_delivery_date,
        status, priority, total_amount, tax_amount, discount_amount,
        final_amount, payment_terms, delivery_address, notes, created_by
      ) VALUES (?, ?, ?, CURDATE(), ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(orderInsertQuery, [
      orderId, orderNumber, supplier_id, expected_delivery_date,
      priority, totalAmount, taxAmount, discountAmount, finalAmount,
      payment_terms, delivery_address, notes, created_by
    ]);

    console.log('✅ Purchase order created with ID:', orderId);

    // Insert order items
    for (const item of items) {
      const itemId = uuidv4();
      const itemInsertQuery = `
        INSERT INTO purchase_order_items (
          id, purchase_order_id, product_id, product_name,
          quantity, unit_price, total_price, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(itemInsertQuery, [
        itemId, orderId, item.product_id, item.product_name,
        item.quantity, item.unit_price, item.total_price, item.notes || null
      ]);
    }

    console.log('✅ Added', items.length, 'items to purchase order');

    await connection.commit();

    // Get the created order
    const createdOrder = await getPurchaseOrderDetails(orderId);

    res.status(201).json({
      message: 'Purchase order created successfully',
      order: createdOrder
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error in createPurchaseOrder:', error);
    res.status(500).json({
      error: 'Failed to create purchase order',
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// Update purchase order status
const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by, notes } = req.body;

    console.log('🔄 Updating purchase order status:', { id, status, approved_by });

    // Validate status
    const validStatuses = ['draft', 'pending', 'approved', 'shipped', 'received', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updateQuery = `
      UPDATE purchase_orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
    `;
    let params = [status];

    // Add approval info if approved
    if (status === 'approved' && approved_by) {
      updateQuery += `, approved_by = ?, approved_at = CURRENT_TIMESTAMP`;
      params.push(approved_by);
    }

    // Add notes if provided
    if (notes) {
      updateQuery += `, notes = ?`;
      params.push(notes);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    console.log('✅ Purchase order status updated successfully');

    // Get updated order
    const updatedOrder = await getPurchaseOrderDetails(id);

    res.json({
      message: 'Purchase order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('❌ Error in updatePurchaseOrderStatus:', error);
    res.status(500).json({
      error: 'Failed to update purchase order status',
      message: error.message
    });
  }
};

// Delete purchase order
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting purchase order:', id);

    // Check if order exists and get status
    const [orderCheck] = await pool.query(
      'SELECT status FROM purchase_orders WHERE id = ?',
      [id]
    );

    if (orderCheck.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Don't allow deletion of received or completed orders
    const status = orderCheck[0].status;
    if (['received', 'completed'].includes(status)) {
      return res.status(400).json({
        error: `Cannot delete ${status} purchase orders`
      });
    }

    // Delete purchase order (items will be deleted due to CASCADE)
    const [result] = await pool.query(
      'DELETE FROM purchase_orders WHERE id = ?',
      [id]
    );

    console.log('✅ Purchase order deleted successfully');

    res.json({
      message: 'Purchase order deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in deletePurchaseOrder:', error);
    res.status(500).json({
      error: 'Failed to delete purchase order',
      message: error.message
    });
  }
};

// Helper function to generate order number
const generateOrderNumber = async (connection) => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get the count of orders this month
  const [countResult] = await connection.execute(`
    SELECT COUNT(*) as count 
    FROM purchase_orders 
    WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
  `, [year, new Date().getMonth() + 1]);

  const count = countResult[0].count + 1;
  return `PO-${year}-${month}-${String(count).padStart(4, '0')}`;
};

// Helper function to get purchase order details
const getPurchaseOrderDetails = async (orderId) => {
  const [orderResult] = await pool.query(`
    SELECT 
      po.*,
      s.name as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.id = ?
  `, [orderId]);

  if (orderResult.length === 0) return null;

  const order = orderResult[0];

  // Get items
  const [items] = await pool.query(`
    SELECT * FROM purchase_order_items WHERE purchase_order_id = ?
  `, [orderId]);

  return {
    ...order,
    items: items.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price)
    }))
  };
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder
};
