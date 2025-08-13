const { pool: db } = require("./config/database");

const seedStockOutData = async () => {
  try {
    console.log("Seeding stock out data...");

    // Clear existing stock out data
    await db.execute("DELETE FROM stock_out_items");
    await db.execute("DELETE FROM stock_out_requests");

    // Insert sample stock out requests
    const stockOutRequests = [
      [
        "SOD-001",
        "SOD-2025-001",
        "Production",
        "John Doe",
        "2025-08-13",
        "2025-08-15",
        "Factory Floor A",
        "processing",
        "high",
        "Urgent materials needed for production batch",
        "Manager Smith",
        null,
      ],
      [
        "SOD-002",
        "SOD-2025-002",
        "Maintenance",
        "Jane Smith",
        "2025-08-12",
        "2025-08-14",
        "Warehouse B",
        "completed",
        "medium",
        "Regular maintenance supplies",
        "Manager Brown",
        "Operator Wilson",
      ],
      [
        "SOD-003",
        "SOD-2025-003",
        "Quality Control",
        "Mike Johnson",
        "2025-08-13",
        "2025-08-16",
        "QC Lab",
        "submitted",
        "urgent",
        "Equipment needed for quality testing",
        null,
        null,
      ],
      [
        "SOD-004",
        "SOD-2025-004",
        "Production",
        "Alice Cooper",
        "2025-08-14",
        "2025-08-17",
        "Production Line 2",
        "approved",
        "medium",
        "Materials for new product line",
        "Manager Smith",
        null,
      ],
      [
        "SOD-005",
        "SOD-2025-005",
        "Research",
        "Bob Wilson",
        "2025-08-11",
        "2025-08-13",
        "R&D Lab",
        "completed",
        "low",
        "Research materials",
        "Manager Green",
        "Tech Lead",
      ],
      [
        "SOD-006",
        "SOD-2025-006",
        "Assembly",
        "Carol Davis",
        "2025-08-14",
        "2025-08-18",
        "Assembly Line A",
        "draft",
        "high",
        "Assembly components required",
        null,
        null,
      ],
    ];

    for (const request of stockOutRequests) {
      await db.execute(
        `
                INSERT INTO stock_out_requests (
                    id, request_number, department, requested_by, request_date, required_date, 
                    destination, status, priority, notes, approved_by, processed_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        request
      );
    }

    // Get product IDs for reference
    const [products] = await db.execute(
      "SELECT id, sku FROM products WHERE sku IN (?, ?, ?)",
      ["ELEC001", "IND001", "OFF001"]
    );

    const productMap = {};
    products.forEach((product) => {
      productMap[product.sku] = product.id;
    });

    console.log("Available products:", productMap);

    if (Object.keys(productMap).length === 0) {
      console.log("No products found, creating sample products...");
      // Insert sample products if they don't exist
      await db.execute(`
                INSERT INTO products (sku, name, description, category, price, cost, current_stock, low_stock_threshold) 
                VALUES 
                ('ELEC001', 'LED Display Module', '32-inch LED display for industrial use', 'Electronics', 15000.00, 12000.00, 25, 5),
                ('IND001', 'Steel Fabrication Tools', 'Professional steel cutting and welding tools', 'Industrial', 25000.00, 20000.00, 10, 3),
                ('OFF001', 'Office Chair Executive', 'Ergonomic office chair with lumbar support', 'Office Supplies', 8000.00, 6000.00, 50, 10)
                ON DUPLICATE KEY UPDATE name=VALUES(name)
            `);

      // Re-fetch product IDs
      const [newProducts] = await db.execute(
        "SELECT id, sku FROM products WHERE sku IN (?, ?, ?)",
        ["ELEC001", "IND001", "OFF001"]
      );

      newProducts.forEach((product) => {
        productMap[product.sku] = product.id;
      });
      console.log("Created products:", productMap);
    }

    // Insert sample stock out items
    const stockOutItems = [
      // Items for SOD-001 (Processing)
      [
        "SOI-001",
        "SOD-001",
        productMap["ELEC001"],
        "LED Display Module",
        "Electronics",
        2,
        2,
        1,
        "pieces",
        30000.0,
        "partially_dispatched",
        "2025-08-13",
        "TRK-001",
      ],
      [
        "SOI-002",
        "SOD-001",
        productMap["IND001"],
        "Steel Fabrication Tools",
        "Industrial",
        1,
        1,
        0,
        "set",
        25000.0,
        "allocated",
        null,
        null,
      ],

      // Items for SOD-002 (Completed)
      [
        "SOI-003",
        "SOD-002",
        productMap["OFF001"],
        "Office Chair Executive",
        "Office Supplies",
        3,
        3,
        3,
        "pieces",
        24000.0,
        "dispatched",
        "2025-08-13",
        "TRK-002",
      ],
      [
        "SOI-004",
        "SOD-002",
        productMap["ELEC001"],
        "LED Display Module",
        "Electronics",
        1,
        1,
        1,
        "pieces",
        15000.0,
        "dispatched",
        "2025-08-13",
        "TRK-003",
      ],

      // Items for SOD-003 (Submitted)
      [
        "SOI-005",
        "SOD-003",
        productMap["IND001"],
        "Steel Fabrication Tools",
        "Industrial",
        1,
        0,
        0,
        "set",
        25000.0,
        "pending",
        null,
        null,
      ],

      // Items for SOD-004 (Approved)
      [
        "SOI-006",
        "SOD-004",
        productMap["ELEC001"],
        "LED Display Module",
        "Electronics",
        5,
        3,
        0,
        "pieces",
        75000.0,
        "allocated",
        null,
        null,
      ],
      [
        "SOI-007",
        "SOD-004",
        productMap["OFF001"],
        "Office Chair Executive",
        "Office Supplies",
        10,
        5,
        0,
        "pieces",
        80000.0,
        "allocated",
        null,
        null,
      ],

      // Items for SOD-005 (Completed)
      [
        "SOI-008",
        "SOD-005",
        productMap["IND001"],
        "Steel Fabrication Tools",
        "Industrial",
        2,
        2,
        2,
        "set",
        50000.0,
        "dispatched",
        "2025-08-12",
        "TRK-004",
      ],
      [
        "SOI-009",
        "SOD-005",
        productMap["ELEC001"],
        "LED Display Module",
        "Electronics",
        1,
        1,
        1,
        "pieces",
        15000.0,
        "dispatched",
        "2025-08-12",
        "TRK-005",
      ],

      // Items for SOD-006 (Draft)
      [
        "SOI-010",
        "SOD-006",
        productMap["OFF001"],
        "Office Chair Executive",
        "Office Supplies",
        20,
        0,
        0,
        "pieces",
        160000.0,
        "pending",
        null,
        null,
      ],
      [
        "SOI-011",
        "SOD-006",
        productMap["ELEC001"],
        "LED Display Module",
        "Electronics",
        3,
        0,
        0,
        "pieces",
        45000.0,
        "pending",
        null,
        null,
      ],
    ];

    for (const item of stockOutItems) {
      await db.execute(
        `
                INSERT INTO stock_out_items (
                    id, request_id, product_id, product_name, category, quantity_requested, 
                    quantity_allocated, quantity_dispatched, unit, estimated_value, status, 
                    dispatch_date, tracking_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        item
      );
    }

    // Update stock out requests with calculated totals
    await db.execute(`
            UPDATE stock_out_requests so 
            SET 
                total_items = (
                    SELECT COUNT(*) FROM stock_out_items soi WHERE soi.request_id = so.id
                ),
                total_value = (
                    SELECT COALESCE(SUM(soi.estimated_value), 0) FROM stock_out_items soi WHERE soi.request_id = so.id
                )
        `);

    // Set approved and processed timestamps
    await db.execute(`
            UPDATE stock_out_requests 
            SET approved_at = DATE_SUB(NOW(), INTERVAL 1 DAY) 
            WHERE status IN ('approved', 'processing', 'completed')
        `);

    await db.execute(`
            UPDATE stock_out_requests 
            SET processed_at = DATE_SUB(NOW(), INTERVAL 6 HOUR) 
            WHERE status = 'completed'
        `);

    const [summary] = await db.execute(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(total_items) as total_items,
                SUM(total_value) as total_value
            FROM stock_out_requests
        `);

    console.log("Stock Out sample data inserted successfully!");
    console.log("Summary:", summary[0]);
  } catch (error) {
    console.error("Error seeding stock out data:", error);
  }
};

if (require.main === module) {
  seedStockOutData();
}

module.exports = seedStockOutData;
