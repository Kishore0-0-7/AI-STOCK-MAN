const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedOutboundData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'ai_stock_management'
  });

  try {
    // First, insert sample customers if they don't exist
    const customers = [
      {
        id: 'customer-001',
        name: 'Tata Motors Ltd',
        email: 'orders@tatamotors.com',
        phone: '+91-22-6665-8282',
        company: 'Tata Motors',
        customer_type: 'business'
      },
      {
        id: 'customer-002', 
        name: 'Bajaj Auto Ltd',
        email: 'procurement@bajajauto.com',
        phone: '+91-20-2681-2681',
        company: 'Bajaj Auto',
        customer_type: 'business'
      },
      {
        id: 'customer-003',
        name: 'Hero MotoCorp Ltd',
        email: 'supplies@heromotocorp.com', 
        phone: '+91-11-4604-4604',
        company: 'Hero MotoCorp',
        customer_type: 'business'
      },
      {
        id: 'customer-004',
        name: 'TVS Motor Company',
        email: 'orders@tvsmotor.com',
        phone: '+91-44-2819-5500',
        company: 'TVS Motor',
        customer_type: 'business'
      },
      {
        id: 'customer-005',
        name: 'Mahindra & Mahindra',
        email: 'purchasing@mahindra.com',
        phone: '+91-22-2490-1441',
        company: 'Mahindra Group',
        customer_type: 'business'
      }
    ];

    // Insert customers
    for (const customer of customers) {
      await connection.execute(
        `INSERT IGNORE INTO customers (id, name, email, phone, company, customer_type, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [customer.id, customer.name, customer.email, customer.phone, customer.company, customer.customer_type]
      );
    }

    // Insert sample customer orders
    const customerOrders = [
      {
        id: 'co-001',
        order_number: 'SO-2025-001',
        customer_id: 'customer-001',
        customer_name: 'Tata Motors Ltd',
        order_date: '2025-08-10',
        delivery_date: '2025-08-15',
        required_date: '2025-08-15',
        status: 'ready',
        priority: 'high',
        total_amount: 450000,
        final_amount: 450000,
        payment_status: 'pending'
      },
      {
        id: 'co-002',
        order_number: 'SO-2025-002', 
        customer_id: 'customer-002',
        customer_name: 'Bajaj Auto Ltd',
        order_date: '2025-08-12',
        delivery_date: '2025-08-18',
        required_date: '2025-08-16',
        status: 'preparing',
        priority: 'medium',
        total_amount: 280000,
        final_amount: 280000,
        payment_status: 'pending'
      },
      {
        id: 'co-003',
        order_number: 'SO-2025-003',
        customer_id: 'customer-003',
        customer_name: 'Hero MotoCorp Ltd',
        order_date: '2025-08-13',
        delivery_date: '2025-08-17',
        required_date: '2025-08-15',
        status: 'shipped',
        priority: 'high',
        total_amount: 320000,
        final_amount: 320000,
        payment_status: 'paid'
      },
      {
        id: 'co-004',
        order_number: 'SO-2025-004',
        customer_id: 'customer-004',
        customer_name: 'TVS Motor Company',
        order_date: '2025-08-11',
        delivery_date: '2025-08-14',
        required_date: '2025-08-14',
        status: 'delivered',
        priority: 'high',
        total_amount: 395000,
        final_amount: 395000,
        payment_status: 'paid'
      },
      {
        id: 'co-005',
        order_number: 'SO-2025-005',
        customer_id: 'customer-005',
        customer_name: 'Mahindra & Mahindra',
        order_date: '2025-08-14',
        delivery_date: '2025-08-20',
        required_date: '2025-08-18',
        status: 'confirmed',
        priority: 'medium',
        total_amount: 180000,
        final_amount: 180000,
        payment_status: 'pending'
      },
      {
        id: 'co-006',
        order_number: 'SO-2025-006',
        customer_id: 'customer-001',
        customer_name: 'Tata Motors Ltd',
        order_date: '2025-08-08',
        delivery_date: '2025-08-13',
        required_date: '2025-08-13',
        status: 'delivered',
        priority: 'medium',
        total_amount: 520000,
        final_amount: 520000,
        payment_status: 'paid'
      }
    ];

    // Insert customer orders
    for (const order of customerOrders) {
      await connection.execute(
        `INSERT IGNORE INTO customer_orders 
         (id, order_number, customer_id, customer_name, order_date, delivery_date, required_date, 
          status, priority, total_amount, final_amount, payment_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id, order.order_number, order.customer_id, order.customer_name,
          order.order_date, order.delivery_date, order.required_date,
          order.status, order.priority, order.total_amount, order.final_amount, order.payment_status
        ]
      );
    }

    // Get existing product IDs to use in order items
    const [products] = await connection.execute('SELECT id FROM products LIMIT 5');
    const productIds = products.map(p => p.id);

    // Insert customer order items
    const orderItems = [];
    customerOrders.forEach((order, orderIndex) => {
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      for (let i = 0; i < numItems; i++) {
        const productId = productIds[i % productIds.length];
        const quantity = Math.floor(Math.random() * 100) + 50; // 50-150 quantity
        const unitPrice = Math.floor(Math.random() * 1000) + 500; // 500-1500 price
        
        orderItems.push({
          id: `coi-${orderIndex + 1}-${i + 1}`,
          order_id: order.id,
          product_id: productId,
          product_name: `Product ${i + 1}`,
          product_sku: `SKU-${i + 1}`,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
          allocated_quantity: quantity,
          dispatched_quantity: order.status === 'delivered' || order.status === 'shipped' ? quantity : 0
        });
      }
    });

    // Insert order items
    for (const item of orderItems) {
      await connection.execute(
        `INSERT IGNORE INTO customer_order_items 
         (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, 
          allocated_quantity, dispatched_quantity) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id, item.order_id, item.product_id, item.product_name, item.product_sku,
          item.quantity, item.unit_price, item.total_price, item.allocated_quantity, item.dispatched_quantity
        ]
      );
    }

    console.log('✅ Outbound sample data inserted successfully!');
    console.log(`- Inserted ${customers.length} customers`);
    console.log(`- Inserted ${customerOrders.length} customer orders`);
    console.log(`- Inserted ${orderItems.length} order items`);
    
  } catch (error) {
    console.error('❌ Error seeding outbound data:', error);
  } finally {
    await connection.end();
  }
}

seedOutboundData();
