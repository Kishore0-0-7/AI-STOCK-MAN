const { pool } = require("./config/database");

async function addPurchaseOrders() {
  try {
    // Get supplier IDs
    const [suppliers] = await pool.execute("SELECT id FROM suppliers LIMIT 3");
    console.log("Found suppliers:", suppliers.length);

    // Add some purchase orders for each supplier
    for (let i = 0; i < suppliers.length; i++) {
      const supplierId = suppliers[i].id;

      // Add multiple orders per supplier
      for (let j = 0; j < 3; j++) {
        const orderValue = Math.floor(Math.random() * 500000) + 100000;
        const orderNumber = `PO-2024-${String(1001 + i * 3 + j).padStart(
          4,
          "0"
        )}`;
        const daysAgo = Math.floor(Math.random() * 90) + 1;

        try {
          await pool.execute(
            `
            INSERT INTO purchase_orders (supplier_id, order_number, total_amount, status, order_date) 
            VALUES (?, ?, ?, 'completed', DATE_SUB(NOW(), INTERVAL ? DAY))
          `,
            [supplierId, orderNumber, orderValue, daysAgo]
          );

          console.log(
            `Added purchase order ${orderNumber} for supplier ${supplierId}`
          );
        } catch (error) {
          console.log(`Order ${orderNumber} might already exist, skipping...`);
        }
      }
    }

    console.log("Purchase orders processing completed!");

    // Update supplier statistics
    await pool.execute(`
      UPDATE suppliers s 
      SET 
        total_orders = (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id),
        total_value = (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders po WHERE po.supplier_id = s.id)
    `);

    console.log("Supplier statistics updated!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

addPurchaseOrders();
