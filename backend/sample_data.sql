-- AI Stock Management System Database Setup and Sample Data
-- Run this file to create tables and populate with sample data

-- =====================================================
-- 1. SUPPLIERS SAMPLE DATA
-- =====================================================
INSERT INTO suppliers (name, email, phone, address, contact_person, payment_terms, status, notes) VALUES
('Tech Supply Co', 'orders@techsupply.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA 94000', 'John Smith', 'Net 30', 'active', 'Primary technology supplier'),
('Office Depot Plus', 'procurement@officedepot.com', '+1-555-0102', '456 Office Ave, Business Park, NY 10001', 'Sarah Johnson', 'Net 15', 'active', 'Office supplies and equipment'),
('Industrial Materials Inc', 'sales@industrial.com', '+1-555-0103', '789 Industrial Blvd, Factory District, TX 75001', 'Mike Wilson', 'Net 45', 'active', 'Raw materials and components'),
('Global Electronics', 'info@globalelectronics.com', '+1-555-0104', '321 Electronic Way, Tech City, WA 98001', 'Lisa Chen', 'Net 30', 'active', 'Electronic components supplier'),
('Quick Parts LLC', 'support@quickparts.com', '+1-555-0105', '654 Parts Lane, Supply Town, FL 33001', 'David Brown', 'Net 20', 'active', 'Fast delivery parts supplier');

-- =====================================================
-- 2. PRODUCTS SAMPLE DATA
-- =====================================================
INSERT INTO products (sku, name, description, category, price, cost, stock_quantity, min_stock_level, supplier_id) VALUES
-- Electronics Category
('TECH-001', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 'Electronics', 29.99, 18.50, 150, 25, 1),
('TECH-002', 'Bluetooth Keyboard', 'Compact Bluetooth keyboard for tablets and phones', 'Electronics', 79.99, 55.00, 85, 20, 1),
('TECH-003', 'USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader', 'Electronics', 49.99, 32.00, 120, 15, 4),
('TECH-004', 'LED Monitor 24"', '24-inch Full HD LED monitor with adjustable stand', 'Electronics', 199.99, 140.00, 45, 10, 4),
('TECH-005', 'Webcam HD', '1080p HD webcam with built-in microphone', 'Electronics', 89.99, 62.00, 75, 15, 4),

-- Office Supplies Category
('OFF-001', 'A4 Paper Ream', '500 sheets of premium A4 printing paper', 'Office Supplies', 8.99, 5.50, 200, 50, 2),
('OFF-002', 'Blue Ballpoint Pens', 'Pack of 12 blue ballpoint pens', 'Office Supplies', 12.99, 8.00, 180, 30, 2),
('OFF-003', 'Sticky Notes Set', 'Multicolor sticky notes pack (6 colors)', 'Office Supplies', 15.99, 10.50, 160, 25, 2),
('OFF-004', 'File Folders', 'Manila file folders pack of 25', 'Office Supplies', 18.99, 12.00, 95, 20, 2),
('OFF-005', 'Stapler Heavy Duty', 'Heavy duty stapler for thick documents', 'Office Supplies', 34.99, 22.00, 65, 12, 2),

-- Industrial Category
('IND-001', 'Safety Helmet', 'ANSI approved safety helmet with chin strap', 'Industrial', 45.99, 28.00, 80, 15, 3),
('IND-002', 'Work Gloves', 'Cut-resistant work gloves size L', 'Industrial', 24.99, 15.50, 120, 25, 3),
('IND-003', 'Tool Box', 'Professional tool box with multiple compartments', 'Industrial', 129.99, 85.00, 35, 8, 3),
('IND-004', 'Measuring Tape', '25ft measuring tape with magnetic tip', 'Industrial', 19.99, 12.50, 90, 18, 3),
('IND-005', 'LED Work Light', 'Rechargeable LED work light 2000 lumens', 'Industrial', 79.99, 52.00, 55, 12, 3),

