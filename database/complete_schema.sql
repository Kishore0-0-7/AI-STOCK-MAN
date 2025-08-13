-- AI STOCK MANAGEMENT - Complete MySQL Database Schema
-- Based on comprehensive analysis of all frontend pages
-- Created: 2025-01-13
-- Version: 1.0

-- Enable foreign key checks and set up database
SET foreign_key_checks = 1;
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ai_stock_management
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE ai_stock_management;

-- =============================================================================
-- CORE ENTITIES
-- =============================================================================

-- 1. SUPPLIERS TABLE
-- Supports: Suppliers.tsx, SupplierDetails.tsx, PurchaseOrders.tsx
CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    category ENUM('Electronics', 'Office Supplies', 'Food & Beverages', 'Industrial', 'Healthcare', 'General') DEFAULT 'General',
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    payment_terms VARCHAR(100) DEFAULT 'NET_30',
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    tax_id VARCHAR(50),
    website VARCHAR(255),
    notes TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    contract_type ENUM('annual', 'project_based', 'ongoing') DEFAULT 'ongoing',
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_supplier_status (status),
    INDEX idx_supplier_category (category),
    INDEX idx_supplier_name (name),
    INDEX idx_supplier_email (email)
);

-- 2. CATEGORIES TABLE
-- Supports: Products.tsx category management
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category_name (name),
    INDEX idx_category_parent (parent_id),
    INDEX idx_category_active (is_active)
);

-- 3. PRODUCTS TABLE  
-- Supports: Products.tsx, Dashboard.tsx, StockSummary.tsx
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(36),
    supplier_id VARCHAR(36),
    
    -- Pricing
    cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Stock Management
    current_stock INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    max_stock_capacity INT DEFAULT 1000,
    reorder_quantity INT DEFAULT 50,
    
    -- Product Details
    unit ENUM('pcs', 'kg', 'ltr', 'box', 'pack', 'meter', 'gram') DEFAULT 'pcs',
    barcode VARCHAR(50) UNIQUE,
    qr_code TEXT,
    location VARCHAR(100),
    
    -- Quality & Compliance
    expiry_date DATE,
    batch_number VARCHAR(50),
    manufacturing_date DATE,
    
    -- Status & Metadata
    status ENUM('active', 'inactive', 'discontinued', 'out_of_stock') DEFAULT 'active',
    is_serialized BOOLEAN DEFAULT FALSE,
    weight DECIMAL(8,3),
    dimensions VARCHAR(50), -- L x W x H
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    
    INDEX idx_product_sku (sku),
    INDEX idx_product_name (name),
    INDEX idx_product_category (category_id),
    INDEX idx_product_supplier (supplier_id),
    INDEX idx_product_status (status),
    INDEX idx_product_stock (current_stock),
    INDEX idx_product_low_stock (current_stock, low_stock_threshold),
    INDEX idx_product_barcode (barcode)
);

-- 4. CUSTOMERS TABLE
-- Supports: SalesReports.tsx, OutboundDashboard.tsx
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    tax_id VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    payment_terms VARCHAR(100) DEFAULT 'IMMEDIATE',
    customer_type ENUM('individual', 'business', 'wholesale', 'retail') DEFAULT 'individual',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_name (name),
    INDEX idx_customer_email (email),
    INDEX idx_customer_status (status),
    INDEX idx_customer_type (customer_type)
);

-- =============================================================================
-- INVENTORY MANAGEMENT
-- =============================================================================

-- 5. WAREHOUSES/STORAGE LOCATIONS
-- Supports: StorageUtilizationDashboard.tsx
CREATE TABLE warehouses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    manager_name VARCHAR(255),
    capacity_cubic_meters DECIMAL(12,3) DEFAULT 0.000,
    current_utilization DECIMAL(12,3) DEFAULT 0.000,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    warehouse_type ENUM('main', 'overflow', 'quarantine', 'returns') DEFAULT 'main',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_warehouse_code (code),
    INDEX idx_warehouse_status (status),
    INDEX idx_warehouse_type (warehouse_type)
);

