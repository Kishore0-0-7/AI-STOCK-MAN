-- =====================================================================
-- AI STOCK MANAGEMENT SYSTEM - MySQL Database Schema
-- =====================================================================
-- This schema supports all features from your frontend application
-- Created: 2024-01-13
-- Version: 2.0
-- =====================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS ai_stock_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ai_stock_management;

-- Enable foreign key checks
SET foreign_key_checks = 1;
-- Set SQL mode for compatibility (MySQL 8.0+ compatible)
SET sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =====================================================================
-- CORE MASTER TABLES
-- =====================================================================

-- 1. SUPPLIERS TABLE
-- Used by: Suppliers.tsx, SupplierDetails.tsx, PurchaseOrders.tsx
CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    category ENUM('Electronics', 'Office Supplies', 'Food & Beverages', 'Industrial', 'Healthcare', 'General') DEFAULT 'General',
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    website VARCHAR(255),
    payment_terms VARCHAR(100) DEFAULT 'NET_30',
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    tax_id VARCHAR(50),
    notes TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    contract_type ENUM('annual', 'project_based', 'ongoing') DEFAULT 'ongoing',
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_supplier_status (status),
    INDEX idx_supplier_category (category),
    INDEX idx_supplier_name (name),
    INDEX idx_supplier_email (email)
);

-- 2. CUSTOMERS TABLE
-- Used by: SalesReports.tsx, CustomerOrder functionality
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    customer_type ENUM('individual', 'business') DEFAULT 'individual',
    company VARCHAR(255),
    tax_id VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    payment_terms VARCHAR(100) DEFAULT 'NET_30',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_customer_status (status),
    INDEX idx_customer_type (customer_type),
    INDEX idx_customer_name (name),
    INDEX idx_customer_email (email)
);

-- 3. PRODUCT CATEGORIES TABLE
-- Used by: Products.tsx, ProductionCalculator.tsx
CREATE TABLE product_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id VARCHAR(36),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    INDEX idx_category_status (status),
    INDEX idx_category_name (name)
);

-- 4. PRODUCTS TABLE
-- Used by: Products.tsx, Dashboard.tsx, StockSummary.tsx, ProductionCalculator.tsx
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(36),
    category VARCHAR(100), -- Denormalized for backward compatibility
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    current_stock INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    max_stock_level INT DEFAULT 1000,
    unit VARCHAR(50) DEFAULT 'pieces',
    barcode VARCHAR(100),
    qr_code VARCHAR(255),
    supplier_id VARCHAR(36),
    reorder_level INT DEFAULT 0,
    reorder_quantity INT DEFAULT 0,
    location VARCHAR(100),
    weight DECIMAL(8,3),
    dimensions VARCHAR(100),
    shelf_life_days INT,
    manufacturing_date DATE,
    expiry_date DATE,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    INDEX idx_product_status (status),
    INDEX idx_product_category (category),
    INDEX idx_product_supplier (supplier_id),
    INDEX idx_product_stock (current_stock),
    INDEX idx_product_sku (sku),
    INDEX idx_product_name (name)
);

-- =====================================================================
-- PURCHASE MANAGEMENT
-- =====================================================================

-- 5. PURCHASE ORDERS TABLE
-- Used by: PurchaseOrders.tsx, InboundDashboard.tsx
CREATE TABLE purchase_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status ENUM('draft', 'pending', 'approved', 'shipped', 'received', 'completed', 'cancelled') DEFAULT 'draft',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    final_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_terms VARCHAR(100),
    delivery_address TEXT,
    notes TEXT,
    created_by VARCHAR(255),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    INDEX idx_po_supplier (supplier_id),
    INDEX idx_po_status (status),
    INDEX idx_po_order_date (order_date),
    INDEX idx_po_number (order_number)
);

-- 6. PURCHASE ORDER ITEMS TABLE
-- Used by: PurchaseOrders.tsx, InboundDashboard.tsx
CREATE TABLE purchase_order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    purchase_order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    received_quantity INT DEFAULT 0,
    quality_status ENUM('pending', 'approved', 'rejected', 'hold') DEFAULT 'pending',
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_po_item_order (purchase_order_id),
    INDEX idx_po_item_product (product_id),
    INDEX idx_po_item_status (quality_status)
);

