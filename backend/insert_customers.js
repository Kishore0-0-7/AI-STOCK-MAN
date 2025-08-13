const { executeQuery } = require("./config/db");

async function insertCustomerData() {
  try {
    console.log("Inserting sample customers...");

    // Insert customers
    const customerQueries = [
      `INSERT IGNORE INTO customers (name, email, phone, address, company, customer_type, status, credit_limit, payment_terms, notes) 
       VALUES ('Acme Corporation', 'purchasing@acme.com', '+1-555-1001', '100 Business Plaza, Corporate City, CA 90210', 'Acme Corporation', 'business', 'active', 50000.00, 'Net 30', 'Large corporate client with monthly orders')`,

      `INSERT IGNORE INTO customers (name, email, phone, address, customer_type, status, credit_limit, payment_terms, notes) 
       VALUES ('John Martinez', 'j.martinez@email.com', '+1-555-1003', '789 Residential St, Hometown, TX 75001', 'individual', 'active', 5000.00, 'Net 15', 'Regular individual customer, DIY projects')`,

      `INSERT IGNORE INTO customers (name, email, phone, address, company, customer_type, status, credit_limit, payment_terms, notes) 
       VALUES ('TechStart Inc', 'orders@techstart.com', '+1-555-1002', '200 Startup Ave, Innovation District, NY 10001', 'TechStart Inc', 'business', 'active', 25000.00, 'Net 15', 'Growing tech startup, frequent small orders')`,

      `INSERT IGNORE INTO customers (name, email, phone, address, customer_type, status, credit_limit, payment_terms, notes) 
       VALUES ('Sarah Chen', 's.chen@email.com', '+1-555-1005', '321 Maker Lane, Creative Town, WA 98001', 'individual', 'active', 3000.00, 'Net 15', 'Electronics hobbyist, regular component orders')`,
    ];

    for (const query of customerQueries) {
      await executeQuery(query, []);
    }

    console.log("Inserting sample customer orders...");

    // Insert customer orders
    const orderQueries = [
      `INSERT IGNORE INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, payment_method, payment_status, notes) 
       VALUES ('CO000001', 1, '2025-08-10', '2025-08-15', 'pending', 189.96, 'card', 'pending', 'First order from corporate customer')`,

      `INSERT IGNORE INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, payment_method, payment_status, notes) 
       VALUES ('CO000002', 2, '2025-08-09', '2025-08-14', 'confirmed', 79.99, 'cash', 'pending', 'Individual customer order')`,

      `INSERT IGNORE INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, payment_method, payment_status, notes) 
       VALUES ('CO000003', 3, '2025-08-08', '2025-08-13', 'preparing', 159.98, 'upi', 'paid', 'TechStart monthly order')`,

      `INSERT IGNORE INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, payment_method, payment_status, notes) 
       VALUES ('CO000004', 4, '2025-08-07', '2025-08-12', 'completed', 89.98, 'bank_transfer', 'paid', 'Electronics components order')`,
    ];

    for (const query of orderQueries) {
      await executeQuery(query, []);
    }

    // Get product and customer order IDs for order items
    const products = await executeQuery(
      "SELECT id, name, price FROM products LIMIT 4"
    );
    const orders = await executeQuery("SELECT id FROM customer_orders LIMIT 4");

    if (products.length > 0 && orders.length > 0) {
      console.log("Inserting sample customer order items...");

      // Insert order items
      const itemQueries = [
        `INSERT IGNORE INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES (${orders[0].id}, ${products[0].id}, 2, ${products[0].price}, ${
          products[0].price * 2
        })`,

        `INSERT IGNORE INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES (${orders[0].id}, ${products[1].id}, 1, ${products[1].price}, ${products[1].price})`,

        `INSERT IGNORE INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES (${orders[1].id}, ${products[0].id}, 1, ${products[0].price}, ${products[0].price})`,

        `INSERT IGNORE INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES (${orders[2].id}, ${products[1].id}, 2, ${products[1].price}, ${
          products[1].price * 2
        })`,

        `INSERT IGNORE INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES (${orders[3].id}, ${products[2].id}, 1, ${products[2].price}, ${products[2].price})`,
      ];

      for (const query of itemQueries) {
        await executeQuery(query, []);
      }
    }

    console.log("Customer data inserted successfully!");
  } catch (error) {
    console.error("Error inserting customer data:", error);
  } finally {
    process.exit(0);
  }
}

insertCustomerData();