-- 6. STORAGE RACKS/ZONES
-- Supports: StorageUtilizationDashboard.tsx heat map and rack utilization
CREATE TABLE storage_racks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    warehouse_id VARCHAR(36) NOT NULL,
    rack_code VARCHAR(50) NOT NULL,
    zone VARCHAR(50),
    aisle VARCHAR(20),
    level_number INT DEFAULT 1,
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    capacity_units INT DEFAULT 100,
    occupied_units INT DEFAULT 0,
    status ENUM('available', 'near-full', 'full', 'overfilled', 'maintenance') DEFAULT 'available',
    temperature_controlled BOOLEAN DEFAULT FALSE,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rack_location (warehouse_id, rack_code),
    
    INDEX idx_rack_warehouse (warehouse_id),
    INDEX idx_rack_status (status),
    INDEX idx_rack_utilization (occupied_units, capacity_units),
    INDEX idx_rack_position (position_x, position_y)
);

-- 7. STOCK MOVEMENTS 
-- Supports: StockSummary.tsx movements tracking, InboundDashboard.tsx, OutboundDashboard.tsx
CREATE TABLE stock_movements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    movement_type ENUM('inbound', 'outbound', 'adjustment', 'transfer', 'return', 'damage', 'expiry') NOT NULL,
    transaction_type ENUM('purchase', 'sale', 'production', 'quality_check', 'manual_adjustment', 'transfer', 'return') NOT NULL,
    reference_id VARCHAR(36), -- Links to purchase_orders, customer_orders, etc.
    reference_type ENUM('purchase_order', 'customer_order', 'production_order', 'adjustment', 'transfer', 'return'),
    
    warehouse_id VARCHAR(36),
    rack_id VARCHAR(36),
    
    quantity_before INT NOT NULL,
    quantity_change INT NOT NULL, -- Positive for inbound, negative for outbound
    quantity_after INT NOT NULL,
    
    unit_cost DECIMAL(12,2) DEFAULT 0.00,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    
    batch_number VARCHAR(50),
    serial_numbers JSON, -- For serialized items
    
    reason VARCHAR(255),
    notes TEXT,
    performed_by VARCHAR(100),
    
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (rack_id) REFERENCES storage_racks(id) ON DELETE SET NULL,
    
    INDEX idx_stock_movement_product (product_id),
    INDEX idx_stock_movement_type (movement_type),
    INDEX idx_stock_movement_date (movement_date),
    INDEX idx_stock_movement_reference (reference_id, reference_type),
    INDEX idx_stock_movement_warehouse (warehouse_id)
);

-- =============================================================================
-- PURCHASE MANAGEMENT
-- =============================================================================

-- 8. PURCHASE ORDERS
-- Supports: PurchaseOrders.tsx, InboundDashboard.tsx
CREATE TABLE purchase_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    
    -- Order Details
    order_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Financial
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    shipping_cost DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Status Tracking
    status ENUM('draft', 'pending', 'approved', 'shipped', 'partially_received', 'received', 'cancelled', 'closed') DEFAULT 'draft',
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    payment_status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
    
    -- Additional Info
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    warehouse_id VARCHAR(36),
    notes TEXT,
    terms_conditions TEXT,
    
    -- Audit
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    
    INDEX idx_po_number (order_number),
    INDEX idx_po_supplier (supplier_id),
    INDEX idx_po_status (status),
    INDEX idx_po_order_date (order_date),
    INDEX idx_po_expected_delivery (expected_delivery_date),
    INDEX idx_po_payment_status (payment_status)
);

-- 9. PURCHASE ORDER ITEMS
CREATE TABLE purchase_order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    purchase_order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    
    quantity_ordered INT NOT NULL,
    quantity_received INT DEFAULT 0,
    quantity_pending INT GENERATED ALWAYS AS (quantity_ordered - quantity_received) STORED,
    
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    
    INDEX idx_poi_purchase_order (purchase_order_id),
    INDEX idx_poi_product (product_id),
    INDEX idx_poi_pending (quantity_pending)
);

-- =============================================================================
-- SALES MANAGEMENT
-- =============================================================================