-- =====================================================================
-- SALES MANAGEMENT
-- =====================================================================

-- 7. CUSTOMER ORDERS TABLE
-- Used by: SalesReports.tsx, OutboundDashboard.tsx
CREATE TABLE customer_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    order_date DATE NOT NULL,
    delivery_date DATE,
    required_date DATE,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    order_type ENUM('customer_order', 'work_order', 'transfer_order') DEFAULT 'customer_order',
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    final_amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'credit') DEFAULT 'cash',
    payment_status ENUM('pending', 'partial', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    INDEX idx_customer_order_customer (customer_id),
    INDEX idx_customer_order_status (status),
    INDEX idx_customer_order_date (order_date),
    INDEX idx_customer_order_number (order_number)
);

-- 8. CUSTOMER ORDER ITEMS TABLE
-- Used by: SalesReports.tsx, OutboundDashboard.tsx
CREATE TABLE customer_order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    allocated_quantity INT DEFAULT 0,
    dispatched_quantity INT DEFAULT 0,
    available_stock INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_item_order (order_id),
    INDEX idx_order_item_product (product_id)
);

-- =====================================================================
-- INVENTORY MANAGEMENT
-- =====================================================================

-- 9. STOCK MOVEMENTS TABLE
-- Used by: StockSummary.tsx, Dashboard.tsx, StorageUtilizationDashboard.tsx
CREATE TABLE stock_movements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    movement_type ENUM('in', 'out', 'adjustment', 'transfer') NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2),
    total_value DECIMAL(15,2),
    reference_type ENUM('purchase_order', 'customer_order', 'adjustment', 'transfer', 'production', 'waste') NOT NULL,
    reference_id VARCHAR(36),
    reference_number VARCHAR(100),
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    reason VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_stock_movement_product (product_id),
    INDEX idx_stock_movement_type (movement_type),
    INDEX idx_stock_movement_date (created_at),
    INDEX idx_stock_movement_reference (reference_type, reference_id)
);

-- 10. STOCK OUT REQUESTS TABLE
-- Used by: StockOutManagement.tsx
CREATE TABLE stock_out_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    request_number VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    request_date DATE NOT NULL,
    required_date DATE NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status ENUM('draft', 'submitted', 'approved', 'processing', 'completed', 'cancelled') DEFAULT 'draft',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    total_items INT DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP NULL,
    processed_by VARCHAR(255),
    processed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_stock_out_status (status),
    INDEX idx_stock_out_date (request_date),
    INDEX idx_stock_out_department (department),
    INDEX idx_stock_out_number (request_number)
);

-- 11. STOCK OUT ITEMS TABLE
-- Used by: StockOutManagement.tsx
CREATE TABLE stock_out_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    request_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity_requested INT NOT NULL,
    quantity_allocated INT DEFAULT 0,
    quantity_dispatched INT DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',
    estimated_value DECIMAL(12,2),
    status ENUM('pending', 'allocated', 'dispatched', 'partially_dispatched', 'cancelled') DEFAULT 'pending',
    dispatch_date DATE,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES stock_out_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_stock_out_item_request (request_id),
    INDEX idx_stock_out_item_product (product_id),
    INDEX idx_stock_out_item_status (status)
);

-- =====================================================================
-- PRODUCTION MANAGEMENT
-- =====================================================================

-- 12. RAW MATERIALS TABLE
-- Used by: ProductionCalculator.tsx
CREATE TABLE raw_materials (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    current_stock DECIMAL(12,3) DEFAULT 0.000,
    unit VARCHAR(50) DEFAULT 'kg',
    cost_per_unit DECIMAL(12,2) NOT NULL,
    reorder_level DECIMAL(12,3) DEFAULT 0.000,
    supplier_id VARCHAR(36),
    supplier_name VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_raw_material_category (category),
    INDEX idx_raw_material_supplier (supplier_id),
    INDEX idx_raw_material_status (status)
);

-- 13. PRODUCT RECIPES TABLE
-- Used by: ProductionCalculator.tsx
CREATE TABLE product_recipes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_time_hours DECIMAL(8,2) DEFAULT 0.00,
    complexity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    batch_size INT DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_recipe_product (product_id),
    INDEX idx_recipe_status (status)
);

