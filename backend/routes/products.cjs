const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');

// Get all products with supplier information
router.get('/', (req, res) => {
  const query = `
    SELECT 
      p.*,
      s.name as supplier_name,
      s.email as supplier_email,
      s.phone as supplier_phone,
      CASE 
        WHEN p.current_stock = 0 THEN 'Out of Stock'
        WHEN p.current_stock <= p.low_stock_threshold THEN 'Low Stock'
        WHEN p.current_stock <= (p.max_stock_level * 0.2) THEN 'Low'
        WHEN p.current_stock >= (p.max_stock_level * 0.8) THEN 'High'
        ELSE 'Normal'
      END as stock_status
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.name ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    
    const products = results.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      currentStock: item.current_stock,
      lowStockThreshold: item.low_stock_threshold,
      maxStockLevel: item.max_stock_level,
      reorderPoint: item.reorder_point,
      unit: item.unit,
      qrCode: item.qr_code,
      alertStatus: item.alert_status,
      alertPriority: item.alert_priority,
      stockStatus: item.stock_status,
      supplier: {
        id: item.supplier_id,
        name: item.supplier_name || 'No Supplier',
        email: item.supplier_email || '',
        phone: item.supplier_phone || ''
      },
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
    
    res.json(products);
  });
});

// Get single product by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      p.*,
      s.name as supplier_name,
      s.email as supplier_email,
      s.phone as supplier_phone
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const item = results[0];
    const product = {
      id: item.id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      currentStock: item.current_stock,
      lowStockThreshold: item.low_stock_threshold,
      maxStockLevel: item.max_stock_level,
      reorderPoint: item.reorder_point,
      unit: item.unit,
      qrCode: item.qr_code,
      alertStatus: item.alert_status,
      alertPriority: item.alert_priority,
      supplier: {
        id: item.supplier_id,
        name: item.supplier_name || 'No Supplier',
        email: item.supplier_email || '',
        phone: item.supplier_phone || ''
      },
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
    
    res.json(product);
  });
});

// Create new product
router.post('/', (req, res) => {
  const {
    name,
    category,
    price,
    currentStock,
    lowStockThreshold,
    maxStockLevel,
    reorderPoint,
    unit,
    qrCode,
    supplierId
  } = req.body;
  
  // Validate required fields
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }
  
  const query = `
    INSERT INTO products (
      name, category, price, current_stock, low_stock_threshold,
      max_stock_level, reorder_point, unit, qr_code, supplier_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    name,
    category,
    price,
    currentStock || 0,
    lowStockThreshold || 10,
    maxStockLevel || 1000,
    reorderPoint || 0,
    unit || 'piece',
    qrCode || null,
    supplierId || null
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error creating product:', err);
      return res.status(500).json({ error: 'Failed to create product' });
    }
    
    // Return the created product
    res.status(201).json({
      id: result.insertId,
      name,
      category,
      price: parseFloat(price),
      currentStock: currentStock || 0,
      lowStockThreshold: lowStockThreshold || 10,
      maxStockLevel: maxStockLevel || 1000,
      reorderPoint: reorderPoint || 0,
      unit: unit || 'piece',
      qrCode,
      supplierId
    });
  });
});

// Update product
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    price,
    currentStock,
    lowStockThreshold,
    maxStockLevel,
    reorderPoint,
    unit,
    qrCode,
    supplierId
  } = req.body;
  
  const query = `
    UPDATE products SET
      name = ?, category = ?, price = ?, current_stock = ?,
      low_stock_threshold = ?, max_stock_level = ?, reorder_point = ?,
      unit = ?, qr_code = ?, supplier_id = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  const values = [
    name, category, price, currentStock, lowStockThreshold,
    maxStockLevel, reorderPoint, unit, qrCode, supplierId, id
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating product:', err);
      return res.status(500).json({ error: 'Failed to update product' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      id: parseInt(id),
      name,
      category,
      price: parseFloat(price),
      currentStock,
      lowStockThreshold,
      maxStockLevel,
      reorderPoint,
      unit,
      qrCode,
      supplierId
    });
  });
});

// Delete product
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  });
});

// Update stock level (for stock management)
router.patch('/:id/stock', (req, res) => {
  const { id } = req.params;
  const { currentStock, reason } = req.body;
  
  if (currentStock === undefined) {
    return res.status(400).json({ error: 'Current stock is required' });
  }
  
  const query = 'UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ?';
  
  db.query(query, [currentStock, id], (err, result) => {
    if (err) {
      console.error('Error updating stock:', err);
      return res.status(500).json({ error: 'Failed to update stock' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Log the stock change in alert history if needed
    if (reason) {
      const historyQuery = `
        INSERT INTO alert_history (product_id, action, stock_level, notes, performed_by)
        VALUES (?, 'stock_updated', ?, ?, 'System')
      `;
      
      db.query(historyQuery, [id, currentStock, reason], (historyErr) => {
        if (historyErr) {
          console.error('Error logging stock change:', historyErr);
        }
      });
    }
    
    res.json({ success: true, message: 'Stock updated successfully' });
  });
});

// Get products by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  
  const query = `
    SELECT 
      p.*,
      s.name as supplier_name
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.category = ?
    ORDER BY p.name ASC
  `;
  
  db.query(query, [category], (err, results) => {
    if (err) {
      console.error('Error fetching products by category:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    
    res.json(results);
  });
});

// Get low stock products
router.get('/low-stock/list', (req, res) => {
  const query = `
    SELECT 
      p.*,
      s.name as supplier_name
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.current_stock <= p.low_stock_threshold
    ORDER BY p.current_stock ASC, p.alert_priority DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching low stock products:', err);
      return res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
    
    res.json(results);
  });
});

module.exports = router;
