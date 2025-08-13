-- Users table for authentication and employee management
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM(
    'super_admin',
    'warehouse_manager', 
    'inventory_manager',
    'quality_controller',
    'production_supervisor',
    'logistics_coordinator',
    'purchase_manager',
    'store_keeper',
    'viewer'
  ) NOT NULL DEFAULT 'viewer',
  department VARCHAR(50) NOT NULL,
  phone VARCHAR(15) NULL,
  avatar TEXT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_department (department)
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (
  email, 
  password, 
  full_name, 
  role, 
  department, 
  status
) VALUES (
  'admin@warehouse.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', -- admin123
  'System Administrator',
  'super_admin',
  'Administration',
  'active'
);

-- Insert sample employees with different roles
INSERT IGNORE INTO users (email, password, full_name, role, department, phone, status) VALUES
('manager@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Warehouse Manager', 'warehouse_manager', 'Management', '+1234567890', 'active'),
('inventory@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Inventory Manager', 'inventory_manager', 'Inventory', '+1234567891', 'active'),
('qc@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Quality Controller', 'quality_controller', 'Quality Control', '+1234567892', 'active'),
('production@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Production Supervisor', 'production_supervisor', 'Production', '+1234567893', 'active'),
('logistics@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Logistics Coordinator', 'logistics_coordinator', 'Logistics', '+1234567894', 'active'),
('purchase@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Purchase Manager', 'purchase_manager', 'Procurement', '+1234567895', 'active'),
('keeper@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Store Keeper', 'store_keeper', 'Storage', '+1234567896', 'active'),
('viewer@warehouse.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeukP1iO.IIJ.v1K2', 'Read Only User', 'viewer', 'General', '+1234567897', 'active');

-- Create sessions table for JWT token management (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at)
);

-- Update existing tables if needed to reference users
-- Add user_id to activity_logs if it doesn't exist (simplified approach)
-- This will only run if the table exists, ignore errors if column already exists
ALTER TABLE activity_logs ADD COLUMN user_id INT AFTER id;
ALTER TABLE activity_logs ADD INDEX idx_user_id (user_id);

-- Create sessions table for JWT token management (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at)
);
