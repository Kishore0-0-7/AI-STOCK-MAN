const express = require('express');
const db = require('./config/db.cjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Add more low stock items for testing (before other product routes)
app.post('/api/create-low-stock', (req, res) => {
  // Reset some products to active status and reduce their stock to create more low stock alerts
  const updates = [
    { id: 9, current_stock: 2, alert_status: 'active' },    // Notebook Set (threshold: 30)
    { id: 11, current_stock: 3, alert_status: 'active' },   // Laptop Stand (threshold: 15) 
    { id: 12, current_stock: 5, alert_status: 'active' },   // Organic Honey (threshold: 20)
    { id: 1, current_stock: 3, alert_status: 'active' },    // Premium Coffee Beans (threshold: 20)
    { id: 6, current_stock: 2, alert_status: 'active' },    // Smartphone Cases (threshold: 20)
    { id: 8, current_stock: 4, alert_status: 'active' },    // USB Cables (threshold: 25)
  ];
  
  let completed = 0;
  let errors = [];
  
  updates.forEach(update => {
    db.query(
      'UPDATE products SET current_stock = ?, alert_status = ?, updated_at = NOW() WHERE id = ?',
      [update.current_stock, update.alert_status, update.id],
      (err, result) => {
        completed++;
        if (err) {
          errors.push(`Failed to update product ${update.id}: ${err.message}`);
        }
        
        if (completed === updates.length) {
          if (errors.length > 0) {
            res.status(500).json({ error: 'Some updates failed', details: errors });
          } else {
            res.json({ 
              success: true, 
              message: `Updated ${updates.length} products to create more low stock alerts`,
              updated_products: updates.length
            });
          }
        }
      }
    );
  });
});

// Products route
const productsRouter = require('./routes/products.cjs');
app.use('/api/products', productsRouter);

// Suppliers route
const suppliersRouter = require('./routes/suppliers.cjs');
app.use('/api/suppliers', suppliersRouter);

// Customers route
const customersRouter = require('./routes/customers.cjs');
app.use('/api/customers', customersRouter);

// Bills API - direct implementation
app.get('/api/bills', (req, res) => {
  db.query('SELECT * FROM bills ORDER BY date DESC', (err, bills) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(bills || []);
  });
});

app.post('/api/bills', (req, res) => {
  const { customer_id, subtotal, gst, total, items } = req.body;
  const billNumber = `BILL${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  db.query(
    'INSERT INTO bills (customer_id, bill_number, subtotal, gst, total) VALUES (?, ?, ?, ?, ?)',
    [customer_id, billNumber, subtotal, gst, total],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ bill_id: result.insertId, bill_number: billNumber });
    }
  );
});

// Alerts API - direct implementation
app.get('/api/alerts/low-stock', (req, res) => {
  const query = `
    SELECT 
      p.id, p.name, p.category, p.current_stock, p.low_stock_threshold,
      p.qr_code, p.unit, p.supplier_id, p.alert_priority, p.updated_at,
      s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone,
      CASE 
        WHEN p.current_stock = 0 THEN 'Out of Stock'
        WHEN p.current_stock <= (p.low_stock_threshold * 0.3) THEN 'Critical'
        WHEN p.current_stock <= (p.low_stock_threshold * 0.6) THEN 'Low'
        ELSE 'Warning'
      END as stock_status
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.current_stock <= p.low_stock_threshold 
      AND p.alert_status != 'ignored' 
      AND p.alert_status != 'resolved'
    ORDER BY 
      CASE p.alert_priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
      END,
      p.current_stock ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching low stock alerts:', err);
      return res.status(500).json({ error: 'Failed to fetch low stock alerts', details: err.message });
    }
    res.json(results || []);
  });
});