-- 10. CUSTOMER ORDERS
-- Supports: OutboundDashboard.tsx, SalesReports.tsx, StockOutManagement.tsx
CREATE TABLE customer_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    
    -- Order Details
    order_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    delivery_date DATE,
    delivered_date DATE,
    
    -- Financial
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    shipping_cost DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Status Tracking
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
    payment_method ENUM('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'credit') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'partial', 'failed', 'refunded') DEFAULT 'pending',
    
    -- Delivery Info
    delivery_address TEXT,
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    warehouse_id VARCHAR(36),
    
    -- Priority & Type
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    order_type ENUM('regular', 'rush', 'back_order', 'drop_ship') DEFAULT 'regular',
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    
    INDEX idx_co_order_number (order_number),
    INDEX idx_co_customer (customer_id),
    INDEX idx_co_status (status),
    INDEX idx_co_order_date (order_date),
    INDEX idx_co_delivery_date (delivery_date),
    INDEX idx_co_payment_status (payment_status),
    INDEX idx_co_priority (priority)
);

-- 11. CUSTOMER ORDER ITEMS
CREATE TABLE customer_order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    
    quantity_ordered INT NOT NULL,
    quantity_dispatched INT DEFAULT 0,
    quantity_pending INT GENERATED ALWAYS AS (quantity_ordered - quantity_dispatched) STORED,
    
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    
    INDEX idx_coi_customer_order (customer_order_id),
    INDEX idx_coi_product (product_id),
    INDEX idx_coi_pending (quantity_pending)
);

-- =============================================================================
-- PRODUCTION MANAGEMENT
-- =============================================================================

-- 12. RAW MATERIALS
-- Supports: ProductionCalculator.tsx
CREATE TABLE raw_materials (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    unit ENUM('kg', 'ltr', 'pcs', 'meter', 'gram', 'ton') DEFAULT 'kg',
    
    current_stock DECIMAL(12,3) DEFAULT 0.000,
    low_stock_threshold DECIMAL(12,3) DEFAULT 10.000,
    cost_per_unit DECIMAL(12,2) NOT NULL,
    
    supplier_id VARCHAR(36),
    storage_requirements TEXT,
    shelf_life_days INT,
    
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    
    INDEX idx_raw_material_code (code),
    INDEX idx_raw_material_category (category),
    INDEX idx_raw_material_status (status)
);

-- 13. BILL OF MATERIALS (BOM)
-- Supports: ProductionCalculator.tsx material requirements
CREATE TABLE bill_of_materials (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    raw_material_id VARCHAR(36) NOT NULL,
    
    quantity_required DECIMAL(12,3) NOT NULL,
    wastage_percentage DECIMAL(5,2) DEFAULT 0.00,
    effective_quantity DECIMAL(12,3) GENERATED ALWAYS AS (quantity_required * (1 + wastage_percentage/100)) STORED,
    
    is_critical BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    
    UNIQUE KEY unique_product_material (product_id, raw_material_id),
    INDEX idx_bom_product (product_id),
    INDEX idx_bom_material (raw_material_id)
);

-- 14. PRODUCTION ORDERS
-- Supports: ProductionCalculator.tsx production planning
CREATE TABLE production_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    
    quantity_planned INT NOT NULL,
    quantity_produced INT DEFAULT 0,
    quantity_remaining INT GENERATED ALWAYS AS (quantity_planned - quantity_produced) STORED,
    
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0.00,
    
    status ENUM('draft', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    warehouse_id VARCHAR(36),
    supervisor VARCHAR(100),
    shift VARCHAR(20),
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    
    INDEX idx_prod_order_number (order_number),
    INDEX idx_prod_product (product_id),
    INDEX idx_prod_status (status),
    INDEX idx_prod_dates (planned_start_date, planned_end_date)
);

-- =============================================================================
-- QUALITY CONTROL
-- =============================================================================

-- 15. QUALITY CHECKS
-- Supports: QcDashboard.tsx
CREATE TABLE quality_checks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    batch_number VARCHAR(50),
    
    inspection_type ENUM('incoming', 'in_process', 'final', 'random', 'complaint') NOT NULL,
    inspector_name VARCHAR(100) NOT NULL,
    inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    quantity_inspected INT NOT NULL,
    quantity_passed INT DEFAULT 0,
    quantity_failed INT DEFAULT 0,
    quantity_rework INT DEFAULT 0,
    
    status ENUM('pending', 'pass', 'fail', 'conditional_pass', 'hold') NOT NULL,
    
    -- Results
    defect_types JSON, -- Array of defect types found
    defect_severity ENUM('minor', 'major', 'critical') DEFAULT 'minor',
    
    rejection_reason TEXT,
    corrective_action TEXT,
    
    reference_id VARCHAR(36), -- Links to purchase_orders, production_orders etc.
    reference_type ENUM('purchase_order', 'production_order', 'customer_complaint', 'routine'),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    
    INDEX idx_qc_product (product_id),
    INDEX idx_qc_type (inspection_type),
    INDEX idx_qc_status (status),
    INDEX idx_qc_date (inspection_date),
    INDEX idx_qc_inspector (inspector_name),
    INDEX idx_qc_reference (reference_id, reference_type)
);

