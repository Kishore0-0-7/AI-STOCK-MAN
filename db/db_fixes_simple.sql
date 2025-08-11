-- Database Structure Fixes and Updates
-- This script fixes inconsistencies in the database schema

USE ai_stock_management;

-- Check current database structure and make necessary adjustments

-- First, let's check if our customer orders tables exist and create them if needed
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

-- Insert sample customer orders data if tables are empty
INSERT IGNORE INTO customer_orders (order_number, customer_id, order_date, delivery_date, status, total_amount, payment_method, payment_status, notes) VALUES
('CO000001', 1, '2025-08-01', '2025-08-03', 'delivered', 2500.00, 'card', 'paid', 'First order from regular customer'),
('CO000002', 2, '2025-08-02', '2025-08-05', 'shipped', 1800.00, 'upi', 'paid', 'Bulk order for office supplies'),
('CO000003', 1, '2025-08-03', '2025-08-06', 'processing', 3200.00, 'bank_transfer', 'paid', 'Large order - handle with care'),
('CO000004', 3, '2025-08-04', '2025-08-07', 'confirmed', 950.00, 'cash', 'pending', 'Cash on delivery'),
('CO000005', 2, '2025-08-05', '2025-08-08', 'pending', 1200.00, 'card', 'pending', 'Waiting for customer confirmation'),
('CO000006', 4, '2025-08-06', '2025-08-09', 'cancelled', 750.00, 'upi', 'refunded', 'Customer requested cancellation'),
('CO000007', 1, '2025-08-07', '2025-08-10', 'confirmed', 2800.00, 'bank_transfer', 'paid', 'Repeat customer - priority handling'),
('CO000008', 3, '2025-08-08', '2025-08-11', 'processing', 1500.00, 'cash', 'pending', 'Rush order'),
('CO000009', 2, '2025-08-09', '2025-08-12', 'shipped', 2200.00, 'card', 'paid', 'Express delivery requested'),
('CO000010', 4, '2025-08-10', '2025-08-13', 'pending', 1100.00, 'upi', 'pending', 'New customer order');

-- Insert sample customer order items
INSERT IGNORE INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
-- Order 1 items
(1, 1, 2, 29.99, 59.98),
(1, 2, 1, 79.99, 79.99),
(1, 3, 1, 49.99, 49.99),

-- Order 2 items
(2, 6, 5, 8.99, 44.95),
(2, 7, 3, 12.99, 38.97),

-- Order 3 items
(3, 4, 1, 199.99, 199.99),
(3, 5, 2, 89.99, 179.98),

-- Order 4 items
(4, 11, 2, 45.99, 91.98),
(4, 12, 1, 24.99, 24.99),

-- Order 5 items
(5, 16, 3, 15.99, 47.97),
(5, 17, 2, 25.99, 51.98),

-- Order 6 items (cancelled)
(6, 18, 1, 34.99, 34.99),
(6, 19, 2, 12.99, 25.98),

-- Order 7 items
(7, 1, 3, 29.99, 89.97),
(7, 4, 1, 199.99, 199.99),

-- Order 8 items
(8, 13, 1, 129.99, 129.99),
(8, 14, 2, 19.99, 39.98),

-- Order 9 items
(9, 2, 1, 79.99, 79.99),
(9, 15, 1, 79.99, 79.99),

-- Order 10 items
(10, 20, 4, 8.99, 35.96),
(10, 8, 2, 15.99, 31.98);

-- Clean up any inconsistent data
DELETE FROM customer_order_items WHERE order_id NOT IN (SELECT id FROM customer_orders);
DELETE FROM customer_order_items WHERE product_id NOT IN (SELECT id FROM products);

-- Update totals for customer orders based on items
UPDATE customer_orders co
SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM customer_order_items coi
    WHERE coi.order_id = co.id
);

SELECT 'Database structure fixes completed successfully!' as result;
SELECT COUNT(*) as 'Customer Orders Count' FROM customer_orders;
SELECT COUNT(*) as 'Customer Order Items Count' FROM customer_order_items;