-- 14. RECIPE MATERIALS TABLE
-- Used by: ProductionCalculator.tsx
CREATE TABLE recipe_materials (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipe_id VARCHAR(36) NOT NULL,
    material_id VARCHAR(36) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    required_quantity DECIMAL(12,3) NOT NULL,
    unit VARCHAR(50) DEFAULT 'kg',
    wastage_percent DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recipe_id) REFERENCES product_recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    INDEX idx_recipe_material_recipe (recipe_id),
    INDEX idx_recipe_material_material (material_id)
);

-- 15. PRODUCTION BATCHES TABLE
-- Used by: ProductionCalculator.tsx
CREATE TABLE production_batches (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(36) NOT NULL,
    planned_quantity INT NOT NULL,
    actual_quantity INT DEFAULT 0,
    status ENUM('planned', 'in_progress', 'completed', 'on_hold', 'cancelled') DEFAULT 'planned',
    start_date DATE,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_cost DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (recipe_id) REFERENCES product_recipes(id) ON DELETE RESTRICT,
    INDEX idx_production_batch_product (product_id),
    INDEX idx_production_batch_status (status),
    INDEX idx_production_batch_date (start_date)
);

-- =====================================================================
-- QUALITY CONTROL
-- =====================================================================

-- 16. QC INSPECTIONS TABLE
-- Used by: QcDashboard.tsx
CREATE TABLE qc_inspections (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    inspection_number VARCHAR(100) UNIQUE NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    batch_id VARCHAR(36),
    inspection_type ENUM('incoming', 'in_process', 'final', 'random') NOT NULL,
    quantity_inspected INT NOT NULL,
    quantity_passed INT DEFAULT 0,
    quantity_failed INT DEFAULT 0,
    rejection_rate DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('pending', 'in_progress', 'completed', 'on_hold') DEFAULT 'pending',
    inspector_name VARCHAR(255),
    inspection_date DATE NOT NULL,
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE SET NULL,
    INDEX idx_qc_inspection_product (product_id),
    INDEX idx_qc_inspection_type (inspection_type),
    INDEX idx_qc_inspection_date (inspection_date),
    INDEX idx_qc_inspection_status (status)
);

-- 17. QC DEFECTS TABLE
-- Used by: QcDashboard.tsx
CREATE TABLE qc_defects (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    inspection_id VARCHAR(36) NOT NULL,
    defect_type VARCHAR(100) NOT NULL,
    defect_description TEXT,
    quantity INT NOT NULL,
    severity ENUM('minor', 'major', 'critical') DEFAULT 'minor',
    action_required ENUM('none', 'rework', 'scrap', 'hold') DEFAULT 'none',
    cost_impact DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inspection_id) REFERENCES qc_inspections(id) ON DELETE CASCADE,
    INDEX idx_qc_defect_inspection (inspection_id),
    INDEX idx_qc_defect_type (defect_type),
    INDEX idx_qc_defect_severity (severity)
);

-- 18. QC HOLD ITEMS TABLE
-- Used by: QcDashboard.tsx
CREATE TABLE qc_hold_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    item_code VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL,
    status ENUM('hold', 'rework', 'scrap', 'released') DEFAULT 'hold',
    hold_reason TEXT,
    inspection_id VARCHAR(36),
    hold_date DATE NOT NULL,
    release_date DATE,
    released_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inspection_id) REFERENCES qc_inspections(id) ON DELETE SET NULL,
    INDEX idx_qc_hold_status (status),
    INDEX idx_qc_hold_date (hold_date),
    INDEX idx_qc_hold_item_code (item_code)
);

-- =====================================================================
-- WAREHOUSE MANAGEMENT
-- =====================================================================

