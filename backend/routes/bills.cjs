const express = require('express');
const db = require('../config/db.cjs');
const router = express.Router();

// Create a bill with items
router.post('/', (req, res) => {
  const { customer_id, subtotal, gst, total, items } = req.body;
  db.query(
    'INSERT INTO bills (customer_id, subtotal, gst, total) VALUES (?, ?, ?, ?)',
    [customer_id, subtotal, gst, total],
    (err, billResult) => {
      if (err) return res.status(500).json({ error: err });
      const bill_id = billResult.insertId;
      const billItems = items.map(item => [
        bill_id, item.product_id, item.quantity, item.price, item.total
      ]);
      db.query(
        'INSERT INTO bill_items (bill_id, product_id, quantity, price, total) VALUES ?',
        [billItems],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2 });
          res.json({ bill_id });
        }
      );
    }
  );
});

// Get all bills with customer and items
router.get('/', (req, res) => {
  db.query(
    `SELECT b.*, c.name as customer_name, c.phone, c.email, c.address
     FROM bills b
     LEFT JOIN customers c ON b.customer_id = c.id
     ORDER BY b.date DESC`,
    (err, bills) => {
      if (err) return res.status(500).json({ error: err });
      // Get items for each bill
      const billIds = bills.map(b => b.id);
      if (billIds.length === 0) return res.json([]);
      db.query(
        'SELECT * FROM bill_items WHERE bill_id IN (?)',
        [billIds],
        (err2, items) => {
          if (err2) return res.status(500).json({ error: err2 });
          // Attach items to bills
          const itemsByBill = {};
          items.forEach(item => {
            if (!itemsByBill[item.bill_id]) itemsByBill[item.bill_id] = [];
            itemsByBill[item.bill_id].push(item);
          });
          const result = bills.map(bill => ({
            ...bill,
            items: itemsByBill[bill.id] || []
          }));
          res.json(result);
        }
      );
    }
  );
});

module.exports = router; 