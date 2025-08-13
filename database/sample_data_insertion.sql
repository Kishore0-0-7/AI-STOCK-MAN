-- =====================================================================
-- AI STOCK MANAGEMENT SYSTEM - COMPREHENSIVE SAMPLE DATA
-- =====================================================================
-- This script inserts sample data for all tables in the database
-- Created: August 14, 2025
-- =====================================================================

USE ai_stock_management;

-- Disable foreign key checks temporarily for easier insertion
SET foreign_key_checks = 0;

-- =====================================================================
-- 1. SUPPLIERS DATA
-- =====================================================================

INSERT INTO suppliers (id, name, category, contact_person, email, phone, address, website, payment_terms, credit_limit, status, tax_id, notes, rating) VALUES
('fc072251-7885-11f0-978c-42673f055dc4', 'TechSupply Co.', 'Electronics', 'John Smith', 'contact@techsupply.com', '+1-555-0101', '123 Tech Park, Silicon Valley, CA 94000', 'www.techsupply.com', 'NET_30', 500000.00, 'active', 'GST12345678901', 'Primary electronics supplier', 4.5),
('fc09c2a0-7885-11f0-978c-42673f055dc4', 'Industrial Equipment Inc.', 'Industrial', 'Sarah Johnson', 'orders@industrial-eq.com', '+1-555-0103', '456 Industrial Blvd, Detroit, MI 48201', 'www.industrial-eq.com', 'NET_45', 750000.00, 'active', 'GST23456789012', 'Heavy machinery and tools', 4.2),
('c6fd32b1-7877-11f0-978c-42673f055dc4', 'TechCorp Industries', 'Electronics', 'Raj Patel', 'raj.patel@techcorp.com', '+91-9876543210', '123 Tech Park, Bangalore, Karnataka 560001', 'www.techcorp.in', 'NET_30', 300000.00, 'active', 'GST29ABCDE1234F1Z5', 'Electronics components supplier', 4.3),
('fc0a8f64-7885-11f0-978c-42673f055dc4', 'OfficeMax Solutions', 'Office Supplies', 'Mike Brown', 'mike@officemax.com', '+1-555-0102', '789 Business District, New York, NY 10001', 'www.officemax.com', 'NET_15', 200000.00, 'active', 'GST34567890123', 'Office furniture and supplies', 4.0),
('fc0b1234-7885-11f0-978c-42673f055dc4', 'Global Parts Ltd', 'General', 'Lisa Wong', 'sales@globalparts.com', '+86-138-0013-8000', '101 Manufacturing St, Shenzhen, China 518000', 'www.globalparts.com', 'NET_60', 1000000.00, 'active', 'CN123456789', 'International parts supplier', 4.1),
('fc0c5678-7885-11f0-978c-42673f055dc4', 'SteelWorks Ltd', 'Industrial', 'David Wilson', 'david@steelworks.com', '+44-20-7946-0958', '25 Steel Avenue, Birmingham, UK B1 1AA', 'www.steelworks.co.uk', 'NET_30', 800000.00, 'active', 'GB123456789', 'Steel and metal products', 4.4);

-- =====================================================================
-- 2. CUSTOMERS DATA
-- =====================================================================

INSERT INTO customers (id, name, email, phone, address, city, state, country, customer_type, company, tax_id, credit_limit, status) VALUES
('cust001-7885-11f0-978c-42673f055dc4', 'ABC Manufacturing Ltd', 'purchasing@abcmfg.com', '+91-80-12345678', '45 Industrial Estate, Peenya', 'Bangalore', 'Karnataka', 'India', 'business', 'ABC Manufacturing Ltd', 'GST29ABCDE1234F1Z6', 1000000.00, 'active'),
('cust002-7885-11f0-978c-42673f055dc4', 'XYZ Electronics Pvt Ltd', 'orders@xyzelec.com', '+91-44-87654321', '78 Electronics City, Thoraipakkam', 'Chennai', 'Tamil Nadu', 'India', 'business', 'XYZ Electronics Pvt Ltd', 'GST33FGHIJ5678K2L7', 750000.00, 'active'),
('cust003-7885-11f0-978c-42673f055dc4', 'Tech Innovations Inc', 'procurement@techinno.com', '+1-408-555-0199', '567 Innovation Drive', 'San Jose', 'California', 'USA', 'business', 'Tech Innovations Inc', 'EIN12-3456789', 500000.00, 'active'),
('cust004-7885-11f0-978c-42673f055dc4', 'Metro Office Solutions', 'admin@metrooffice.com', '+91-22-98765432', '23 Business Park, Andheri East', 'Mumbai', 'Maharashtra', 'India', 'business', 'Metro Office Solutions', 'GST27KLMNO9012P3Q8', 300000.00, 'active'),
('cust005-7885-11f0-978c-42673f055dc4', 'John Anderson', 'john.anderson@email.com', '+1-555-0198', '123 Residential Ave', 'Austin', 'Texas', 'USA', 'individual', NULL, NULL, 50000.00, 'active');

-- =====================================================================
-- 3. PRODUCT CATEGORIES DATA
-- =====================================================================