-- Components Category  
('COMP-001', 'Resistor Pack', 'Assorted resistor pack 1/4W (100 pieces)', 'Components', 15.99, 9.50, 200, 30, 5),
('COMP-002', 'Capacitor Set', 'Electrolytic capacitor set various values', 'Components', 25.99, 16.00, 150, 25, 5),
('COMP-003', 'Arduino Uno R3', 'Arduino Uno R3 microcontroller board', 'Components', 34.99, 22.50, 85, 15, 1),
('COMP-004', 'Breadboard', 'Half-size solderless breadboard', 'Components', 12.99, 8.00, 110, 20, 5),
('COMP-005', 'Jumper Wires', 'Male-to-male jumper wires pack of 40', 'Components', 8.99, 5.50, 140, 25, 5);

-- =====================================================
-- 3. CUSTOMERS SAMPLE DATA  
-- =====================================================
INSERT INTO customers (name, email, phone, address, company, customer_type, status, credit_limit, payment_terms, tax_id, notes) VALUES
('Acme Corporation', 'purchasing@acme.com', '+1-555-1001', '100 Business Plaza, Corporate City, CA 90210', 'Acme Corporation', 'business', 'active', 50000.00, 'Net 30', 'TAX123456789', 'Large corporate client with monthly orders'),
('TechStart Inc', 'orders@techstart.com', '+1-555-1002', '200 Startup Ave, Innovation District, NY 10001', 'TechStart Inc', 'business', 'active', 25000.00, 'Net 15', 'TAX987654321', 'Growing tech startup, frequent small orders'),
('John Martinez', 'j.martinez@email.com', '+1-555-1003', '789 Residential St, Hometown, TX 75001', NULL, 'individual', 'active', 5000.00, 'Net 15', NULL, 'Regular individual customer, DIY projects'),
('Educational Systems LLC', 'procurement@edusys.com', '+1-555-1004', '456 Learning Blvd, Education City, FL 33001', 'Educational Systems LLC', 'business', 'active', 35000.00, 'Net 45', 'TAX456789123', 'Educational institution, bulk orders'),
('Sarah Chen', 's.chen@email.com', '+1-555-1005', '321 Maker Lane, Creative Town, WA 98001', NULL, 'individual', 'active', 3000.00, 'Net 15', NULL, 'Electronics hobbyist, regular component orders'),
('Manufacturing Plus', 'supplies@mfgplus.com', '+1-555-1006', '654 Factory Road, Industrial Park, OH 44001', 'Manufacturing Plus', 'business', 'active', 75000.00, 'Net 60', 'TAX789123456', 'Large manufacturer, high volume orders'),
('Mike Rodriguez', 'm.rodriguez@email.com', '+1-555-1007', '987 Workshop Dr, Tool Town, CO 80001', NULL, 'individual', 'active', 2500.00, 'Net 15', NULL, 'Professional contractor, tool and equipment buyer'),
('Innovation Labs', 'purchasing@innovationlabs.com', '+1-555-1008', '111 Research Park, Science City, MA 02101', 'Innovation Labs', 'business', 'active', 40000.00, 'Net 30', 'TAX321654987', 'R&D company, specialized component needs');

-- =====================================================
-- 4. PURCHASE ORDERS SAMPLE DATA
-- =====================================================
INSERT INTO purchase_orders (order_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes) VALUES
('PO-2024-001', 1, '2024-08-01', '2024-08-15', 'completed', 2879.85, 'Monthly electronics restocking'),
('PO-2024-002', 2, '2024-08-03', '2024-08-10', 'completed', 1456.75, 'Office supplies replenishment'),
('PO-2024-003', 3, '2024-08-05', '2024-08-20', 'approved', 3245.60, 'Industrial safety equipment order'),
('PO-2024-004', 4, '2024-08-07', '2024-08-14', 'pending', 1890.45, 'Electronic components for new project'),
('PO-2024-005', 5, '2024-08-08', '2024-08-12', 'approved', 987.30, 'Quick parts emergency order'),
('PO-2024-006', 1, '2024-08-09', '2024-08-25', 'draft', 4567.80, 'Upcoming technology upgrade'),
('PO-2024-007', 2, '2024-08-10', '2024-08-17', 'pending', 756.25, 'Weekly office supply order');

