const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');

// Get all low stock alerts
router.get('/low-stock', (req, res) => {
  const query = `
    SELECT 
      p.*,
      s.name as supplier_name,
      s.email as supplier_email,
      s.phone as supplier_phone,
      CASE 
        WHEN p.current_stock = 0 THEN 'Out of Stock'
        WHEN p.current_stock <= (p.low_stock_threshold * 0.3) THEN 'Critical'
        WHEN p.current_stock <= (p.low_stock_threshold * 0.6) THEN 'Low'
        ELSE 'Warning'
      END as stock_status,
      TIMESTAMPDIFF(HOUR, p.low_stock_alert_time, NOW()) as hours_since_alert
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.current_stock <= p.low_stock_threshold
    AND p.alert_status = 'active'
    AND p.low_stock_alert_time IS NOT NULL
    ORDER BY p.alert_priority DESC, p.current_stock ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching low stock alerts:', err);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }
    
    const alerts = results.map(item => ({
      id: item.id.toString(),
      name: item.name,
      currentStock: item.current_stock,
      threshold: item.low_stock_threshold,
      category: item.category,
      qrCode: item.qr_code,
      priority: item.alert_priority,
      stockStatus: item.stock_status,
      alertTime: item.hours_since_alert 
        ? `${item.hours_since_alert} hours ago`
        : 'Just now',
      supplier: {
        name: item.supplier_name || 'Unknown Supplier',
        email: item.supplier_email || '',
        phone: item.supplier_phone || ''
      },
      price: parseFloat(item.price),
      unit: item.unit || 'piece'
    }));
    
    res.json(alerts);
  });
});

// Ignore an alert
router.post('/ignore', (req, res) => {
  const { productId, reason } = req.body;
  
  // Use the stored procedure to ignore the alert
  const query = 'CALL IgnoreAlert(?, ?, ?)';
  
  db.query(query, [productId, reason || 'No reason provided', 'Admin'], (err, result) => {
    if (err) {
      console.error('Error ignoring alert:', err);
      return res.status(500).json({ error: 'Failed to ignore alert' });
    }
    
    res.json({ success: true, message: 'Alert ignored successfully' });
  });
});

// Get ignored alerts
router.get('/ignored', (req, res) => {
  const query = 'CALL GetIgnoredAlerts()';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching ignored alerts:', err);
      return res.status(500).json({ error: 'Failed to fetch ignored alerts' });
    }
    
    // Results from stored procedure are in results[0]
    const ignoredAlerts = results[0].map(item => ({
      id: item.id.toString(),
      name: item.product_name,
      currentStock: item.current_stock,
      threshold: item.low_stock_threshold,
      category: item.category,
      priority: 'low', // Ignored alerts are low priority
      reason: item.reason,
      ignoredAt: new Date(item.ignored_at).toLocaleString(),
      ignoredBy: item.ignored_by
    }));
    
    res.json(ignoredAlerts);
  });
});

// Create purchase order
router.post('/purchase-order', (req, res) => {
  const { productId, quantity, notes } = req.body;
  
  // Use the stored procedure to create purchase order
  const query = 'CALL CreatePurchaseOrder(?, ?, ?, ?, @po_number)';
  
  db.query(query, [productId, quantity, notes || '', 'System'], (err) => {
    if (err) {
      console.error('Error creating purchase order:', err);
      return res.status(500).json({ error: 'Failed to create purchase order' });
    }
    
    // Get the generated PO number
    db.query('SELECT @po_number as po_number', (selectErr, selectResults) => {
      if (selectErr) {
        console.error('Error getting PO number:', selectErr);
        return res.status(500).json({ error: 'Failed to get PO number' });
      }
      
      const poNumber = selectResults[0].po_number;
      
      // Get the created PO details
      db.query(
        'SELECT * FROM purchase_orders WHERE po_number = ?',
        [poNumber],
        (poErr, poResults) => {
          if (poErr || poResults.length === 0) {
            console.error('Error fetching created PO:', poErr);
            return res.status(500).json({ error: 'Failed to fetch created PO' });
          }
          
          const po = poResults[0];
          res.json({
            success: true,
            poNumber: po.po_number,
            poId: po.id,
            totalAmount: parseFloat(po.total_amount)
          });
        }
      );
    });
  });
});

// Get resolved alerts (purchase orders)
router.get('/resolved', (req, res) => {
  const query = 'CALL GetResolvedAlerts()';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching resolved alerts:', err);
      return res.status(500).json({ error: 'Failed to fetch resolved alerts' });
    }
    
    // Results from stored procedure are in results[0]
    const resolvedAlerts = results[0].map(item => ({
      id: item.id.toString(),
      name: item.product_name,
      category: item.category,
      resolvedAt: new Date(item.resolved_at).toLocaleString(),
      poNumber: item.po_number,
      quantityOrdered: item.quantity_ordered,
      unitPrice: parseFloat(item.unit_price),
      totalAmount: parseFloat(item.total_amount),
      status: item.status,
      supplier: item.supplier_name || 'Unknown Supplier'
    }));
    
    res.json(resolvedAlerts);
  });
});

// Send purchase order to supplier
router.post('/send-po', (req, res) => {
  const { poId, method, recipientInfo } = req.body;
  
  // In a real application, this would integrate with email/SMS services
  // For now, we'll just log the action and update the PO status
  
  const query = `
    UPDATE purchase_orders 
    SET 
      sent_method = ?,
      sent_to = ?,
      sent_at = NOW(),
      status = 'sent'
    WHERE id = ?
  `;
  
  db.query(query, [method, recipientInfo, poId], (err) => {
    if (err) {
      console.error('Error updating PO send status:', err);
      return res.status(500).json({ error: 'Failed to update send status' });
    }
    
    // Here you would integrate with actual email/SMS services
    console.log(`PO ${poId} sent via ${method} to ${recipientInfo}`);
    
    res.json({ 
      success: true, 
      message: `Purchase order sent via ${method}` 
    });
  });
});

module.exports = router;
