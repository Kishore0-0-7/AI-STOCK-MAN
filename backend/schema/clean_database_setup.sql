CREATE DATABASE IF NOT EXISTS ai_stock_management;
USE ai_stock_management;

CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  contact_person VARCHAR(255),
  website VARCHAR(255),
  tax_number VARCHAR(50),
  payment_terms INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supplier_name (name),
  INDEX idx_supplier_active (is_active)
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_name (name),
  INDEX idx_customer_phone (phone)
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  current_stock INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  low_stock_alert_time TIMESTAMP NULL,
  alert_status ENUM('active', 'ignored', 'resolved') DEFAULT 'active',
  qr_code VARCHAR(100) UNIQUE,
  unit VARCHAR(20) DEFAULT 'piece',
  supplier_id INT,
  alert_priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  reorder_point INT DEFAULT 0,
  max_stock_level INT DEFAULT 1000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_products_stock (current_stock, low_stock_threshold),
  INDEX idx_products_category (category),
  INDEX idx_products_supplier (supplier_id),
  INDEX idx_products_alert_status (alert_status),
  INDEX idx_products_priority (alert_priority)
);

CREATE TABLE IF NOT EXISTS ignored_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  original_alert_time TIMESTAMP NOT NULL,
  reason TEXT,
  ignored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ignored_by VARCHAR(255) DEFAULT 'Admin',
  stock_level_when_ignored INT,
  can_reactivate BOOLEAN DEFAULT TRUE,
  reactivate_after TIMESTAMP NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_ignored_product (product_id),
  INDEX idx_ignored_date (ignored_at)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INT NOT NULL,
  supplier_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'sent', 'approved', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  notes TEXT,
  sent_method ENUM('email', 'whatsapp', 'phone', 'fax') NULL,
  sent_to VARCHAR(255) NULL,
  sent_at TIMESTAMP NULL,
  expected_delivery_date DATE NULL,
  actual_delivery_date DATE NULL,
  delivery_address TEXT,
  terms_and_conditions TEXT,
  created_by VARCHAR(255) DEFAULT 'System',
  approved_by VARCHAR(255) NULL,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_po_status (status),
  INDEX idx_po_date (created_at),
  INDEX idx_po_supplier (supplier_id),
  INDEX idx_po_product (product_id)
);

CREATE TABLE IF NOT EXISTS alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  action ENUM('created', 'ignored', 'resolved', 'reactivated', 'po_generated') NOT NULL,
  stock_level INT,
  threshold_level INT,
  performed_by VARCHAR(255) DEFAULT 'System',
  notes TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_history_product (product_id),
  INDEX idx_history_action (action),
  INDEX idx_history_date (created_at)
);

CREATE TABLE IF NOT EXISTS po_line_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  received_quantity INT DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_line_po (po_id),
  INDEX idx_line_product (product_id)
);

DELIMITER $$

DROP TRIGGER IF EXISTS update_low_stock_alert$$
CREATE TRIGGER update_low_stock_alert 
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
  IF NEW.current_stock <= NEW.low_stock_threshold AND 
     OLD.current_stock > OLD.low_stock_threshold AND
     NEW.alert_status = 'active' THEN
    SET NEW.low_stock_alert_time = NOW();
    
    IF NEW.current_stock <= (NEW.low_stock_threshold * 0.3) THEN
      SET NEW.alert_priority = 'high';
    ELSEIF NEW.current_stock <= (NEW.low_stock_threshold * 0.6) THEN
      SET NEW.alert_priority = 'medium';
    ELSE
      SET NEW.alert_priority = 'low';
    END IF;
  END IF;
  
  IF NEW.current_stock > NEW.low_stock_threshold AND 
     OLD.current_stock <= OLD.low_stock_threshold THEN
    SET NEW.low_stock_alert_time = NULL;
    SET NEW.alert_status = 'active';
  END IF;
END$$

DROP TRIGGER IF EXISTS log_alert_history$$
CREATE TRIGGER log_alert_history
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  IF NEW.low_stock_alert_time IS NOT NULL AND OLD.low_stock_alert_time IS NULL THEN
    INSERT INTO alert_history (product_id, action, stock_level, threshold_level, notes)
    VALUES (NEW.id, 'created', NEW.current_stock, NEW.low_stock_threshold, 'Low stock alert triggered');
  END IF;
  
  IF NEW.alert_status != OLD.alert_status THEN
    INSERT INTO alert_history (product_id, action, stock_level, threshold_level, notes)
    VALUES (NEW.id, NEW.alert_status, NEW.current_stock, NEW.low_stock_threshold, 
            CONCAT('Alert status changed to: ', NEW.alert_status));
  END IF;