INSERT INTO product_categories (id, name, description, status) VALUES
('cat001-7885-11f0-978c-42673f055dc4', 'Electronics', 'Electronic components, devices, and accessories', 'active'),
('cat002-7885-11f0-978c-42673f055dc4', 'Industrial', 'Industrial machinery, tools, and equipment', 'active'),
('cat003-7885-11f0-978c-42673f055dc4', 'Office Supplies', 'Office furniture, supplies, and equipment', 'active'),
('cat004-7885-11f0-978c-42673f055dc4', 'Tools', 'Hand tools, power tools, and accessories', 'active'),
('cat005-7885-11f0-978c-42673f055dc4', 'Safety', 'Safety equipment and protective gear', 'active'),
('cat006-7885-11f0-978c-42673f055dc4', 'Raw Materials', 'Raw materials for manufacturing', 'active');

-- =====================================================================
-- 4. PRODUCTS DATA
-- =====================================================================

INSERT INTO products (id, sku, name, description, category_id, category, price, cost, current_stock, low_stock_threshold, max_stock_level, unit, barcode, supplier_id, reorder_level, reorder_quantity, location, status) VALUES
-- Electronics
('c39bbe9f-7886-11f0-978c-42673f055dc4', 'PRD-001', 'Laptop Computer', 'High-performance business laptop', 'cat001-7885-11f0-978c-42673f055dc4', 'Electronics', 1200.00, 1000.00, 8, 10, 100, 'piece', '1234567890123', 'fc072251-7885-11f0-978c-42673f055dc4', 15, 25, 'A1-01', 'active'),
('c6ff8d53-7877-11f0-978c-42673f055dc4', 'ELEC001', 'LED Display Module', '32-inch LED display for industrial use', 'cat001-7885-11f0-978c-42673f055dc4', 'Electronics', 15000.00, 12000.00, 25, 5, 1000, 'pieces', NULL, 'c6fd32b1-7877-11f0-978c-42673f055dc4', 0, 0, NULL, 'active'),
('c39c2a76-7886-11f0-978c-42673f055dc4', 'PRD-002', 'Office Chair', 'Ergonomic office chair with lumbar support', 'cat003-7885-11f0-978c-42673f055dc4', 'Furniture', 450.00, 350.00, 30, 8, 50, 'piece', '2345678901234', 'fc0a8f64-7885-11f0-978c-42673f055dc4', 10, 20, 'B2-03', 'active'),
('c39c3ffd-7886-11f0-978c-42673f055dc4', 'PRD-003', 'Printer Paper', 'A4 white printer paper, 500 sheets', 'cat003-7885-11f0-978c-42673f055dc4', 'Office Supplies', 8.50, 6.00, 200, 50, 500, 'ream', '3456789012345', 'fc0a8f64-7885-11f0-978c-42673f055dc4', 75, 100, 'C1-05', 'active'),
('c39c4915-7886-11f0-978c-42673f055dc4', 'PRD-004', 'Industrial Drill', 'Heavy-duty industrial drilling machine', 'cat004-7885-11f0-978c-42673f055dc4', 'Tools', 800.00, 600.00, 2, 3, 20, 'piece', '4567890123456', 'fc09c2a0-7885-11f0-978c-42673f055dc4', 5, 8, 'D3-02', 'active'),
('c39c5149-7886-11f0-978c-42673f055dc4', 'PRD-005', 'Safety Helmet', 'Construction safety helmet - hard hat', 'cat005-7885-11f0-978c-42673f055dc4', 'Safety', 35.00, 25.00, 75, 20, 200, 'piece', '5678901234567', 'fc0b1234-7885-11f0-978c-42673f055dc4', 30, 50, 'E1-01', 'active'),
('c6ffac3d-7877-11f0-978c-42673f055dc4', 'IND001', 'Steel Fabrication Tools', 'Professional steel cutting and welding tools', 'cat002-7885-11f0-978c-42673f055dc4', 'Industrial', 25000.00, 20000.00, 10, 3, 1000, 'pieces', NULL, 'c6fd32b1-7877-11f0-978c-42673f055dc4', 0, 0, NULL, 'active'),
('c6ffb689-7877-11f0-978c-42673f055dc4', 'OFF001', 'Office Chair Executive', 'Ergonomic office chair with lumbar support', 'cat003-7885-11f0-978c-42673f055dc4', 'Office Supplies', 8000.00, 6000.00, 50, 10, 1000, 'pieces', NULL, 'c6fd32b1-7877-11f0-978c-42673f055dc4', 0, 0, NULL, 'active');

-- =====================================================================
-- 5. PURCHASE ORDERS DATA
-- =====================================================================

INSERT INTO purchase_orders (id, order_number, supplier_id, order_date, expected_delivery_date, status, priority, total_amount, payment_terms, notes, created_by) VALUES
('po001-7885-11f0-978c-42673f055dc4', 'PO-20250101-001', 'fc072251-7885-11f0-978c-42673f055dc4', '2025-01-15', '2025-01-25', 'approved', 'high', 25000.00, 'NET_30', 'Urgent laptop procurement for new employees', 'John Doe'),
('po002-7885-11f0-978c-42673f055dc4', 'PO-20250102-002', 'fc09c2a0-7885-11f0-978c-42673f055dc4', '2025-01-18', '2025-01-28', 'shipped', 'medium', 16000.00, 'NET_45', 'Monthly industrial equipment order', 'Sarah Smith'),
('po003-7885-11f0-978c-42673f055dc4', 'PO-20250103-003', 'fc0a8f64-7885-11f0-978c-42673f055dc4', '2025-01-20', '2025-01-30', 'pending', 'low', 4250.00, 'NET_15', 'Office supplies restocking', 'Mike Johnson'),
('po004-7885-11f0-978c-42673f055dc4', 'PO-20250104-004', 'fc0b1234-7885-11f0-978c-42673f055dc4', '2025-01-22', '2025-02-05', 'received', 'medium', 1750.00, 'NET_60', 'Safety equipment bulk order', 'Lisa Brown'),
('po005-7885-11f0-978c-42673f055dc4', 'PO-20250105-005', 'fc0c5678-7885-11f0-978c-42673f055dc4', '2025-01-25', '2025-02-10', 'cancelled', 'low', 50000.00, 'NET_30', 'Steel materials - cancelled due to design change', 'David Wilson');

