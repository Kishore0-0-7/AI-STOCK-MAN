const { pool } = require("./config/database");

const seedData = async () => {
  try {
    console.log("🌱 Starting data seeding...");

    // First, let's check what tables exist
    const [tables] = await pool.execute("SHOW TABLES");
    console.log(
      "📋 Available tables:",
      tables.map((t) => Object.values(t)[0])
    );

    // Clear existing data (in correct order to respect foreign keys)
    console.log("🧹 Clearing existing data...");
    await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
    await pool.execute("DELETE FROM alerts");
    await pool.execute("DELETE FROM stock_movements");
    await pool.execute("DELETE FROM products");
    await pool.execute("DELETE FROM suppliers");
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

    // Seed suppliers first
    console.log("🏢 Seeding suppliers...");
    const suppliers = [
      [
        "TechSupply Co.",
        "Electronics",
        "John Smith",
        "contact@techsupply.com",
        "+1-555-0101",
        "123 Tech Street, Tech City",
        "active",
      ],
      [
        "Office Solutions Ltd.",
        "Office Supplies",
        "Jane Doe",
        "sales@officesolutions.com",
        "+1-555-0102",
        "456 Business Ave, Office Town",
        "active",
      ],
      [
        "Industrial Equipment Inc.",
        "Industrial",
        "Bob Wilson",
        "orders@industrial-eq.com",
        "+1-555-0103",
        "789 Industrial Blvd, Factory District",
        "active",
      ],
    ];

    for (const supplier of suppliers) {
      await pool.execute(
        "INSERT INTO suppliers (name, category, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        supplier
      );
    }
    console.log("✅ Suppliers seeded");

    // Get supplier IDs
    const [supplierRows] = await pool.execute("SELECT id, name FROM suppliers");
    const supplierMap = {};
    supplierRows.forEach((row) => {
      if (row.name === "TechSupply Co.") supplierMap["TECH"] = row.id;
      if (row.name === "Office Solutions Ltd.") supplierMap["OFFICE"] = row.id;
      if (row.name === "Industrial Equipment Inc.")
        supplierMap["INDUSTRIAL"] = row.id;
    });

    // Seed products
    console.log("📦 Seeding products...");
    const products = [
      [
        "PRD-001",
        "Laptop Computer",
        "High-performance business laptop",
        "Electronics",
        1200.0,
        1000.0,
        50,
        10,
        100,
        "piece",
        "1234567890123",
        supplierMap["TECH"],
        15,
        25,
        "A1-01",
        "active",
      ],
      [
        "PRD-002",
        "Office Chair",
        "Ergonomic office chair with lumbar support",
        "Furniture",
        300.0,
        200.0,
        25,
        5,
        50,
        "piece",
        "2345678901234",
        supplierMap["OFFICE"],
        8,
        15,
        "B2-05",
        "active",
      ],
      [
        "PRD-003",
        "Printer Paper",
        "A4 white printer paper, 500 sheets",
        "Office Supplies",
        15.0,
        8.0,
        200,
        50,
        500,
        "ream",
        "3456789012345",
        supplierMap["OFFICE"],
        75,
        100,
        "C1-10",
        "active",
      ],
      [
        "PRD-004",
        "Industrial Drill",
        "Heavy-duty industrial drilling machine",
        "Tools",
        800.0,
        600.0,
        12,
        3,
        20,
        "piece",
        "4567890123456",
        supplierMap["INDUSTRIAL"],
        5,
        8,
        "D3-02",
        "active",
      ],
      [
        "PRD-005",
        "Safety Helmet",
        "Construction safety helmet - hard hat",
        "Safety",
        25.0,
        15.0,
        75,
        20,
        150,
        "piece",
        "5678901234567",
        supplierMap["INDUSTRIAL"],
        30,
        40,
        "E1-15",
        "active",
      ],
    ];

    for (const product of products) {
      await pool.execute(
        `INSERT INTO products 
         (sku, name, description, category, price, cost, current_stock, low_stock_threshold, max_stock_level, unit, barcode, supplier_id, reorder_level, reorder_quantity, location, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        product
      );
    }
    console.log("✅ Products seeded");

    // Add some stock movements for activity tracking
    console.log("📈 Seeding stock movements...");
    const [productRows] = await pool.execute("SELECT id FROM products LIMIT 3");

    for (const product of productRows) {
      // Add some random movements
      await pool.execute(
        `INSERT INTO stock_movements 
         (product_id, movement_type, quantity, unit_cost, reference_id, reference_type, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL ? DAY)`,
        [
          product.id,
          "in",
          10,
          100.0,
          "PO-001",
          "purchase_order",
          "Initial stock",
          Math.floor(Math.random() * 7),
        ]
      );

      await pool.execute(
        `INSERT INTO stock_movements 
         (product_id, movement_type, quantity, unit_cost, reference_id, reference_type, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL ? DAY)`,
        [
          product.id,
          "out",
          5,
          120.0,
          "SO-001",
          "customer_order",
          "Product sold",
          Math.floor(Math.random() * 3),
        ]
      );
    }
    console.log("✅ Stock movements seeded");

    // Add some alerts
    console.log("🚨 Seeding alerts...");
    const alerts = [
      [
        "low_stock",
        "medium",
        "Low Stock Alert",
        "Office Chair stock is running low (25 remaining)",
        "active",
      ],
      [
        "low_stock",
        "high",
        "Reorder Required",
        "Industrial Drill needs to be reordered",
        "active",
      ],
      [
        "system",
        "low",
        "Supplier Update",
        "New supplier contact information received",
        "acknowledged",
      ],
    ];

    for (const alert of alerts) {
      await pool.execute(
        "INSERT INTO alerts (alert_type, priority, title, message, status) VALUES (?, ?, ?, ?, ?)",
        alert
      );
    }
    console.log("✅ Alerts seeded");

    // Create dashboard activity log entries
    console.log("📊 Seeding activity logs...");
    const activities = [
      [
        "product_updated",
        "Product Updated",
        "Office Chair price updated to $300",
        JSON.stringify({ product_id: 2, old_price: 280, new_price: 300 }),
      ],
      [
        "stock_movement",
        "Stock Movement",
        "Received 25 units of Laptop Computer",
        JSON.stringify({ product_id: 1, quantity: 25, type: "in" }),
      ],
      [
        "alert_created",
        "Alert Created",
        "Low stock alert generated for Industrial Drill",
        JSON.stringify({ alert_type: "low_stock", product_id: 4 }),
      ],
      [
        "supplier_added",
        "Supplier Added",
        "New supplier TechSupply Co. added to system",
        JSON.stringify({ supplier_id: 1 }),
      ],
    ];

    // Check if activity_logs table exists, if not create it
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action_type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created_at (created_at),
          INDEX idx_action_type (action_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      for (const activity of activities) {
        await pool.execute(
          "INSERT INTO activity_logs (action_type, title, description, metadata) VALUES (?, ?, ?, ?)",
          activity
        );
      }
      console.log("✅ Activity logs seeded");
    } catch (error) {
      console.log(
        "⚠️ Activity logs table creation/seeding skipped:",
        error.message
      );
    }

    console.log("🎉 Data seeding completed successfully!");

    // Display summary
    const [productCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM products"
    );
    const [supplierCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM suppliers"
    );
    const [alertCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM alerts"
    );

    console.log("\n📊 Data Summary:");
    console.log(`   Products: ${productCount[0].count}`);
    console.log(`   Suppliers: ${supplierCount[0].count}`);
    console.log(`   Alerts: ${alertCount[0].count}`);
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

// Run seeding
seedData();