-- 19. STORAGE LOCATIONS TABLE
-- Used by: StorageUtilizationDashboard.tsx
CREATE TABLE storage_locations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    location_code VARCHAR(50) UNIQUE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_type ENUM('warehouse', 'rack', 'shelf', 'bin') NOT NULL,
    parent_location_id VARCHAR(36),
    capacity_units INT DEFAULT 0,
    occupied_units INT DEFAULT 0,
    utilization_percentage DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('available', 'near_full', 'full', 'maintenance') DEFAULT 'available',
    zone VARCHAR(100),
    aisle VARCHAR(50),
    row_num INT,
    column_num INT,
    height_level INT,
    temperature_controlled BOOLEAN DEFAULT FALSE,
    humidity_controlled BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_location_id) REFERENCES storage_locations(id) ON DELETE SET NULL,
    INDEX idx_storage_location_type (location_type),
    INDEX idx_storage_location_status (status),
    INDEX idx_storage_location_code (location_code),
    INDEX idx_storage_location_parent (parent_location_id)
);

-- 20. PRODUCT LOCATIONS TABLE
-- Used by: StorageUtilizationDashboard.tsx, Products.tsx
CREATE TABLE product_locations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    allocated_quantity INT DEFAULT 0,
    available_quantity INT GENERATED ALWAYS AS (quantity - allocated_quantity) STORED,
    last_moved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE CASCADE,
    INDEX idx_product_location_product (product_id),
    INDEX idx_product_location_location (location_id),
    UNIQUE KEY unique_product_location (product_id, location_id)
);

-- =====================================================================
-- ALERTS & NOTIFICATIONS
-- =====================================================================

-- 21. ALERTS TABLE
-- Used by: Dashboard.tsx, LowStockAlerts.tsx
CREATE TABLE alerts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    alert_type ENUM('low_stock', 'out_of_stock', 'expired_product', 'overdue_payment', 'quality_issue', 'system', 'manual') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('active', 'acknowledged', 'resolved', 'ignored') DEFAULT 'active',
    category VARCHAR(100),
    related_table VARCHAR(100),
    related_id VARCHAR(36),
    product_id VARCHAR(36),
    product_name VARCHAR(255),
    current_stock INT,
    low_stock_threshold INT,
    assigned_to VARCHAR(255),
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP NULL,
    auto_resolve BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_alert_type (alert_type),
    INDEX idx_alert_priority (priority),
    INDEX idx_alert_status (status),
    INDEX idx_alert_product (product_id),
    INDEX idx_alert_created (created_at)
);

-- 22. ALERT HISTORY TABLE
-- Used by: LowStockAlerts.tsx
CREATE TABLE alert_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    alert_id VARCHAR(36) NOT NULL,
    action ENUM('created', 'acknowledged', 'resolved', 'ignored', 'escalated', 'updated') NOT NULL,
    performed_by VARCHAR(255),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    INDEX idx_alert_history_alert (alert_id),
    INDEX idx_alert_history_action (action),
    INDEX idx_alert_history_date (created_at)
);

-- =====================================================================
-- SYSTEM TABLES
-- =====================================================================

-- 23. USER ACTIVITIES TABLE
-- Used by: Dashboard.tsx (Recent Activity)
CREATE TABLE user_activities (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    activity_type ENUM('login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import', 'approval') NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(36),
    description TEXT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    additional_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_user (user_name),
    INDEX idx_activity_table (table_name),
    INDEX idx_activity_date (created_at)
);

-- 24. SYSTEM SETTINGS TABLE
-- Used by: Settings.tsx
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_setting_category (category)
);

-- =====================================================================
-- FINANCIAL TABLES
-- =====================================================================

-- 25. BILLS TABLE
-- Used for invoice/bill processing and OCR
CREATE TABLE bills (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    bill_number VARCHAR(100) NOT NULL,
    supplier_id VARCHAR(36),
    supplier_name VARCHAR(255) NOT NULL,
    customer_id VARCHAR(36),
    customer_name VARCHAR(255),
    bill_type ENUM('purchase', 'sales') NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    final_amount DECIMAL(15,2) NOT NULL,
    payment_status ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    status ENUM('draft', 'pending', 'approved', 'rejected', 'processed') DEFAULT 'draft',
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    ocr_confidence DECIMAL(5,2) DEFAULT 0.00,
    extracted_data JSON,
    processed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_bill_number (bill_number),
    INDEX idx_bill_supplier (supplier_id),
    INDEX idx_bill_customer (customer_id),
    INDEX idx_bill_date (bill_date),
    INDEX idx_bill_status (status),
    INDEX idx_bill_payment_status (payment_status)
);