-- =====================================================================
-- 6. PURCHASE ORDER ITEMS DATA
-- =====================================================================

INSERT INTO purchase_order_items (id, purchase_order_id, product_id, product_name, quantity, unit_price, total_price, received_quantity, quality_status) VALUES
('poi001-7885-11f0-978c-42673f055dc4', 'po001-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'Laptop Computer', 20, 1200.00, 24000.00, 20, 'approved'),
('poi002-7885-11f0-978c-42673f055dc4', 'po001-7885-11f0-978c-42673f055dc4', 'c39c3ffd-7886-11f0-978c-42673f055dc4', 'Printer Paper', 100, 8.50, 850.00, 100, 'approved'),
('poi003-7885-11f0-978c-42673f055dc4', 'po002-7885-11f0-978c-42673f055dc4', 'c39c4915-7886-11f0-978c-42673f055dc4', 'Industrial Drill', 20, 800.00, 16000.00, 0, 'pending'),
('poi004-7885-11f0-978c-42673f055dc4', 'po003-7885-11f0-978c-42673f055dc4', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'Office Chair', 5, 450.00, 2250.00, 0, 'pending'),
('poi005-7885-11f0-978c-42673f055dc4', 'po003-7885-11f0-978c-42673f055dc4', 'c39c3ffd-7886-11f0-978c-42673f055dc4', 'Printer Paper', 200, 8.50, 1700.00, 0, 'pending'),
('poi006-7885-11f0-978c-42673f055dc4', 'po004-7885-11f0-978c-42673f055dc4', 'c39c5149-7886-11f0-978c-42673f055dc4', 'Safety Helmet', 50, 35.00, 1750.00, 50, 'approved');

-- =====================================================================
-- 7. CUSTOMER ORDERS DATA
-- =====================================================================

INSERT INTO customer_orders (id, order_number, customer_id, customer_name, customer_email, order_date, delivery_date, status, priority, total_amount, final_amount, payment_method, payment_status) VALUES
('co001-7885-11f0-978c-42673f055dc4', 'CO-20250110-001', 'cust001-7885-11f0-978c-42673f055dc4', 'ABC Manufacturing Ltd', 'purchasing@abcmfg.com', '2025-01-10', '2025-01-20', 'delivered', 'high', 18000.00, 18000.00, 'bank_transfer', 'paid'),
('co002-7885-11f0-978c-42673f055dc4', 'CO-20250112-002', 'cust002-7885-11f0-978c-42673f055dc4', 'XYZ Electronics Pvt Ltd', 'orders@xyzelec.com', '2025-01-12', '2025-01-22', 'shipped', 'medium', 1800.00, 1800.00, 'upi', 'paid'),
('co003-7885-11f0-978c-42673f055dc4', 'CO-20250115-003', 'cust003-7885-11f0-978c-42673f055dc4', 'Tech Innovations Inc', 'procurement@techinno.com', '2025-01-15', '2025-01-25', 'confirmed', 'medium', 2400.00, 2400.00, 'card', 'pending'),
('co004-7885-11f0-978c-42673f055dc4', 'CO-20250118-004', 'cust004-7885-11f0-978c-42673f055dc4', 'Metro Office Solutions', 'admin@metrooffice.com', '2025-01-18', '2025-01-28', 'preparing', 'low', 1275.00, 1275.00, 'cash', 'pending'),
('co005-7885-11f0-978c-42673f055dc4', 'CO-20250120-005', 'cust005-7885-11f0-978c-42673f055dc4', 'John Anderson', 'john.anderson@email.com', '2025-01-20', '2025-01-30', 'pending', 'low', 170.00, 170.00, 'card', 'pending');

-- =====================================================================
-- 8. CUSTOMER ORDER ITEMS DATA
-- =====================================================================

INSERT INTO customer_order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, allocated_quantity, dispatched_quantity) VALUES
('coi001-7885-11f0-978c-42673f055dc4', 'co001-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'Laptop Computer', 'PRD-001', 15, 1200.00, 18000.00, 15, 15),
('coi002-7885-11f0-978c-42673f055dc4', 'co002-7885-11f0-978c-42673f055dc4', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'Office Chair', 'PRD-002', 4, 450.00, 1800.00, 4, 4),
('coi003-7885-11f0-978c-42673f055dc4', 'co003-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'Laptop Computer', 'PRD-001', 2, 1200.00, 2400.00, 2, 0),
('coi004-7885-11f0-978c-42673f055dc4', 'co004-7885-11f0-978c-42673f055dc4', 'c39c3ffd-7886-11f0-978c-42673f055dc4', 'Printer Paper', 'PRD-003', 150, 8.50, 1275.00, 150, 0),
('coi005-7885-11f0-978c-42673f055dc4', 'co005-7885-11f0-978c-42673f055dc4', 'c39c5149-7886-11f0-978c-42673f055dc4', 'Safety Helmet', 'PRD-005', 5, 35.00, 175.00, 5, 0);

-- =====================================================================
-- 9. STOCK MOVEMENTS DATA
-- =====================================================================

INSERT INTO stock_movements (id, product_id, movement_type, quantity, unit_cost, total_value, reference_type, reference_id, reference_number, reason, created_by) VALUES
('sm001-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'in', 50, 1000.00, 50000.00, 'purchase_order', 'po001-7885-11f0-978c-42673f055dc4', 'PO-20250101-001', 'Initial stock received', 'System'),
('sm002-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'out', 15, 1000.00, 15000.00, 'customer_order', 'co001-7885-11f0-978c-42673f055dc4', 'CO-20250110-001', 'Customer order fulfillment', 'System'),
('sm003-7885-11f0-978c-42673f055dc4', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'in', 40, 350.00, 14000.00, 'purchase_order', 'po003-7885-11f0-978c-42673f055dc4', 'PO-20250103-003', 'Stock replenishment', 'System'),
('sm004-7885-11f0-978c-42673f055dc4', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'out', 4, 350.00, 1400.00, 'customer_order', 'co002-7885-11f0-978c-42673f055dc4', 'CO-20250112-002', 'Customer order fulfillment', 'System'),
('sm005-7885-11f0-978c-42673f055dc4', 'c39c3ffd-7886-11f0-978c-42673f055dc4', 'in', 500, 6.00, 3000.00, 'purchase_order', 'po001-7885-11f0-978c-42673f055dc4', 'PO-20250101-001', 'Bulk paper order received', 'System'),
('sm006-7885-11f0-978c-42673f055dc4', 'c39c4915-7886-11f0-978c-42673f055dc4', 'in', 15, 600.00, 9000.00, 'purchase_order', 'po002-7885-11f0-978c-42673f055dc4', 'PO-20250102-002', 'Industrial equipment received', 'System'),
('sm007-7885-11f0-978c-42673f055dc4', 'c39c5149-7886-11f0-978c-42673f055dc4', 'in', 100, 25.00, 2500.00, 'purchase_order', 'po004-7885-11f0-978c-42673f055dc4', 'PO-20250104-004', 'Safety equipment bulk order', 'System');

-- =====================================================================
-- 10. STOCK OUT REQUESTS DATA
-- =====================================================================

INSERT INTO stock_out_requests (id, request_number, department, requested_by, request_date, required_date, destination, status, priority, total_items, total_value) VALUES
('sor001-7885-11f0-978c-42673f055dc4', 'SOR-20250115-001', 'Production', 'John Manufacturing', '2025-01-15', '2025-01-20', 'Assembly Line A', 'completed', 'high', 2, 1600.00),
('sor002-7885-11f0-978c-42673f055dc4', 'SOR-20250116-002', 'Maintenance', 'Sarah Technical', '2025-01-16', '2025-01-22', 'Workshop B', 'processing', 'medium', 1, 800.00),
('sor003-7885-11f0-978c-42673f055dc4', 'SOR-20250118-003', 'Quality Control', 'Mike QC', '2025-01-18', '2025-01-25', 'QC Lab', 'approved', 'medium', 1, 35.00),
('sor004-7885-11f0-978c-42673f055dc4', 'SOR-20250120-004', 'IT Department', 'Lisa IT', '2025-01-20', '2025-01-30', 'IT Office', 'submitted', 'low', 1, 1200.00);

-- =====================================================================
-- 11. STOCK OUT ITEMS DATA
-- =====================================================================

INSERT INTO stock_out_items (id, request_id, product_id, product_name, category, quantity_requested, quantity_allocated, quantity_dispatched, status) VALUES
('soi001-7885-11f0-978c-42673f055dc4', 'sor001-7885-11f0-978c-42673f055dc4', 'c39c4915-7886-11f0-978c-42673f055dc4', 'Industrial Drill', 'Tools', 2, 2, 2, 'dispatched'),
('soi002-7885-11f0-978c-42673f055dc4', 'sor002-7885-11f0-978c-42673f055dc4', 'c39c4915-7886-11f0-978c-42673f055dc4', 'Industrial Drill', 'Tools', 1, 1, 0, 'allocated'),
('soi003-7885-11f0-978c-42673f055dc4', 'sor003-7885-11f0-978c-42673f055dc4', 'c39c5149-7886-11f0-978c-42673f055dc4', 'Safety Helmet', 'Safety', 1, 1, 0, 'allocated'),
('soi004-7885-11f0-978c-42673f055dc4', 'sor004-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'Laptop Computer', 'Electronics', 1, 0, 0, 'pending');

-- =====================================================================
-- 12. RAW MATERIALS DATA
-- =====================================================================

INSERT INTO raw_materials (id, name, category, current_stock, unit, cost_per_unit, reorder_level, supplier_id, supplier_name, status) VALUES
('rm001-7885-11f0-978c-42673f055dc4', 'Steel Sheet 2mm', 'Metal', 500.000, 'kg', 85.00, 100.000, 'fc0c5678-7885-11f0-978c-42673f055dc4', 'SteelWorks Ltd', 'active'),
('rm002-7885-11f0-978c-42673f055dc4', 'Aluminum Rod 10mm', 'Metal', 250.000, 'kg', 120.00, 50.000, 'fc0b1234-7885-11f0-978c-42673f055dc4', 'Global Parts Ltd', 'active'),
('rm003-7885-11f0-978c-42673f055dc4', 'Plastic Granules ABS', 'Polymer', 1000.000, 'kg', 45.00, 200.000, 'fc0b1234-7885-11f0-978c-42673f055dc4', 'Global Parts Ltd', 'active'),
('rm004-7885-11f0-978c-42673f055dc4', 'Electronic Components Kit', 'Electronics', 150.000, 'set', 250.00, 25.000, 'fc072251-7885-11f0-978c-42673f055dc4', 'TechSupply Co.', 'active'),
('rm005-7885-11f0-978c-42673f055dc4', 'Copper Wire 2.5mm', 'Electrical', 2000.000, 'meter', 15.00, 500.000, 'fc072251-7885-11f0-978c-42673f055dc4', 'TechSupply Co.', 'active');

-- =====================================================================
-- 13. PRODUCT RECIPES DATA
-- =====================================================================

INSERT INTO product_recipes (id, product_id, name, description, estimated_time_hours, complexity, batch_size, status) VALUES
('pr001-7885-11f0-978c-42673f055dc4', 'c39c4915-7886-11f0-978c-42673f055dc4', 'Industrial Drill Assembly', 'Complete assembly process for industrial drill', 8.5, 'high', 10, 'active'),
('pr002-7885-11f0-978c-42673f055dc4', 'c39c5149-7886-11f0-978c-42673f055dc4', 'Safety Helmet Manufacturing', 'Molding and assembly of safety helmets', 4.0, 'medium', 50, 'active'),
('pr003-7885-11f0-978c-42673f055dc4', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'Office Chair Assembly', 'Complete office chair assembly process', 2.5, 'low', 20, 'active');

-- =====================================================================
-- 14. RECIPE MATERIALS DATA
-- =====================================================================

INSERT INTO recipe_materials (id, recipe_id, material_id, material_name, required_quantity, unit, wastage_percent) VALUES
('rpm001-7885-11f0-978c-42673f055dc4', 'pr001-7885-11f0-978c-42673f055dc4', 'rm001-7885-11f0-978c-42673f055dc4', 'Steel Sheet 2mm', 2.500, 'kg', 5.00),
('rpm002-7885-11f0-978c-42673f055dc4', 'pr001-7885-11f0-978c-42673f055dc4', 'rm004-7885-11f0-978c-42673f055dc4', 'Electronic Components Kit', 1.000, 'set', 2.00),
('rpm003-7885-11f0-978c-42673f055dc4', 'pr002-7885-11f0-978c-42673f055dc4', 'rm003-7885-11f0-978c-42673f055dc4', 'Plastic Granules ABS', 0.800, 'kg', 8.00),
('rpm004-7885-11f0-978c-42673f055dc4', 'pr003-7885-11f0-978c-42673f055dc4', 'rm001-7885-11f0-978c-42673f055dc4', 'Steel Sheet 2mm', 1.200, 'kg', 3.00),
('rpm005-7885-11f0-978c-42673f055dc4', 'pr003-7885-11f0-978c-42673f055dc4', 'rm003-7885-11f0-978c-42673f055dc4', 'Plastic Granules ABS', 0.500, 'kg', 5.00);

-- =====================================================================
-- 15. PRODUCTION BATCHES DATA
-- =====================================================================

INSERT INTO production_batches (id, batch_number, product_id, recipe_id, planned_quantity, actual_quantity, status, start_date, estimated_completion_date, progress_percentage, total_cost, created_by) VALUES
('pb001-7885-11f0-978c-42673f055dc4', 'BATCH-20250115-001', 'c39c4915-7886-11f0-978c-42673f055dc4', 'pr001-7885-11f0-978c-42673f055dc4', 10, 10, 'completed', '2025-01-15', '2025-01-18', 100.00, 6000.00, 'Production Manager'),
('pb002-7885-11f0-978c-42673f055dc4', 'BATCH-20250118-002', 'c39c5149-7886-11f0-978c-42673f055dc4', 'pr002-7885-11f0-978c-42673f055dc4', 50, 45, 'in_progress', '2025-01-18', '2025-01-20', 90.00, 1125.00, 'Production Manager'),
('pb003-7885-11f0-978c-42673f055dc4', 'BATCH-20250120-003', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'pr003-7885-11f0-978c-42673f055dc4', 20, 0, 'planned', '2025-01-22', '2025-01-24', 0.00, 7000.00, 'Production Manager');

-- =====================================================================
-- 16. QC INSPECTIONS DATA
-- =====================================================================

INSERT INTO qc_inspections (id, inspection_number, product_id, batch_id, inspection_type, quantity_inspected, quantity_passed, quantity_failed, rejection_rate, status, inspector_name, inspection_date, completion_date) VALUES
('qci001-7885-11f0-978c-42673f055dc4', 'QC-20250115-001', 'c39c4915-7886-11f0-978c-42673f055dc4', 'pb001-7885-11f0-978c-42673f055dc4', 'final', 10, 9, 1, 10.00, 'completed', 'QC Inspector 1', '2025-01-18', '2025-01-18'),
('qci002-7885-11f0-978c-42673f055dc4', 'QC-20250118-002', 'c39c5149-7886-11f0-978c-42673f055dc4', 'pb002-7885-11f0-978c-42673f055dc4', 'in_process', 25, 24, 1, 4.00, 'completed', 'QC Inspector 2', '2025-01-19', '2025-01-19'),
('qci003-7885-11f0-978c-42673f055dc4', 'QC-20250120-003', 'c39bbe9f-7886-11f0-978c-42673f055dc4', NULL, 'incoming', 20, 20, 0, 0.00, 'completed', 'QC Inspector 1', '2025-01-16', '2025-01-16');

-- =====================================================================
-- 17. QC DEFECTS DATA
-- =====================================================================

INSERT INTO qc_defects (id, inspection_id, defect_type, defect_description, quantity, severity, action_required, cost_impact) VALUES
('qcd001-7885-11f0-978c-42673f055dc4', 'qci001-7885-11f0-978c-42673f055dc4', 'Surface Finish', 'Poor surface finish on drill bit housing', 1, 'minor', 'rework', 50.00),
('qcd002-7885-11f0-978c-42673f055dc4', 'qci002-7885-11f0-978c-42673f055dc4', 'Dimension Variance', 'Helmet diameter slightly out of specification', 1, 'major', 'scrap', 35.00);

-- =====================================================================
-- 18. QC HOLD ITEMS DATA
-- =====================================================================

INSERT INTO qc_hold_items (id, item_code, description, quantity, status, hold_reason, inspection_id, hold_date, release_date, released_by) VALUES
('qhi001-7885-11f0-978c-42673f055dc4', 'DRILL-001-H001', 'Industrial Drill with surface finish issue', 1, 'released', 'Surface finish defect - reworked', 'qci001-7885-11f0-978c-42673f055dc4', '2025-01-18', '2025-01-19', 'QC Supervisor'),
('qhi002-7885-11f0-978c-42673f055dc4', 'HELM-002-H001', 'Safety Helmet with dimension variance', 1, 'scrap', 'Dimension out of tolerance', 'qci002-7885-11f0-978c-42673f055dc4', '2025-01-19', NULL, NULL);

-- =====================================================================
-- 19. STORAGE LOCATIONS DATA
-- =====================================================================

INSERT INTO storage_locations (id, location_code, location_name, location_type, capacity_units, occupied_units, status, zone, aisle, row_num, column_num) VALUES
('sl001-7885-11f0-978c-42673f055dc4', 'WH-A1-01', 'Main Warehouse - Section A1', 'warehouse', 1000, 450, 'available', 'A', '1', 1, 1),
('sl002-7885-11f0-978c-42673f055dc4', 'WH-A1-02', 'Main Warehouse - Section A2', 'warehouse', 800, 600, 'near_full', 'A', '1', 1, 2),
('sl003-7885-11f0-978c-42673f055dc4', 'WH-B2-01', 'Electronics Storage', 'warehouse', 500, 200, 'available', 'B', '2', 2, 1),
('sl004-7885-11f0-978c-42673f055dc4', 'WH-C3-01', 'Office Supplies Area', 'warehouse', 300, 180, 'available', 'C', '3', 3, 1),
('sl005-7885-11f0-978c-42673f055dc4', 'WH-D4-01', 'Industrial Equipment Zone', 'warehouse', 600, 150, 'available', 'D', '4', 4, 1);

-- =====================================================================
-- 20. PRODUCT LOCATIONS DATA
-- =====================================================================

INSERT INTO product_locations (id, product_id, location_id, quantity, allocated_quantity) VALUES
('pl001-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'sl003-7885-11f0-978c-42673f055dc4', 25, 2),
('pl002-7885-11f0-978c-42673f055dc4', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'sl004-7885-11f0-978c-42673f055dc4', 30, 0),
('pl003-7885-11f0-978c-42673f055dc4', 'c39c3ffd-7886-11f0-978c-42673f055dc4', 'sl004-7885-11f0-978c-42673f055dc4', 200, 150),
('pl004-7885-11f0-978c-42673f055dc4', 'c39c4915-7886-11f0-978c-42673f055dc4', 'sl005-7885-11f0-978c-42673f055dc4', 12, 1),
('pl005-7885-11f0-978c-42673f055dc4', 'c39c5149-7886-11f0-978c-42673f055dc4', 'sl001-7885-11f0-978c-42673f055dc4', 75, 5);

-- =====================================================================
-- 21. ALERTS DATA (including low stock alerts we created earlier)
-- =====================================================================

INSERT INTO alerts (id, alert_type, priority, title, message, status, category, product_id, product_name, current_stock, low_stock_threshold) VALUES
('32acf6f5-788c-11f0-978c-42673f055dc4', 'low_stock', 'medium', 'Low Stock: Laptop Computer', 'Laptop Computer (PRD-001) is running low. Current stock: 8 piece, Threshold: 10 piece', 'acknowledged', 'Electronics', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'Laptop Computer', 8, 10),
('32ade8ab-788c-11f0-978c-42673f055dc4', 'low_stock', 'medium', 'Low Stock: Industrial Drill', 'Industrial Drill (PRD-004) is running low. Current stock: 2 piece, Threshold: 3 piece', 'active', 'Tools', 'c39c4915-7886-11f0-978c-42673f055dc4', 'Industrial Drill', 2, 3),
('alert003-7885-11f0-978c-42673f055dc4', 'quality_issue', 'high', 'Quality Issue: Safety Helmet Batch', 'Quality issues detected in Safety Helmet production batch BATCH-20250118-002', 'active', 'Quality', 'c39c5149-7886-11f0-978c-42673f055dc4', 'Safety Helmet', NULL, NULL),
('alert004-7885-11f0-978c-42673f055dc4', 'system', 'low', 'System Maintenance Scheduled', 'Scheduled system maintenance on Sunday 2025-01-26 from 2:00 AM to 4:00 AM', 'active', 'System', NULL, NULL, NULL, NULL),
('alert005-7885-11f0-978c-42673f055dc4', 'overdue_payment', 'medium', 'Overdue Payment: Customer ABC Manufacturing', 'Payment for order CO-20250110-001 is overdue by 5 days', 'active', 'Finance', NULL, NULL, NULL, NULL);

-- =====================================================================
-- 22. ALERT HISTORY DATA
-- =====================================================================

INSERT INTO alert_history (id, alert_id, action, performed_by, previous_status, new_status, notes) VALUES
('ah001-7885-11f0-978c-42673f055dc4', '32acf6f5-788c-11f0-978c-42673f055dc4', 'created', 'System', NULL, 'active', 'Low stock alert automatically generated'),
('ah002-7885-11f0-978c-42673f055dc4', '32acf6f5-788c-11f0-978c-42673f055dc4', 'acknowledged', 'John Manager', 'active', 'acknowledged', 'Purchase order initiated'),
('ah003-7885-11f0-978c-42673f055dc4', '32ade8ab-788c-11f0-978c-42673f055dc4', 'created', 'System', NULL, 'active', 'Critical low stock alert for industrial drill'),
('ah004-7885-11f0-978c-42673f055dc4', 'alert003-7885-11f0-978c-42673f055dc4', 'created', 'QC Inspector 2', NULL, 'active', 'Quality issue escalated from inspection'),
('ah005-7885-11f0-978c-42673f055dc4', 'alert004-7885-11f0-978c-42673f055dc4', 'created', 'System Admin', NULL, 'active', 'Maintenance notification created');

-- =====================================================================
-- 23. USER ACTIVITIES DATA
-- =====================================================================

INSERT INTO user_activities (id, activity_type, table_name, record_id, description, user_name, user_role, ip_address) VALUES
('ua001-7885-11f0-978c-42673f055dc4', 'create', 'purchase_orders', 'po001-7885-11f0-978c-42673f055dc4', 'Created purchase order PO-20250101-001', 'John Doe', 'Purchase Manager', '192.168.1.100'),
('ua002-7885-11f0-978c-42673f055dc4', 'approval', 'purchase_orders', 'po001-7885-11f0-978c-42673f055dc4', 'Approved purchase order PO-20250101-001', 'Sarah Smith', 'Operations Manager', '192.168.1.101'),
('ua003-7885-11f0-978c-42673f055dc4', 'update', 'customer_orders', 'co001-7885-11f0-978c-42673f055dc4', 'Updated order status to delivered', 'Mike Johnson', 'Warehouse Supervisor', '192.168.1.102'),
('ua004-7885-11f0-978c-42673f055dc4', 'create', 'qc_inspections', 'qci001-7885-11f0-978c-42673f055dc4', 'Created QC inspection QC-20250115-001', 'QC Inspector 1', 'Quality Inspector', '192.168.1.103'),
('ua005-7885-11f0-978c-42673f055dc4', 'export', 'products', NULL, 'Exported products data to CSV', 'Lisa Brown', 'Inventory Manager', '192.168.1.104');

-- =====================================================================
-- 24. SYSTEM SETTINGS DATA
-- =====================================================================

INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, updated_by) VALUES
('ss001-7885-11f0-978c-42673f055dc4', 'company_name', 'AI Stock Management Corp', 'string', 'company', 'Company name displayed in the system', 'Admin'),
('ss002-7885-11f0-978c-42673f055dc4', 'company_address', '123 Business Street, Tech City, TC 12345, India', 'string', 'company', 'Company address for documents', 'Admin'),
('ss003-7885-11f0-978c-42673f055dc4', 'company_phone', '+91 98765 43210', 'string', 'company', 'Company phone number', 'Admin'),
('ss004-7885-11f0-978c-42673f055dc4', 'company_email', 'contact@aistockmanagement.com', 'string', 'company', 'Company email address', 'Admin'),
('ss005-7885-11f0-978c-42673f055dc4', 'gst_enabled', 'true', 'boolean', 'gst', 'Enable GST calculations', 'Admin'),
('ss006-7885-11f0-978c-42673f055dc4', 'gst_rate', '18', 'number', 'gst', 'Default GST rate percentage', 'Admin'),
('ss007-7885-11f0-978c-42673f055dc4', 'low_stock_alerts', 'true', 'boolean', 'notifications', 'Enable automatic low stock alerts', 'Admin'),
('ss008-7885-11f0-978c-42673f055dc4', 'currency', 'INR', 'string', 'display', 'Default currency for the system', 'Admin'),
('ss009-7885-11f0-978c-42673f055dc4', 'date_format', 'DD/MM/YYYY', 'string', 'display', 'Date format used throughout the system', 'Admin'),
('ss010-7885-11f0-978c-42673f055dc4', 'auto_po_approval_limit', '50000', 'number', 'workflow', 'Auto-approve purchase orders below this amount', 'Admin');

-- =====================================================================
-- 25. BILLS DATA
-- =====================================================================

INSERT INTO bills (id, bill_number, supplier_id, supplier_name, bill_type, bill_date, due_date, total_amount, tax_amount, final_amount, payment_status, status) VALUES
('bill001-7885-11f0-978c-42673f055dc4', 'INV-TECH-001', 'fc072251-7885-11f0-978c-42673f055dc4', 'TechSupply Co.', 'purchase', '2025-01-15', '2025-02-14', 25000.00, 4500.00, 29500.00, 'paid', 'processed'),
('bill002-7885-11f0-978c-42673f055dc4', 'INV-IND-002', 'fc09c2a0-7885-11f0-978c-42673f055dc4', 'Industrial Equipment Inc.', 'purchase', '2025-01-18', '2025-03-04', 16000.00, 2880.00, 18880.00, 'pending', 'approved'),
('bill003-7885-11f0-978c-42673f055dc4', 'SALES-ABC-001', 'cust001-7885-11f0-978c-42673f055dc4', 'ABC Manufacturing Ltd', 'sales', '2025-01-10', '2025-02-09', 18000.00, 3240.00, 21240.00, 'paid', 'processed'),
('bill004-7885-11f0-978c-42673f055dc4', 'SALES-XYZ-002', 'cust002-7885-11f0-978c-42673f055dc4', 'XYZ Electronics Pvt Ltd', 'sales', '2025-01-12', '2025-02-11', 1800.00, 324.00, 2124.00, 'paid', 'processed');

-- =====================================================================
-- 26. BILL ITEMS DATA
-- =====================================================================

INSERT INTO bill_items (id, bill_id, product_id, product_name, quantity, unit_price, total_price, tax_rate, tax_amount) VALUES
('bi001-7885-11f0-978c-42673f055dc4', 'bill001-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'Laptop Computer', 20, 1200.00, 24000.00, 18.00, 4320.00),
('bi002-7885-11f0-978c-42673f055dc4', 'bill001-7885-11f0-978c-42673f055dc4', 'c39c3ffd-7886-11f0-978c-42673f055dc4', 'Printer Paper', 100, 8.50, 850.00, 18.00, 153.00),
('bi003-7885-11f0-978c-42673f055dc4', 'bill002-7885-11f0-978c-42673f055dc4', 'c39c4915-7886-11f0-978c-42673f055dc4', 'Industrial Drill', 20, 800.00, 16000.00, 18.00, 2880.00),
('bi004-7885-11f0-978c-42673f055dc4', 'bill003-7885-11f0-978c-42673f055dc4', 'c39bbe9f-7886-11f0-978c-42673f055dc4', 'Laptop Computer', 15, 1200.00, 18000.00, 18.00, 3240.00),
('bi005-7885-11f0-978c-42673f055dc4', 'bill004-7885-11f0-978c-42673f055dc4', 'c39c2a76-7886-11f0-978c-42673f055dc4', 'Office Chair', 4, 450.00, 1800.00, 18.00, 324.00);

-- Re-enable foreign key checks
SET foreign_key_checks = 1;

-- =====================================================================
-- UPDATE UTILIZATION PERCENTAGES
-- =====================================================================

-- Update storage location utilization percentages
UPDATE storage_locations sl
SET utilization_percentage = CASE 
    WHEN sl.capacity_units > 0 THEN
        ROUND((sl.occupied_units / sl.capacity_units) * 100, 2)
    ELSE 0 
END;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Show summary of inserted data
SELECT 
    'Suppliers' as table_name, COUNT(*) as record_count FROM suppliers
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Product Categories', COUNT(*) FROM product_categories
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Purchase Order Items', COUNT(*) FROM purchase_order_items
UNION ALL
SELECT 'Customer Orders', COUNT(*) FROM customer_orders
UNION ALL
SELECT 'Customer Order Items', COUNT(*) FROM customer_order_items
UNION ALL
SELECT 'Stock Movements', COUNT(*) FROM stock_movements
UNION ALL
SELECT 'Stock Out Requests', COUNT(*) FROM stock_out_requests
UNION ALL
SELECT 'Stock Out Items', COUNT(*) FROM stock_out_items
UNION ALL
SELECT 'Raw Materials', COUNT(*) FROM raw_materials
UNION ALL
SELECT 'Product Recipes', COUNT(*) FROM product_recipes
UNION ALL
SELECT 'Recipe Materials', COUNT(*) FROM recipe_materials
UNION ALL
SELECT 'Production Batches', COUNT(*) FROM production_batches
UNION ALL
SELECT 'QC Inspections', COUNT(*) FROM qc_inspections
UNION ALL
SELECT 'QC Defects', COUNT(*) FROM qc_defects
UNION ALL
SELECT 'QC Hold Items', COUNT(*) FROM qc_hold_items
UNION ALL
SELECT 'Storage Locations', COUNT(*) FROM storage_locations
UNION ALL
SELECT 'Product Locations', COUNT(*) FROM product_locations
UNION ALL
SELECT 'Alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'Alert History', COUNT(*) FROM alert_history
UNION ALL
SELECT 'User Activities', COUNT(*) FROM user_activities
UNION ALL
SELECT 'System Settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'Bills', COUNT(*) FROM bills
UNION ALL
SELECT 'Bill Items', COUNT(*) FROM bill_items;

-- Show low stock products
SELECT 
    p.name,
    p.current_stock,
    p.low_stock_threshold,
    CASE 
        WHEN p.current_stock = 0 THEN 'Out of Stock'
        WHEN p.current_stock <= (p.low_stock_threshold * 0.5) THEN 'Critical'
        WHEN p.current_stock <= p.low_stock_threshold THEN 'Low Stock'
        ELSE 'Normal'
    END as stock_status
FROM products p
WHERE p.current_stock <= p.low_stock_threshold
ORDER BY p.current_stock ASC;

-- Show active alerts
SELECT 
    alert_type,
    priority,
    title,
    status,
    product_name,
    created_at
FROM alerts
WHERE status = 'active'
ORDER BY priority DESC, created_at DESC;

-- Success message
SELECT 'Sample data insertion completed successfully! 🎉' as Message,
       'Your database now has comprehensive sample data for testing all features.' as Description;