-- =====================================================
-- 5. PURCHASE ORDER ITEMS SAMPLE DATA
-- =====================================================
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, total_price) VALUES
-- PO-2024-001 items (Electronics from Tech Supply Co)
(1, 1, 50, 18.50, 925.00),  -- Wireless Mouse
(1, 2, 30, 55.00, 1650.00), -- Bluetooth Keyboard
(1, 18, 15, 22.50, 337.50), -- Arduino Uno R3
-- PO-2024-002 items (Office supplies)
(2, 6, 40, 5.50, 220.00),   -- A4 Paper Ream
(2, 7, 25, 8.00, 200.00),   -- Blue Ballpoint Pens  
(2, 8, 30, 10.50, 315.00),  -- Sticky Notes Set
(2, 9, 15, 12.00, 180.00),  -- File Folders
-- PO-2024-003 items (Industrial equipment)
(3, 11, 25, 28.00, 700.00), -- Safety Helmet
(3, 12, 50, 15.50, 775.00), -- Work Gloves
(3, 15, 10, 52.00, 520.00), -- LED Work Light
-- PO-2024-004 items (Electronic components)
(4, 3, 20, 32.00, 640.00),  -- USB-C Hub
(4, 5, 15, 62.00, 930.00),  -- Webcam HD
-- PO-2024-005 items (Quick parts)
(5, 16, 30, 9.50, 285.00),  -- Resistor Pack
(5, 19, 25, 8.00, 200.00),  -- Breadboard
(5, 20, 40, 5.50, 220.00);  -- Jumper Wires

-- =====================================================
-- 6. STOCK MOVEMENTS SAMPLE DATA
-- =====================================================
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_number, notes) VALUES
-- Incoming stock from purchase orders
(1, 'in', 50, 'PO-2024-001', 'Received from Tech Supply Co'),
(2, 'in', 30, 'PO-2024-001', 'Received from Tech Supply Co'),
(6, 'in', 40, 'PO-2024-002', 'Received from Office Depot Plus'),
(7, 'in', 25, 'PO-2024-002', 'Received from Office Depot Plus'),
-- Outgoing stock from sales
(1, 'out', 15, 'SALE-001', 'Sold to Acme Corporation'),
(6, 'out', 25, 'SALE-002', 'Sold to Educational Systems LLC'),
(18, 'out', 8, 'SALE-003', 'Sold to TechStart Inc'),
(2, 'out', 12, 'SALE-004', 'Sold to Innovation Labs'),
-- Adjustments
(3, 'out', 5, 'ADJ-001', 'Damaged units removed from inventory'),
(11, 'in', 10, 'ADJ-002', 'Found additional units in warehouse');

-- =====================================================
-- 7. BILLS SAMPLE DATA
-- =====================================================
INSERT INTO bills (bill_number, supplier_name, supplier_id, bill_date, total_amount, status, file_name, ocr_confidence, extracted_data, notes) VALUES
('INV-TS-001', 'Tech Supply Co', 1, '2024-08-01', 2879.85, 'processed', 'tech_supply_invoice_001.pdf', 0.95, '{"items": [{"name": "Wireless Mouse", "quantity": 50, "price": 18.50}, {"name": "Bluetooth Keyboard", "quantity": 30, "price": 55.00}]}', 'Monthly electronics order invoice'),
('INV-OD-002', 'Office Depot Plus', 2, '2024-08-03', 1456.75, 'processed', 'office_depot_invoice_002.pdf', 0.92, '{"items": [{"name": "A4 Paper", "quantity": 40, "price": 5.50}, {"name": "Pens", "quantity": 25, "price": 8.00}]}', 'Office supplies invoice'),
('INV-IM-003', 'Industrial Materials Inc', 3, '2024-08-05', 3245.60, 'pending_review', 'industrial_materials_003.pdf', 0.88, '{"items": [{"name": "Safety Helmet", "quantity": 25, "price": 28.00}]}', 'Industrial equipment invoice - needs review'),
('INV-GE-004', 'Global Electronics', 4, '2024-08-07', 1890.45, 'unprocessed', 'global_electronics_004.pdf', 0.94, '{"items": [{"name": "USB-C Hub", "quantity": 20, "price": 32.00}]}', 'Electronic components invoice'),
('INV-QP-005', 'Quick Parts LLC', 5, '2024-08-08', 987.30, 'approved', 'quick_parts_005.pdf', 0.97, '{"items": [{"name": "Resistor Pack", "quantity": 30, "price": 9.50}]}', 'Quick parts order invoice');

