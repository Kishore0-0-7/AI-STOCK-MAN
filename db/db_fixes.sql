-- Database Structure Fixes and Updates
-- This script fixes inconsistencies in the database schema

USE ai_stock_management;

-- Fix purchase_orders table structure
-- The existing table seems to be missing some columns from the dump
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS `status` ENUM('draft','pending','approved','shipped','received','completed','cancelled') DEFAULT 'draft' AFTER expected_delivery_date,
ADD COLUMN IF NOT EXISTS `total_amount` DECIMAL(10,2) DEFAULT '0.00' AFTER status,
ADD COLUMN IF NOT EXISTS `notes` TEXT AFTER total_amount,
ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER notes,
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add missing indexes to purchase_orders if they don't exist
ALTER TABLE purchase_orders 
ADD INDEX IF NOT EXISTS `unique_order_number` (`order_number`),
ADD INDEX IF NOT EXISTS `idx_supplier` (`supplier_id`),
ADD INDEX IF NOT EXISTS `idx_status` (`status`),
ADD INDEX IF NOT EXISTS `idx_order_date` (`order_date`);

-- Fix stock_movements table structure
-- Add missing columns that should exist based on the data
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS `product_id` INT NOT NULL AFTER id,
ADD COLUMN IF NOT EXISTS `movement_type` ENUM('in','out') NOT NULL AFTER product_id,
ADD COLUMN IF NOT EXISTS `quantity` INT NOT NULL AFTER movement_type,
ADD COLUMN IF NOT EXISTS `reference_number` VARCHAR(100) DEFAULT NULL AFTER quantity,
ADD COLUMN IF NOT EXISTS `notes` TEXT AFTER reference_number,
ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER notes;

-- Add missing indexes and constraints to stock_movements
ALTER TABLE stock_movements 
ADD INDEX IF NOT EXISTS `idx_product` (`product_id`),
ADD INDEX IF NOT EXISTS `idx_movement_type` (`movement_type`),
ADD INDEX IF NOT EXISTS `idx_created_at` (`created_at`);

-- Add foreign key constraint for stock_movements if it doesn't exist
-- First check if the constraint exists, if not add it
SET @constraint_exists = (SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'ai_stock_management' 
    AND TABLE_NAME = 'stock_movements' 
    AND CONSTRAINT_NAME = 'stock_movements_ibfk_1');

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE stock_movements ADD CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE',
    'SELECT "Foreign key constraint already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure customer orders tables exist (they should from our previous script)
-- This is just a safety check
CREATE TABLE IF NOT EXISTS customer_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_method ENUM('cash', 'card', 'upi', 'bank_transfer', 'cheque') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer_id (customer_id),
    INDEX idx_order_date (order_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status)
);

CREATE TABLE IF NOT EXISTS customer_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Update any existing purchase orders that might be missing status or total_amount
UPDATE purchase_orders 
SET status = 'pending' 
WHERE status IS NULL;

UPDATE purchase_orders 
SET total_amount = 0.00 
WHERE total_amount IS NULL;

-- Clean up any inconsistent data
-- Ensure all foreign key relationships are valid
DELETE FROM customer_orders WHERE customer_id NOT IN (SELECT id FROM customers);
DELETE FROM customer_order_items WHERE order_id NOT IN (SELECT id FROM customer_orders);
DELETE FROM customer_order_items WHERE product_id NOT IN (SELECT id FROM products);
DELETE FROM purchase_order_items WHERE purchase_order_id NOT IN (SELECT id FROM purchase_orders);
DELETE FROM purchase_order_items WHERE product_id NOT IN (SELECT id FROM products);

-- Update database charset and collation if needed
ALTER DATABASE ai_stock_management CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

SELECT 'Database structure fixes completed successfully!' as result;