-- 16. QC HOLD ITEMS
-- Supports: QcDashboard.tsx hold management
CREATE TABLE qc_hold_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    quality_check_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    
    item_code VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INT NOT NULL,
    
    hold_reason TEXT NOT NULL,
    hold_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    status ENUM('hold', 'rework', 'scrap', 'released') DEFAULT 'hold',
    
    released_date TIMESTAMP NULL,
    released_by VARCHAR(100),
    release_notes TEXT,
    
    scrap_value DECIMAL(12,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (quality_check_id) REFERENCES quality_checks(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    
    INDEX idx_hold_qc (quality_check_id),
    INDEX idx_hold_product (product_id),
    INDEX idx_hold_status (status),
    INDEX idx_hold_date (hold_date)
);

-- =============================================================================
-- ALERTS & NOTIFICATIONS
-- =============================================================================

-- 17. ALERTS
-- Supports: LowStockAlerts.tsx, Dashboard.tsx alerts
CREATE TABLE alerts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    type ENUM('low_stock', 'expiry_warning', 'quality_issue', 'supplier_delay', 'system', 'manual', 'overstock', 'zero_stock') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    product_id VARCHAR(36),
    supplier_id VARCHAR(36),
    customer_id VARCHAR(36),
    order_id VARCHAR(36),
    
    -- Alert specifics
    current_stock INT,
    low_stock_threshold INT,
    
    -- Resolution
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP NULL,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    
    -- Auto-resolution
    auto_resolve BOOLEAN DEFAULT FALSE,
    auto_resolve_condition VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    INDEX idx_alert_type (type),
    INDEX idx_alert_priority (priority),
    INDEX idx_alert_status (status),
    INDEX idx_alert_created (created_at),
    INDEX idx_alert_product (product_id)
);

-- =============================================================================
-- SYSTEM CONFIGURATION & AUDIT
-- =============================================================================

-- 18. ACTIVITY LOG
-- Supports: Dashboard.tsx activity tracking
CREATE TABLE activity_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    activity_type ENUM('create', 'update', 'delete', 'login', 'logout', 'purchase', 'sale', 'stock_adjustment', 'quality_check', 'alert') NOT NULL,
    entity_type ENUM('product', 'supplier', 'customer', 'purchase_order', 'customer_order', 'stock_movement', 'user', 'alert') NOT NULL,
    entity_id VARCHAR(36),
    
    user_name VARCHAR(100) NOT NULL,
    user_role ENUM('admin', 'manager', 'operator', 'viewer') DEFAULT 'operator',
    
    description TEXT NOT NULL,
    
    -- Changed data (JSON format for flexibility)
    old_values JSON,
    new_values JSON,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_entity (entity_type, entity_id),
    INDEX idx_activity_user (user_name),
    INDEX idx_activity_created (created_at)
);

-- 19. SYSTEM SETTINGS
-- Supports: Settings.tsx
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category VARCHAR(100) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_setting (category, setting_key),
    INDEX idx_setting_category (category),
    INDEX idx_setting_key (setting_key)
);

-- =============================================================================
-- REPORTING & ANALYTICS VIEWS
-- =============================================================================

-- View for Dashboard Overview
CREATE VIEW dashboard_overview AS
SELECT 
    (SELECT COUNT(*) FROM products WHERE status = 'active') as total_products,
    (SELECT COUNT(*) FROM products WHERE current_stock <= low_stock_threshold) as low_stock_products,
    (SELECT COUNT(*) FROM suppliers WHERE status = 'active') as active_suppliers,
    (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('pending', 'approved', 'shipped')) as pending_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE MONTH(order_date) = MONTH(CURRENT_DATE()) AND YEAR(order_date) = YEAR(CURRENT_DATE())) as monthly_procurement,
    (SELECT COALESCE(SUM(total_amount), 0) FROM customer_orders WHERE order_date = CURRENT_DATE()) as daily_sales,
    (SELECT COUNT(*) FROM alerts WHERE status = 'active') as active_alerts;