-- 26. BILL ITEMS TABLE
CREATE TABLE bill_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    bill_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36),
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    ocr_confidence DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_bill_item_bill (bill_id),
    INDEX idx_bill_item_product (product_id)
);

-- =====================================================================
-- VIEWS FOR EASY DATA ACCESS
-- =====================================================================

-- Active Low Stock Alerts View
CREATE VIEW active_low_stock_alerts AS
SELECT 
    a.id,
    a.alert_type,
    a.priority,
    a.title,
    a.message,
    a.status,
    a.product_id,
    a.product_name,
    a.current_stock,
    a.low_stock_threshold,
    p.category,
    p.unit,
    p.price,
    s.id as supplier_id,
    s.name as supplier_name,
    s.email as supplier_email,
    s.phone as supplier_phone,
    a.created_at
FROM alerts a
LEFT JOIN products p ON a.product_id = p.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE a.status = 'active' 
AND a.alert_type IN ('low_stock', 'out_of_stock');

-- Stock Summary View
CREATE VIEW stock_summary AS
SELECT 
    pc.name as category,
    COUNT(p.id) as total_products,
    SUM(p.current_stock) as total_stock,
    SUM(CASE WHEN p.current_stock <= p.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count,
    AVG(p.current_stock) as avg_stock,
    SUM(p.current_stock * p.cost) as total_value
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.status = 'active'
GROUP BY pc.name;

-- Purchase Order Summary View
CREATE VIEW purchase_order_summary AS
SELECT 
    po.id,
    po.order_number,
    po.supplier_id,
    s.name as supplier_name,
    po.order_date,
    po.expected_delivery_date,
    po.status,
    po.priority,
    po.total_amount,
    COUNT(poi.id) as total_items,
    SUM(poi.quantity) as total_quantity,
    SUM(poi.received_quantity) as total_received,
    CASE 
        WHEN SUM(poi.quantity) = SUM(poi.received_quantity) THEN 'Fully Received'
        WHEN SUM(poi.received_quantity) > 0 THEN 'Partially Received'
        ELSE 'Pending'
    END as delivery_status
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id;

-- Sales Summary View
CREATE VIEW sales_summary AS
SELECT 
    DATE(co.order_date) as order_date,
    COUNT(co.id) as total_orders,
    SUM(co.total_amount) as total_revenue,
    SUM(co.final_amount) as total_final_amount,
    AVG(co.total_amount) as avg_order_value,
    COUNT(DISTINCT co.customer_id) as unique_customers
FROM customer_orders co
WHERE co.status NOT IN ('cancelled')
GROUP BY DATE(co.order_date)
ORDER BY order_date DESC;

-- Storage Utilization View
CREATE VIEW storage_utilization AS
SELECT 
    sl.id,
    sl.location_code,
    sl.location_name,
    sl.location_type,
    sl.capacity_units,
    sl.occupied_units,
    CASE 
        WHEN sl.capacity_units > 0 
        THEN ROUND((sl.occupied_units / sl.capacity_units) * 100, 2)
        ELSE 0 
    END as utilization_percentage,
    sl.status,
    COUNT(pl.id) as products_stored,
    SUM(pl.quantity) as total_items_stored
FROM storage_locations sl
LEFT JOIN product_locations pl ON sl.id = pl.location_id
GROUP BY sl.id;

-- =====================================================================
-- STORED PROCEDURES
-- =====================================================================

DELIMITER //

-- Procedure to update product stock
CREATE PROCEDURE UpdateProductStock(
    IN p_product_id VARCHAR(36),
    IN p_movement_type ENUM('in', 'out', 'adjustment'),
    IN p_quantity INT,
    IN p_reference_type VARCHAR(50),
    IN p_reference_id VARCHAR(36),
    IN p_notes TEXT,
    IN p_created_by VARCHAR(255)
)
BEGIN
    DECLARE current_stock_val INT DEFAULT 0;
    DECLARE new_stock_val INT DEFAULT 0;
    DECLARE movement_quantity INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Get current stock
    SELECT current_stock INTO current_stock_val 
    FROM products 
    WHERE id = p_product_id 
    FOR UPDATE;
    
    -- Calculate new stock based on movement type
    IF p_movement_type = 'in' THEN
        SET movement_quantity = p_quantity;
        SET new_stock_val = current_stock_val + p_quantity;
    ELSEIF p_movement_type = 'out' THEN
        SET movement_quantity = -p_quantity;
        SET new_stock_val = current_stock_val - p_quantity;
    ELSE -- adjustment
        SET movement_quantity = p_quantity - current_stock_val;
        SET new_stock_val = p_quantity;
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET current_stock = new_stock_val,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;
    
    -- Insert stock movement record
    INSERT INTO stock_movements (
        product_id, movement_type, quantity, reference_type, 
        reference_id, notes, created_by
    ) VALUES (
        p_product_id, p_movement_type, ABS(movement_quantity), 
        p_reference_type, p_reference_id, p_notes, p_created_by
    );
    
    -- Check for low stock and create alert if needed
    CALL CheckLowStockAlert(p_product_id);
    
    COMMIT;
END //

-- Procedure to check and create low stock alerts
CREATE PROCEDURE CheckLowStockAlert(
    IN p_product_id VARCHAR(36)
)
BEGIN
    DECLARE product_name_val VARCHAR(255);
    DECLARE current_stock_val INT;
    DECLARE low_stock_threshold_val INT;
    DECLARE alert_exists INT DEFAULT 0;
    
    -- Get product details
    SELECT name, current_stock, low_stock_threshold
    INTO product_name_val, current_stock_val, low_stock_threshold_val
    FROM products
    WHERE id = p_product_id;
    
    -- Check if alert already exists
    SELECT COUNT(*) INTO alert_exists
    FROM alerts
    WHERE product_id = p_product_id
    AND alert_type = 'low_stock'
    AND status = 'active';
    
    -- Create alert if stock is low and no active alert exists
    IF current_stock_val <= low_stock_threshold_val AND alert_exists = 0 THEN
        INSERT INTO alerts (
            alert_type, priority, title, message, status,
            product_id, product_name, current_stock, low_stock_threshold
        ) VALUES (
            'low_stock', 
            CASE 
                WHEN current_stock_val = 0 THEN 'critical'
                WHEN current_stock_val <= (low_stock_threshold_val * 0.5) THEN 'high'
                ELSE 'medium'
            END,
            CONCAT('Low Stock: ', product_name_val),
            CONCAT(product_name_val, ' is running low. Current stock: ', 
                   current_stock_val, ', Threshold: ', low_stock_threshold_val),
            'active',
            p_product_id, product_name_val, current_stock_val, low_stock_threshold_val
        );
    END IF;
    
    -- Resolve alert if stock is replenished
    IF current_stock_val > low_stock_threshold_val AND alert_exists > 0 THEN
        UPDATE alerts
        SET status = 'resolved',
            resolved_at = CURRENT_TIMESTAMP,
            resolved_by = 'System'
        WHERE product_id = p_product_id
        AND alert_type = 'low_stock'
        AND status = 'active';
    END IF;
END //

DELIMITER ;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Update storage location utilization when product locations change
DELIMITER //
CREATE TRIGGER tr_product_location_utilization
AFTER INSERT ON product_locations
FOR EACH ROW
BEGIN
    UPDATE storage_locations
    SET occupied_units = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM product_locations
        WHERE location_id = NEW.location_id
    ),
    utilization_percentage = CASE 
        WHEN capacity_units > 0 THEN
            ROUND(((SELECT COALESCE(SUM(quantity), 0) FROM product_locations WHERE location_id = NEW.location_id) / capacity_units) * 100, 2)
        ELSE 0
    END,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.location_id;