-- =====================================================
-- 8. BILL ITEMS SAMPLE DATA  
-- =====================================================
INSERT INTO bill_items (bill_id, product_name, quantity, unit_price, line_total, matched_product_id) VALUES
-- INV-TS-001 items
(1, 'Wireless Mouse', 50, 18.50, 925.00, 1),
(1, 'Bluetooth Keyboard', 30, 55.00, 1650.00, 2),
(1, 'Arduino Uno R3', 15, 22.50, 337.50, 18),
-- INV-OD-002 items  
(2, 'A4 Paper Ream', 40, 5.50, 220.00, 6),
(2, 'Blue Ballpoint Pens', 25, 8.00, 200.00, 7),
(2, 'Sticky Notes Set', 30, 10.50, 315.00, 8),
(2, 'File Folders', 15, 12.00, 180.00, 9),
-- INV-IM-003 items
(3, 'Safety Helmet', 25, 28.00, 700.00, 11),
(3, 'Work Gloves', 50, 15.50, 775.00, 12),
(3, 'LED Work Light', 10, 52.00, 520.00, 15),
-- INV-GE-004 items
(4, 'USB-C Hub', 20, 32.00, 640.00, 3),
(4, 'Webcam HD', 15, 62.00, 930.00, 5),
-- INV-QP-005 items
(5, 'Resistor Pack', 30, 9.50, 285.00, 16),
(5, 'Breadboard', 25, 8.00, 200.00, 19),
(5, 'Jumper Wires', 40, 5.50, 220.00, 20);

-- =====================================================
-- 9. ALERTS SAMPLE DATA
-- =====================================================
INSERT INTO alerts (product_id, type, message, priority, status, resolved_at) VALUES
(4, 'low_stock', 'LED Monitor 24" stock is running low (10 units remaining)', 'high', 'active', NULL),
(13, 'low_stock', 'Tool Box stock is below minimum threshold (8 units remaining)', 'high', 'active', NULL),
(10, 'low_stock', 'Stapler Heavy Duty stock is low (12 units remaining)', 'medium', 'active', NULL),
(15, 'low_stock', 'LED Work Light needs restocking (12 units remaining)', 'medium', 'acknowledged', NULL),
(NULL, 'system', 'Monthly inventory audit completed successfully', 'low', 'resolved', '2024-08-09 14:30:00'),
(NULL, 'system', 'New purchase order PO-2024-007 created', 'low', 'active', NULL),
(18, 'low_stock', 'Arduino Uno R3 stock running low (15 units remaining)', 'medium', 'active', NULL);

-- =====================================================
-- 10. ACTIVITY LOG SAMPLE DATA
-- =====================================================
INSERT INTO activity_log (activity_type, description, user_name, reference_id, metadata) VALUES
('product_created', 'New product added: Wireless Mouse', 'admin', 1, '{"sku": "TECH-001", "category": "Electronics"}'),
('purchase_order_created', 'Purchase order PO-2024-001 created', 'purchasing_manager', 1, '{"supplier": "Tech Supply Co", "total": 2879.85}'),
('stock_movement', 'Stock received: 50 units of Wireless Mouse', 'warehouse_staff', 1, '{"movement_type": "in", "quantity": 50}'),
('bill_uploaded', 'New bill uploaded: tech_supply_invoice_001.pdf', 'accounting', 1, '{"supplier": "Tech Supply Co", "amount": 2879.85}'),
('alert_generated', 'Low stock alert generated for LED Monitor 24"', 'system', 4, '{"current_stock": 10, "min_level": 10}'),
('customer_created', 'New customer added: Acme Corporation', 'sales_manager', 1, '{"type": "business", "credit_limit": 50000}'),
('product_updated', 'Product price updated: USB-C Hub', 'admin', 3, '{"old_price": 45.99, "new_price": 49.99}'),
('purchase_order_approved', 'Purchase order PO-2024-003 approved', 'manager', 3, '{"supplier": "Industrial Materials Inc", "total": 3245.60}'),
('stock_movement', 'Stock sold: 15 units of Wireless Mouse', 'sales_staff', 1, '{"movement_type": "out", "quantity": 15}'),
('system_backup', 'Database backup completed successfully', 'system', NULL, '{"backup_size": "145MB", "duration": "3.2s"}');

