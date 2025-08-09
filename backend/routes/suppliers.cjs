const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');

// Get all suppliers
router.get('/', (req, res) => {
  const query = `
    SELECT 
      s.*,
      COUNT(p.id) as product_count,
      SUM(CASE WHEN p.current_stock <= p.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_alerts
    FROM suppliers s
    LEFT JOIN products p ON s.id = p.supplier_id
    WHERE s.is_active = 1
    GROUP BY s.id
    ORDER BY s.name ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching suppliers:', err);
      return res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
    
    const suppliers = results.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      contactPerson: item.contact_person,
      website: item.website,
      taxNumber: item.tax_number,
      paymentTerms: item.payment_terms,
      isActive: item.is_active,
      notes: item.notes,
      productCount: item.product_count,
      lowStockAlerts: item.low_stock_alerts,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
    
    res.json(suppliers);
  });
});

// Get single supplier by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'SELECT * FROM suppliers WHERE id = ?';
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching supplier:', err);
      return res.status(500).json({ error: 'Failed to fetch supplier' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const item = results[0];
    const supplier = {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      contactPerson: item.contact_person,
      website: item.website,
      taxNumber: item.tax_number,
      paymentTerms: item.payment_terms,
      isActive: item.is_active,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
    
    res.json(supplier);
  });
});

// Create new supplier
router.post('/', (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    contactPerson,
    website,
    taxNumber,
    paymentTerms,
    notes
  } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Supplier name is required' });
  }
  
  const query = `
    INSERT INTO suppliers (
      name, email, phone, address, contact_person,
      website, tax_number, payment_terms, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    name,
    email || null,
    phone || null,
    address || null,
    contactPerson || null,
    website || null,
    taxNumber || null,
    paymentTerms || 30,
    notes || null
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error creating supplier:', err);
      return res.status(500).json({ error: 'Failed to create supplier' });
    }
    
    res.status(201).json({
      id: result.insertId,
      name,
      email,
      phone,
      address,
      contactPerson,
      website,
      taxNumber,
      paymentTerms: paymentTerms || 30,
      notes,
      isActive: true
    });
  });
});

// Update supplier
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    address,
    contactPerson,
    website,
    taxNumber,
    paymentTerms,
    isActive,
    notes
  } = req.body;
  
  const query = `
    UPDATE suppliers SET
      name = ?, email = ?, phone = ?, address = ?,
      contact_person = ?, website = ?, tax_number = ?,
      payment_terms = ?, is_active = ?, notes = ?,
      updated_at = NOW()
    WHERE id = ?
  `;
  
  const values = [
    name, email, phone, address, contactPerson,
    website, taxNumber, paymentTerms, isActive, notes, id
  ];
  
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating supplier:', err);
      return res.status(500).json({ error: 'Failed to update supplier' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({
      id: parseInt(id),
      name,
      email,
      phone,
      address,
      contactPerson,
      website,
      taxNumber,
      paymentTerms,
      isActive,
      notes
    });
  });
});

// Delete supplier (soft delete - set inactive)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Check if supplier has products
  db.query('SELECT COUNT(*) as product_count FROM products WHERE supplier_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error checking supplier products:', err);
      return res.status(500).json({ error: 'Failed to check supplier products' });
    }
    
    const productCount = results[0].product_count;
    
    if (productCount > 0) {
      // Soft delete - set inactive
      db.query('UPDATE suppliers SET is_active = 0, updated_at = NOW() WHERE id = ?', [id], (updateErr, updateResult) => {
        if (updateErr) {
          console.error('Error deactivating supplier:', updateErr);
          return res.status(500).json({ error: 'Failed to deactivate supplier' });
        }
        
        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Supplier not found' });
        }
        
        res.json({ 
          success: true, 
          message: 'Supplier deactivated (has associated products)',
          deactivated: true
        });
      });
    } else {
      // Hard delete if no products
      db.query('DELETE FROM suppliers WHERE id = ?', [id], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error('Error deleting supplier:', deleteErr);
          return res.status(500).json({ error: 'Failed to delete supplier' });
        }
        
        if (deleteResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Supplier not found' });
        }
        
        res.json({ 
          success: true, 
          message: 'Supplier deleted successfully',
          deleted: true
        });
      });
    }
  });
});

// Get products by supplier
router.get('/:id/products', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      p.*,
      CASE 
        WHEN p.current_stock = 0 THEN 'Out of Stock'
        WHEN p.current_stock <= p.low_stock_threshold THEN 'Low Stock'
        ELSE 'Normal'
      END as stock_status
    FROM products p
    WHERE p.supplier_id = ?
    ORDER BY p.name ASC
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching supplier products:', err);
      return res.status(500).json({ error: 'Failed to fetch supplier products' });
    }
    
    res.json(results);
  });
});

module.exports = router;
