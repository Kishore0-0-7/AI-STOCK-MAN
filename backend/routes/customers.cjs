const express = require('express');
const db = require('../config/db.cjs');
const router = express.Router();

// Get all customers
router.get('/', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Add a customer
router.post('/', (req, res) => {
  const { name, phone, email, address } = req.body;
  db.query('INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
    [name, phone, email, address],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: result.insertId, name, phone, email, address });
    }
  );
});

// Update a customer
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address } = req.body;
  db.query('UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?',
    [name, phone, email, address, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id, name, phone, email, address });
    }
  );
});

// Delete a customer
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM customers WHERE id=?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

module.exports = router; 