// Purchase Orders API
app.post('/api/purchase-orders', (req, res) => {
  const { 
    supplier_id, 
    expected_delivery_date, 
    items = [], 
    total_amount = 0,
    alert_ids = []
  } = req.body;

  if (!supplier_id || items.length === 0) {
    return res.status(400).json({ error: 'Supplier and items are required' });
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ error: 'Failed to start transaction' });
    }

    // Create purchase order
    const poNumber = `PO${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    db.query(
      'INSERT INTO purchase_orders (po_number, supplier_id, expected_delivery_date, total_amount, status) VALUES (?, ?, ?, ?, ?)',
      [poNumber, supplier_id, expected_delivery_date, total_amount, 'pending'],
      (err, poResult) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error creating purchase order:', err);
            res.status(500).json({ error: 'Failed to create purchase order' });
          });
        }

        const poId = poResult.insertId;
        let itemsProcessed = 0;
        let hasError = false;

        // Process each item
        items.forEach(item => {
          db.query(
            'INSERT INTO purchase_order_items (po_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
            [poId, item.product_id, item.quantity, item.unit_price],
            (err) => {
              if (err && !hasError) {
                hasError = true;
                return db.rollback(() => {
                  console.error('Error adding PO item:', err);
                  res.status(500).json({ error: 'Failed to add purchase order items' });
                });
              }

              itemsProcessed++;
              
              if (itemsProcessed === items.length && !hasError) {
                // Update alert statuses to resolved if alert_ids provided
                if (alert_ids && alert_ids.length > 0) {
                  const placeholders = alert_ids.map(() => '?').join(',');
                  db.query(
                    `UPDATE products SET alert_status = 'resolved', updated_at = NOW() WHERE id IN (${placeholders})`,
                    alert_ids,
                    (err) => {
                      if (err) {
                        console.log('Warning: Failed to update alert statuses:', err);
                      }
                      
                      // Commit transaction
                      db.commit((err) => {
                        if (err) {
                          return db.rollback(() => {
                            console.error('Commit error:', err);
                            res.status(500).json({ error: 'Failed to finalize purchase order' });
                          });
                        }
                        
                        res.json({
                          success: true,
                          po_id: poId,
                          po_number: poNumber,
                          message: 'Purchase order created successfully'
                        });
                      });
                    }
                  );
                } else {
                  // Commit transaction without updating alerts
                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => {
                        console.error('Commit error:', err);
                        res.status(500).json({ error: 'Failed to finalize purchase order' });
                      });
                    }
                    
                    res.json({
                      success: true,
                      po_id: poId,
                      po_number: poNumber,
                      message: 'Purchase order created successfully'
                    });
                  });
                }
              }
            }
          );
        });
      }
    );
  });
});

app.get('/api/alerts/ignored', (req, res) => {
  const query = `
    SELECT p.id, p.name, p.category, p.price, p.current_stock, p.low_stock_threshold,
           p.qr_code, p.unit, p.supplier_id, p.alert_priority,
           p.updated_at as ignored_at,
           s.name as supplier_name
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.alert_status = 'ignored'
    ORDER BY p.updated_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching ignored alerts:', err);
      return res.status(500).json({ error: 'Failed to fetch ignored alerts', details: err.message });
    }
    res.json(results || []);
  });
});

app.post('/api/alerts/ignore', (req, res) => {
  const { productId, reason } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  // Update the product's alert status to 'ignored'
  db.query(
    'UPDATE products SET alert_status = ?, updated_at = NOW() WHERE id = ?',
    ['ignored', productId],
    (err, result) => {
      if (err) {
        console.error('Error ignoring alert:', err);
        return res.status(500).json({ error: 'Failed to ignore alert', details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Alert ignored successfully',
        productId,
        reason 
      });
    }
  );
});

app.post('/api/alerts/resolve', (req, res) => {
  const { productId, reason } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  // Update the product's alert status to 'resolved'
  db.query(
    'UPDATE products SET alert_status = ?, updated_at = NOW() WHERE id = ?',
    ['resolved', productId],
    (err, result) => {
      if (err) {
        console.error('Error resolving alert:', err);
        return res.status(500).json({ error: 'Failed to resolve alert', details: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Alert resolved successfully',
        productId,
        reason 
      });
    }
  );
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 