-- =====================================================
-- USEFUL QUERIES FOR REPORTING AND DASHBOARD
-- =====================================================

-- Query 1: Dashboard Overview Stats
-- Total products, low stock items, active suppliers, pending orders
SELECT 
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level) as low_stock_products,
  (SELECT COUNT(*) FROM suppliers WHERE status = 'active') as active_suppliers,
  (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('pending', 'approved')) as pending_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE status = 'completed' AND order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as monthly_procurement;

-- Query 2: Low Stock Products with Supplier Info
SELECT 
  p.id,
  p.sku,
  p.name,
  p.category,
  p.stock_quantity,
  p.min_stock_level,
  p.price,
  s.name as supplier_name,
  s.email as supplier_email,
  s.phone as supplier_phone
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.stock_quantity <= p.min_stock_level
ORDER BY p.stock_quantity ASC;

-- Query 3: Recent Activity Feed (Last 30 days)
SELECT 
  activity_type,
  description,
  user_name,
  created_at,
  metadata
FROM activity_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC 
LIMIT 20;

-- Query 4: Monthly Sales Trends
SELECT 
  DATE_FORMAT(created_at, '%Y-%m') as month,
  SUM(quantity) as total_quantity_sold,
  COUNT(DISTINCT product_id) as unique_products_sold
FROM stock_movements 
WHERE movement_type = 'out' 
  AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

-- Query 5: Top Performing Products (by quantity sold)
SELECT 
  p.name,
  p.sku,
  p.category,
  SUM(sm.quantity) as total_sold,
  SUM(sm.quantity * p.price) as total_revenue
FROM products p
JOIN stock_movements sm ON p.id = sm.product_id
WHERE sm.movement_type = 'out'
  AND sm.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
GROUP BY p.id, p.name, p.sku, p.category
ORDER BY total_sold DESC
LIMIT 10;

-- Query 6: Supplier Performance Report
SELECT 
  s.name as supplier_name,
  s.email,
  COUNT(po.id) as total_orders,
  SUM(po.total_amount) as total_value,
  AVG(po.total_amount) as avg_order_value,
  AVG(DATEDIFF(po.expected_delivery_date, po.order_date)) as avg_delivery_days
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
WHERE po.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY s.id, s.name, s.email
HAVING total_orders > 0
ORDER BY total_value DESC;

-- Query 7: Inventory Value by Category
SELECT 
  category,
  COUNT(*) as product_count,
  SUM(stock_quantity) as total_units,
  SUM(stock_quantity * cost) as inventory_cost_value,
  SUM(stock_quantity * price) as inventory_retail_value
FROM products
GROUP BY category
ORDER BY inventory_retail_value DESC;

-- Query 8: Customer Analysis
SELECT 
  c.name,
  c.customer_type,
  c.credit_limit,
  COUNT(DISTINCT po.id) as total_orders,
  SUM(po.total_amount) as total_spent,
  AVG(po.total_amount) as avg_order_value,
  MAX(po.created_at) as last_order_date
FROM customers c
LEFT JOIN purchase_orders po ON c.id = po.supplier_id  -- Note: This would need a proper sales orders table
GROUP BY c.id
ORDER BY total_spent DESC;

-- Query 9: Alert Summary
SELECT 
  type,
  priority,
  status,
  COUNT(*) as alert_count
FROM alerts
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY type, priority, status
ORDER BY 
  FIELD(priority, 'high', 'medium', 'low'),
  FIELD(status, 'active', 'acknowledged', 'resolved');

-- Query 10: Bill Processing Status
SELECT 
  status,
  COUNT(*) as bill_count,
  SUM(total_amount) as total_value,
  AVG(ocr_confidence) as avg_ocr_confidence
FROM bills
WHERE bill_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
GROUP BY status
ORDER BY FIELD(status, 'unprocessed', 'pending_review', 'processed', 'approved');