END //

-- Auto-generate order numbers
CREATE TRIGGER tr_purchase_order_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('PO-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', 
                                     LPAD((SELECT COALESCE(MAX(SUBSTRING(order_number, -4)), 0) + 1 
                                           FROM purchase_orders 
                                           WHERE order_number LIKE CONCAT('PO-', DATE_FORMAT(NOW(), '%Y%m%d'), '%')), 4, '0'));
    END IF;
END //

CREATE TRIGGER tr_customer_order_number
BEFORE INSERT ON customer_orders
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('CO-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', 
                                     LPAD((SELECT COALESCE(MAX(SUBSTRING(order_number, -4)), 0) + 1 
                                           FROM customer_orders 
                                           WHERE order_number LIKE CONCAT('CO-', DATE_FORMAT(NOW(), '%Y%m%d'), '%')), 4, '0'));
    END IF;
END //

DELIMITER ;

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Composite indexes for common queries
CREATE INDEX idx_products_category_status ON products(category, status);
CREATE INDEX idx_products_stock_status ON products(current_stock, status);
CREATE INDEX idx_stock_movements_product_date ON stock_movements(product_id, created_at);
CREATE INDEX idx_alerts_type_status ON alerts(alert_type, status);
CREATE INDEX idx_purchase_orders_supplier_status ON purchase_orders(supplier_id, status);
CREATE INDEX idx_customer_orders_customer_date ON customer_orders(customer_id, order_date);