END$$

DROP TRIGGER IF EXISTS generate_po_number$$
CREATE TRIGGER generate_po_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    SET NEW.po_number = CONCAT('PO', YEAR(NOW()), LPAD(MONTH(NOW()), 2, '0'), LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM purchase_orders), 4, '0'));
  END IF;
END$$

DROP TRIGGER IF EXISTS update_po_total$$
CREATE TRIGGER update_po_total
AFTER INSERT ON po_line_items
FOR EACH ROW
BEGIN
  UPDATE purchase_orders 
  SET total_amount = (
    SELECT SUM(line_total) 
    FROM po_line_items 
    WHERE po_id = NEW.po_id
  )
  WHERE id = NEW.po_id;
END$$

DELIMITER ;

INSERT IGNORE INTO suppliers (id, name, email, phone, contact_person, address, website, payment_terms) VALUES
(1, 'Coffee World Ltd', 'orders@coffeeworld.com', '+1-555-0101', 'John Smith', '123 Coffee St, Seattle, WA 98101', 'www.coffeeworld.com', 30),
(2, 'Herbal Supplies Co', 'supply@herbal.com', '+1-555-0102', 'Sarah Johnson', '456 Green Ave, Portland, OR 97201', 'www.herbalsupplies.com', 15),
(3, 'Tech Solutions Inc', 'orders@techsol.com', '+1-555-0103', 'Mike Chen', '789 Tech Blvd, San Jose, CA 95101', 'www.techsolutions.com', 45),
(4, 'Office Depot Pro', 'bulk@officedepot.com', '+1-555-0104', 'Lisa Brown', '321 Business Rd, Dallas, TX 75201', 'www.officedepot.com', 30),
(5, 'General Supplies Hub', 'info@generalsupplies.com', '+1-555-0105', 'David Wilson', '654 Supply Lane, Chicago, IL 60601', 'www.generalsupplies.com', 20),
(6, 'Fresh Foods Wholesale', 'wholesale@freshfoods.com', '+1-555-0106', 'Emma Davis', '987 Fresh Market St, Miami, FL 33101', 'www.freshfoods.com', 7),
(7, 'Electronic Components Ltd', 'sales@electronics.com', '+1-555-0107', 'James Miller', '147 Circuit Ave, Austin, TX 78701', 'www.electronics.com', 60);

INSERT IGNORE INTO customers (id, name, phone, email, address) VALUES
(1, 'John Doe', '9876543210', 'john.doe@email.com', '123 Main St, Anytown, ST 12345'),
(2, 'Jane Smith', '9876543211', 'jane.smith@email.com', '456 Oak Ave, Somewhere, ST 12346'),
(3, 'Bob Johnson', '9876543212', 'bob.johnson@email.com', '789 Pine Rd, Elsewhere, ST 12347'),
(4, 'Alice Brown', '9876543213', 'alice.brown@email.com', '321 Elm St, Anywhere, ST 12348'),
(5, 'Charlie Wilson', '9876543214', 'charlie.wilson@email.com', '654 Maple Dr, Nowhere, ST 12349');

INSERT IGNORE INTO products (id, name, category, price, current_stock, low_stock_threshold, qr_code, unit, supplier_id, alert_priority, reorder_point, max_stock_level) VALUES
(1, 'Premium Coffee Beans', 'Beverages', 25.99, 5, 20, 'QR001234', 'kg', 1, 'high', 15, 100),
(2, 'Organic Green Tea', 'Beverages', 18.50, 12, 30, 'QR001235', 'kg', 2, 'medium', 25, 150),
(3, 'Wireless Earbuds', 'Electronics', 89.99, 3, 15, 'QR001236', 'piece', 3, 'high', 10, 50),
(4, 'Office Paper A4', 'Office Supplies', 4.99, 25, 50, 'QR001237', 'pack', 4, 'low', 40, 200),
(5, 'Winter Gloves', 'Accessories', 12.99, 8, 25, 'QR001238', 'pair', 5, 'medium', 20, 100),
(6, 'Smartphone Cases', 'Electronics', 15.99, 4, 20, 'QR001239', 'piece', 3, 'high', 15, 80),
(7, 'Energy Drinks', 'Beverages', 2.99, 18, 50, 'QR001240', 'can', 6, 'medium', 40, 300),
(8, 'USB Cables', 'Electronics', 8.99, 6, 25, 'QR001241', 'piece', 7, 'medium', 20, 100),
(9, 'Notebook Set', 'Office Supplies', 6.99, 45, 30, 'QR001242', 'set', 4, 'low', 25, 150),
(10, 'Hand Sanitizer', 'Health', 3.99, 2, 15, 'QR001243', 'bottle', 5, 'high', 12, 60),
(11, 'Laptop Stand', 'Electronics', 45.99, 7, 15, 'QR001244', 'piece', 3, 'medium', 12, 75),
(12, 'Organic Honey', 'Food', 12.99, 3, 20, 'QR001245', 'jar', 6, 'high', 15, 100),
(13, 'Wireless Mouse', 'Electronics', 25.99, 8, 25, 'QR001246', 'piece', 7, 'medium', 20, 120),
(14, 'Coffee Mug Set', 'Accessories', 18.99, 12, 30, 'QR001247', 'set', 1, 'low', 25, 150),
(15, 'Desk Lamp', 'Office Supplies', 35.99, 5, 18, 'QR001248', 'piece', 4, 'medium', 15, 90);