-- View for Low Stock Products
CREATE VIEW low_stock_products AS
SELECT 
    p.id,
    p.sku,
    p.name,
    c.name as category_name,
    p.current_stock,
    p.low_stock_threshold,
    p.price,
    s.name as supplier_name,
    s.id as supplier_id,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.current_stock <= p.low_stock_threshold
    AND p.status = 'active';

-- View for Sales Analytics
CREATE VIEW sales_analytics AS
SELECT 
    DATE(co.order_date) as order_date,
    COUNT(*) as total_orders,
    SUM(co.total_amount) as total_revenue,
    SUM(co.total_amount - (coi.quantity_ordered * p.cost)) as total_profit,
    AVG(co.total_amount) as avg_order_value,
    SUM(coi.quantity_ordered) as total_quantity_sold,
    COUNT(DISTINCT coi.product_id) as unique_products_sold
FROM customer_orders co
JOIN customer_order_items coi ON co.id = coi.customer_order_id
JOIN products p ON coi.product_id = p.id
WHERE co.status NOT IN ('cancelled')
GROUP BY DATE(co.order_date)
ORDER BY order_date DESC;

-- View for Storage Utilization
CREATE VIEW storage_utilization AS
SELECT 
    w.id as warehouse_id,
    w.name as warehouse_name,
    COUNT(sr.id) as total_racks,
    SUM(sr.capacity_units) as total_capacity,
    SUM(sr.occupied_units) as total_occupied,
    ROUND((SUM(sr.occupied_units) / SUM(sr.capacity_units)) * 100, 2) as utilization_percentage,
    COUNT(CASE WHEN sr.status = 'near-full' THEN 1 END) as near_full_racks,
    COUNT(CASE WHEN sr.status = 'full' THEN 1 END) as full_racks
FROM warehouses w
LEFT JOIN storage_racks sr ON w.id = sr.warehouse_id
WHERE w.status = 'active'
GROUP BY w.id, w.name;

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic components and devices'),
('Office Supplies', 'Office and administrative supplies'),
('Raw Materials', 'Raw materials for production'),
('Finished Goods', 'Completed products ready for sale'),
('Consumables', 'Items consumed during production or operations');

-- Insert default warehouse
INSERT INTO warehouses (name, code, address, capacity_cubic_meters) VALUES
('Main Warehouse', 'WH001', 'Main facility address', 10000.000);

-- Insert system settings
INSERT INTO system_settings (category, setting_key, setting_value, description) VALUES
('inventory', 'auto_reorder_enabled', 'true', 'Enable automatic reorder when stock hits threshold'),
('inventory', 'default_low_stock_threshold', '10', 'Default low stock threshold for new products'),
('quality', 'mandatory_qc_for_incoming', 'true', 'Require QC check for all incoming goods'),
('alerts', 'low_stock_notification_enabled', 'true', 'Send notifications for low stock alerts'),
('reports', 'dashboard_refresh_interval', '300', 'Dashboard refresh interval in seconds');

-- =============================================================================
-- TRIGGERS FOR AUTOMATION
-- =============================================================================

-- Trigger to update product stock after stock movement
DELIMITER //
CREATE TRIGGER update_product_stock_after_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW
BEGIN
    UPDATE products 
    SET current_stock = NEW.quantity_after,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
END//

-- Trigger to create low stock alert
CREATE TRIGGER create_low_stock_alert
    AFTER UPDATE ON products
    FOR EACH ROW
BEGIN
    IF NEW.current_stock <= NEW.low_stock_threshold AND OLD.current_stock > OLD.low_stock_threshold THEN
        INSERT INTO alerts (
            type, priority, title, message, product_id, current_stock, low_stock_threshold
        ) VALUES (
            'low_stock', 
            'medium',
            CONCAT('Low Stock Alert: ', NEW.name),
            CONCAT('Product ', NEW.name, ' (SKU: ', NEW.sku, ') is running low on stock. Current: ', NEW.current_stock, ', Threshold: ', NEW.low_stock_threshold),
            NEW.id,
            NEW.current_stock,
            NEW.low_stock_threshold
        );
    END IF;
