-- Customer Orders Tables
-- These tables manage customer orders and their items

-- Create customer_orders table
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

-- Create customer_order_items table
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

-- Insert sample customer orders data
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

-- Insert sample customer order items (assuming product IDs exist)
INSERT IGNORE INTO customer_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
-- Order 1 items
(1, 1, 2, 500.00, 1000.00),
(1, 2, 3, 250.00, 750.00),
(1, 3, 1, 750.00, 750.00),

-- Order 2 items
(2, 2, 4, 250.00, 1000.00),
(2, 4, 2, 400.00, 800.00),

-- Order 3 items
(3, 1, 3, 500.00, 1500.00),
(3, 3, 1, 750.00, 750.00),
(3, 5, 2, 475.00, 950.00),

-- Order 4 items
(4, 4, 1, 400.00, 400.00),
(4, 6, 1, 550.00, 550.00),

-- Order 5 items
(5, 2, 2, 250.00, 500.00),
(5, 7, 1, 700.00, 700.00),

-- Order 6 items (cancelled)
(6, 1, 1, 500.00, 500.00),
(6, 2, 1, 250.00, 250.00),

-- Order 7 items
(7, 3, 2, 750.00, 1500.00),
(7, 5, 1, 475.00, 475.00),
(7, 8, 1, 825.00, 825.00),

-- Order 8 items
(8, 4, 2, 400.00, 800.00),
(8, 7, 1, 700.00, 700.00),

-- Order 9 items
(9, 1, 2, 500.00, 1000.00),
(9, 6, 1, 550.00, 550.00),
(9, 9, 1, 650.00, 650.00),

-- Order 10 items
(10, 2, 3, 250.00, 750.00),
(10, 10, 1, 350.00, 350.00);
