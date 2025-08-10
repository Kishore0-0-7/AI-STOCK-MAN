USE ai_stock_management;

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

-- Insert some sample customers for testing
INSERT INTO customers (name, phone, email, address) VALUES 
('John Doe', '9876543210', 'john.doe@email.com', '123 Main St, City'),
('Jane Smith', '9876543211', 'jane.smith@email.com', '456 Oak Ave, Town'),
('Bob Johnson', '9876543212', 'bob.johnson@email.com', '789 Pine Rd, Village');