END//

-- Trigger to log activity
CREATE TRIGGER log_product_activity
    AFTER INSERT ON products
    FOR EACH ROW
BEGIN
    INSERT INTO activity_log (activity_type, entity_type, entity_id, user_name, description, new_values)
    VALUES (
        'create',
        'product',
        NEW.id,
        COALESCE(@current_user, 'system'),
        CONCAT('Created new product: ', NEW.name, ' (SKU: ', NEW.sku, ')'),
        JSON_OBJECT('name', NEW.name, 'sku', NEW.sku, 'category_id', NEW.category_id, 'current_stock', NEW.current_stock)
    );
END//

DELIMITER ;

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Additional performance indexes based on expected queries
CREATE INDEX idx_stock_movements_compound ON stock_movements (product_id, movement_date DESC, movement_type);
CREATE INDEX idx_purchase_orders_compound ON purchase_orders (supplier_id, status, order_date DESC);
CREATE INDEX idx_customer_orders_compound ON customer_orders (customer_id, status, order_date DESC);
CREATE INDEX idx_quality_checks_compound ON quality_checks (product_id, inspection_date DESC, status);
CREATE INDEX idx_alerts_active ON alerts (status, type, priority, created_at DESC) WHERE status = 'active';

-- Full-text search indexes for better search performance
ALTER TABLE products ADD FULLTEXT(name, description);
ALTER TABLE suppliers ADD FULLTEXT(name, contact_person);
ALTER TABLE customers ADD FULLTEXT(name, address);

-- =============================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =============================================================================

-- Procedure to calculate reorder suggestions
DELIMITER //
CREATE PROCEDURE GetReorderSuggestions()
BEGIN
    SELECT 
        p.id,
        p.sku,
        p.name,
        p.current_stock,
        p.low_stock_threshold,
        p.reorder_quantity,
        s.name as supplier_name,
        s.id as supplier_id,
        DATEDIFF(CURRENT_DATE, MAX(sm.movement_date)) as days_since_last_movement,
        COALESCE(AVG(daily_usage.daily_consumption), 0) as avg_daily_consumption
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN stock_movements sm ON p.id = sm.product_id AND sm.movement_type = 'outbound'
    LEFT JOIN (
        SELECT 
            product_id,
            ABS(SUM(quantity_change)) / COUNT(DISTINCT DATE(movement_date)) as daily_consumption
        FROM stock_movements 
        WHERE movement_type = 'outbound' 
            AND movement_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        GROUP BY product_id
    ) daily_usage ON p.id = daily_usage.product_id
    WHERE p.current_stock <= p.low_stock_threshold
        AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.current_stock ASC;
END//

-- Procedure to get stock movement trends
CREATE PROCEDURE GetStockMovementTrends(IN days_back INT)
BEGIN
    SELECT 
        DATE(movement_date) as movement_date,
        movement_type,
        COUNT(*) as transaction_count,
        SUM(ABS(quantity_change)) as total_quantity,
        AVG(ABS(quantity_change)) as avg_quantity_per_transaction
    FROM stock_movements
    WHERE movement_date >= DATE_SUB(CURRENT_DATE, INTERVAL days_back DAY)
    GROUP BY DATE(movement_date), movement_type
    ORDER BY movement_date DESC, movement_type;
END//

DELIMITER ;

-- =============================================================================
-- DATABASE SETUP COMPLETION MESSAGE
-- =============================================================================

SELECT 'AI Stock Management Database Schema Created Successfully!' as status,
       NOW() as created_at,
       'Ready for integration with frontend application' as message;

-- Show table counts for verification
SELECT 
    'Tables Created' as component,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'ai_stock_management' 
    AND table_type = 'BASE TABLE';

-- Show view counts
SELECT 
    'Views Created' as component,
    COUNT(*) as count
FROM information_schema.views 
WHERE table_schema = 'ai_stock_management';

-- Show stored procedures count
SELECT 
    'Stored Procedures Created' as component,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'ai_stock_management' 
    AND routine_type = 'PROCEDURE';
