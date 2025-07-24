const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'Stock'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Get all products
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Add a product
app.post('/api/products', (req, res) => {
  const product = req.body;
  db.query('INSERT INTO products SET ?', product, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ id: result.insertId, ...product });
  });
});

// Update a product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const product = req.body;
  db.query('UPDATE products SET ? WHERE id = ?', [product, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ id, ...product });
  });
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM products WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 