UPDATE products SET low_stock_alert_time = NOW() WHERE current_stock <= low_stock_threshold;

INSERT IGNORE INTO ignored_alerts (product_id, original_alert_time, reason, ignored_by, stock_level_when_ignored) VALUES
(4, '2025-01-15 10:30:00', 'Seasonal item - no restock needed until spring', 'Manager', 25),
(9, '2025-01-10 14:20:00', 'Supplier temporarily out of stock', 'Admin', 45);

INSERT IGNORE INTO purchase_orders (po_number, product_id, supplier_id, quantity, unit_price, total_amount, status, priority, notes, expected_delivery_date, created_by) VALUES
('PO20250001', 1, 1, 50, 25.99, 1299.50, 'sent', 'high', 'Urgent restock for coffee beans', '2025-02-01', 'System'),
('PO20250002', 3, 3, 25, 89.99, 2249.75, 'pending', 'high', 'Electronics restock', '2025-02-05', 'Manager'),
('PO20250003', 10, 5, 30, 3.99, 119.70, 'approved', 'high', 'Health products emergency order', '2025-01-28', 'System'),
('PO20250004', 12, 6, 40, 12.99, 519.60, 'pending', 'medium', 'Food products restock', '2025-02-03', 'System'),
('PO20250005', 15, 4, 20, 35.99, 719.80, 'sent', 'medium', 'Office equipment order', '2025-02-06', 'Manager');

DELIMITER $$

DROP PROCEDURE IF EXISTS IgnoreAlert$$
CREATE PROCEDURE IgnoreAlert(
  IN p_product_id INT,
  IN p_reason TEXT,
  IN p_ignored_by VARCHAR(255)
)
BEGIN
  DECLARE v_alert_time TIMESTAMP;
  DECLARE v_current_stock INT;
  
  SELECT low_stock_alert_time, current_stock 
  INTO v_alert_time, v_current_stock
  FROM products 
  WHERE id = p_product_id;
  
  INSERT INTO ignored_alerts (product_id, original_alert_time, reason, ignored_by, stock_level_when_ignored)
  VALUES (p_product_id, v_alert_time, p_reason, p_ignored_by, v_current_stock);
  
  UPDATE products 
  SET alert_status = 'ignored'
  WHERE id = p_product_id;
  
  INSERT INTO alert_history (product_id, action, stock_level, performed_by, notes)
  VALUES (p_product_id, 'ignored', v_current_stock, p_ignored_by, p_reason);
END$$

DROP PROCEDURE IF EXISTS CreatePurchaseOrder$$
CREATE PROCEDURE CreatePurchaseOrder(
  IN p_product_id INT,
  IN p_quantity INT,
  IN p_notes TEXT,
  IN p_created_by VARCHAR(255),
  OUT p_po_number VARCHAR(50)
)
BEGIN
  DECLARE v_supplier_id INT;
  DECLARE v_unit_price DECIMAL(10,2);
  DECLARE v_total_amount DECIMAL(10,2);
  DECLARE v_po_id INT;
  
  SELECT supplier_id, price
  INTO v_supplier_id, v_unit_price
  FROM products
  WHERE id = p_product_id;
  
  SET v_total_amount = v_unit_price * p_quantity;
  
  SET p_po_number = CONCAT('PO', YEAR(NOW()), LPAD(MONTH(NOW()), 2, '0'), LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM purchase_orders), 4, '0'));
  
  INSERT INTO purchase_orders (po_number, product_id, supplier_id, quantity, unit_price, total_amount, notes, created_by)
  VALUES (p_po_number, p_product_id, v_supplier_id, p_quantity, v_unit_price, v_total_amount, p_notes, p_created_by);
  
  SET v_po_id = LAST_INSERT_ID();
  
  UPDATE products 
  SET alert_status = 'resolved'
  WHERE id = p_product_id;
  
  INSERT INTO alert_history (product_id, action, performed_by, notes, metadata)
  VALUES (p_product_id, 'po_generated', p_created_by, p_notes, JSON_OBJECT('po_number', p_po_number, 'po_id', v_po_id));
