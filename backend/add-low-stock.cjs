const db = require('./config/db.cjs');

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
  
  const updates = [
    { id: 9, stock: 2 },    // Notebook Set (threshold: 30)
    { id: 11, stock: 3 },   // Laptop Stand (threshold: 15) 
    { id: 12, stock: 5 },   // Organic Honey (threshold: 20)
    { id: 1, stock: 3 },    // Premium Coffee Beans (threshold: 20)
    { id: 6, stock: 2 },    // Smartphone Cases (threshold: 20)
    { id: 8, stock: 4 },    // USB Cables (threshold: 25)
  ];
  
  let count = 0;
  
  updates.forEach(update => {
    db.query(
      'UPDATE products SET current_stock = ?, alert_status = ?, updated_at = NOW() WHERE id = ?',
      [update.stock, 'active', update.id],
      (err, result) => {
        count++;
        if (err) {
          console.error(`Error updating product ${update.id}:`, err);
        } else {
          console.log(`Updated product ${update.id} to stock ${update.stock}`);
        }
        
        if (count === updates.length) {
          console.log('All updates completed');
          process.exit(0);
        }
      }
    );
  });
});
