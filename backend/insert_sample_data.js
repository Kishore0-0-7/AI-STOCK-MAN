const { executeQuery } = require("./config/database");

async function insertSampleData() {
  try {
    console.log("Inserting sample suppliers...");

    // Insert suppliers (let MySQL auto-generate IDs)
    const supplierQueries = [
      "INSERT IGNORE INTO suppliers (name, email, phone, address, status) VALUES ('Tech Supply Co', 'orders@techsupply.com', '+1-555-0101', '123 Tech Street, CA', 'active')",
      "INSERT IGNORE INTO suppliers (name, email, phone, address, status) VALUES ('Office Depot Plus', 'procurement@officedepot.com', '+1-555-0102', '456 Office Ave, NY', 'active')",
      "INSERT IGNORE INTO suppliers (name, email, phone, address, status) VALUES ('Industrial Materials Inc', 'sales@industrial.com', '+1-555-0103', '789 Industrial Blvd, TX', 'active')",
    ];

    for (const query of supplierQueries) {
      await executeQuery(query, []);
    }

    console.log("Inserting sample products...");

    // Insert products (using correct integer supplier IDs: 1, 2, 3)
    const productQueries = [
      "INSERT IGNORE INTO products (sku, name, description, category, price, cost, stock_quantity, min_stock_level, supplier_id) VALUES ('TECH-001', 'Wireless Mouse', 'Ergonomic wireless mouse', 'Electronics', 29.99, 18.50, 150, 25, 1)",
      "INSERT IGNORE INTO products (sku, name, description, category, price, cost, stock_quantity, min_stock_level, supplier_id) VALUES ('TECH-002', 'Bluetooth Keyboard', 'Compact Bluetooth keyboard', 'Electronics', 79.99, 55.00, 85, 20, 1)",
      "INSERT IGNORE INTO products (sku, name, description, category, price, cost, stock_quantity, min_stock_level, supplier_id) VALUES ('OFF-001', 'A4 Paper Ream', '500 sheets premium paper', 'Office Supplies', 8.99, 5.50, 200, 50, 2)",
    ];

    for (const query of productQueries) {
      await executeQuery(query, []);
    }

    console.log("Inserting sample purchase orders...");

    // Insert purchase orders (using correct integer supplier IDs: 1, 2, 3)
    const purchaseOrderQueries = [
      "INSERT IGNORE INTO purchase_orders (order_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES ('PO-2024-001', 1, '2024-08-09', '2024-08-16', 'pending', 1250.00, 'Urgent order for electronic components')",
      "INSERT IGNORE INTO purchase_orders (order_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES ('PO-2024-002', 2, '2024-08-08', '2024-08-12', 'approved', 890.50, 'Monthly office supplies order')",
      "INSERT IGNORE INTO purchase_orders (order_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES ('PO-2024-003', 3, '2024-08-05', '2024-08-10', 'completed', 2100.75, 'Safety equipment and tools')",
      "INSERT IGNORE INTO purchase_orders (order_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES ('PO-2024-004', 1, '2024-08-03', '2024-08-08', 'cancelled', 450.25, 'Cancelled due to supplier unavailability')",
    ];

    for (const query of purchaseOrderQueries) {
      await executeQuery(query, []);
    }

    console.log("Sample data inserted successfully!");
  } catch (error) {
    console.error("Error inserting sample data:", error);
  } finally {
    process.exit(0);
  }
}

insertSampleData();