END$$

DROP PROCEDURE IF EXISTS GetLowStockAlerts$$
CREATE PROCEDURE GetLowStockAlerts()
BEGIN
  SELECT 
    p.id,
    p.name,
    p.current_stock,
    p.low_stock_threshold,
    p.category,
    p.qr_code,
    p.alert_priority,
    p.low_stock_alert_time as alert_time,
    p.price,
    p.unit,
    s.name as supplier_name,
    s.email as supplier_email,
    s.phone as supplier_phone,
    CASE 
      WHEN p.current_stock = 0 THEN 'Out of Stock'
      WHEN p.current_stock <= (p.low_stock_threshold * 0.3) THEN 'Critical'
      WHEN p.current_stock <= (p.low_stock_threshold * 0.6) THEN 'Low'
      ELSE 'Warning'
    END as stock_status
  FROM products p
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  WHERE p.current_stock <= p.low_stock_threshold 
    AND p.alert_status = 'active'
    AND p.low_stock_alert_time IS NOT NULL
  ORDER BY p.alert_priority DESC, p.current_stock ASC;
END$$

DROP PROCEDURE IF EXISTS GetIgnoredAlerts$$
CREATE PROCEDURE GetIgnoredAlerts()
BEGIN
  SELECT 
    ia.id,
    p.name as product_name,
    p.current_stock,
    p.low_stock_threshold,
    p.category,
    ia.reason,
    ia.ignored_at,
    ia.ignored_by,
    ia.stock_level_when_ignored
  FROM ignored_alerts ia
  JOIN products p ON ia.product_id = p.id
  ORDER BY ia.ignored_at DESC;
END$$

DROP PROCEDURE IF EXISTS GetResolvedAlerts$$
CREATE PROCEDURE GetResolvedAlerts()
BEGIN
  SELECT 
    po.id,
    po.po_number,
    p.name as product_name,
    p.category,
    po.quantity as quantity_ordered,
    po.unit_price,
    po.total_amount,
    po.status,
    po.created_at as resolved_at,
    s.name as supplier_name
  FROM purchase_orders po
  JOIN products p ON po.product_id = p.id
  LEFT JOIN suppliers s ON po.supplier_id = s.id
  ORDER BY po.created_at DESC;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW active_alerts AS
SELECT 
  p.id,
  p.name,
  p.current_stock,
  p.low_stock_threshold,
  p.category,
  p.qr_code,
  p.alert_priority,
  p.low_stock_alert_time as alert_time,
  p.price,
  p.unit,
  s.name as supplier_name,
  s.email as supplier_email,
  s.phone as supplier_phone,
  CASE 
    WHEN p.current_stock = 0 THEN 'Out of Stock'
    WHEN p.current_stock <= (p.low_stock_threshold * 0.3) THEN 'Critical'
    WHEN p.current_stock <= (p.low_stock_threshold * 0.6) THEN 'Low'
    ELSE 'Warning'
  END as stock_status,
  ROUND(((p.low_stock_threshold - p.current_stock) / p.low_stock_threshold) * 100, 2) as shortage_percentage
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.current_stock <= p.low_stock_threshold 
  AND p.alert_status = 'active'
  AND p.low_stock_alert_time IS NOT NULL;

CREATE OR REPLACE VIEW po_summary AS
SELECT 
  po.id,
  po.po_number,
  po.status,
  po.priority,
  p.name as product_name,
  p.category,
  po.quantity,
  po.unit_price,
  po.total_amount,
  s.name as supplier_name,
  s.email as supplier_email,
  s.phone as supplier_phone,
  po.created_at,
  po.expected_delivery_date,
  DATEDIFF(po.expected_delivery_date, CURDATE()) as days_until_delivery
FROM purchase_orders po
JOIN products p ON po.product_id = p.id
LEFT JOIN suppliers s ON po.supplier_id = s.id;

CREATE OR REPLACE VIEW stock_summary AS
SELECT 
  category,
  COUNT(*) as total_products,
  SUM(current_stock) as total_stock,
  SUM(current_stock * price) as total_value,
  COUNT(CASE WHEN current_stock <= low_stock_threshold THEN 1 END) as low_stock_count,
  COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count
FROM products
GROUP BY category;