-- Full-text search indexes
ALTER TABLE products ADD FULLTEXT(name, description);
ALTER TABLE suppliers ADD FULLTEXT(name, address);
ALTER TABLE customers ADD FULLTEXT(name, address);

-- =====================================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================================

-- Insert sample categories
INSERT INTO product_categories (name, description) VALUES
('Electronics', 'Electronic components and devices'),
('Industrial', 'Industrial machinery and tools'),
('Office Supplies', 'Office equipment and supplies'),
('Raw Materials', 'Raw materials for production');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, status, category) VALUES
('TechCorp Industries', 'John Smith', 'john@techcorp.com', '+91-9876543210', '123 Tech Park, Bangalore', 'active', 'Electronics'),
('SteelWorks Ltd', 'Sarah Johnson', 'sarah@steelworks.com', '+91-9876543211', '456 Industrial Area, Chennai', 'active', 'Industrial'),
('OfficeMax Solutions', 'Mike Brown', 'mike@officemax.com', '+91-9876543212', '789 Business District, Mumbai', 'active', 'Office Supplies');

-- Insert sample products with proper references
INSERT INTO products (sku, name, description, category, price, cost, current_stock, low_stock_threshold, supplier_id) VALUES
('ELEC001', 'LED Display Module', '32-inch LED display for industrial use', 'Electronics', 15000.00, 12000.00, 25, 5, (SELECT id FROM suppliers WHERE name = 'TechCorp Industries' LIMIT 1)),
('IND001', 'Steel Fabrication Tools', 'Professional steel cutting and welding tools', 'Industrial', 25000.00, 20000.00, 10, 3, (SELECT id FROM suppliers WHERE name = 'SteelWorks Ltd' LIMIT 1)),
('OFF001', 'Office Chair Executive', 'Ergonomic office chair with lumbar support', 'Office Supplies', 8000.00, 6000.00, 50, 10, (SELECT id FROM suppliers WHERE name = 'OfficeMax Solutions' LIMIT 1));

-- Insert system settings for the Settings page
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('company_name', 'AI Stock Management System', 'string', 'company', 'Company name'),
('company_address', '123 Business Street, Tech City, TC 12345', 'string', 'company', 'Company address'),
('company_phone', '+91 98765 43210', 'string', 'company', 'Company phone number'),
('company_email', 'contact@stockmanagement.com', 'string', 'company', 'Company email'),
('gst_enabled', 'true', 'boolean', 'gst', 'Enable GST calculations'),
('gst_rate', '18', 'number', 'gst', 'Default GST rate'),
('low_stock_alerts', 'true', 'boolean', 'notifications', 'Enable low stock alerts'),
('currency', 'INR', 'string', 'display', 'Default currency'),
('date_format', 'DD/MM/YYYY', 'string', 'display', 'Date format');

-- =====================================================================
-- FINAL SETUP
-- =====================================================================

-- Create database user (optional - uncomment if needed)
-- CREATE USER 'stock_user'@'localhost' IDENTIFIED BY 'stock_password_2024';
-- GRANT ALL PRIVILEGES ON ai_stock_management.* TO 'stock_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Show completion message
SELECT 'Database schema created successfully! Ready for your AI Stock Management System.' as Message;

-- Show table count
SELECT COUNT(*) as 'Total Tables Created' FROM information_schema.tables 
WHERE table_schema = 'ai_stock_management';
