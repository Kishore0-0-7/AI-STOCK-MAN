#!/bin/bash

# =====================================================================
# AI Stock Management System - Database Setup Script
# =====================================================================
# This script sets up the MySQL database for the AI Stock Management System
# =====================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="ai_stock_management"
DB_USER="root"
DB_PASSWORD="12345"
DB_HOST="localhost"
DB_PORT="3306"
SCHEMA_FILE="ai_stock_management_schema.sql"

print_header() {
    echo -e "${BLUE}"
    echo "======================================================="
    echo "   AI STOCK MANAGEMENT - Database Setup"
    echo "======================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_mysql() {
    print_step "Checking MySQL installation..."
    
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL is not installed. Please install MySQL first."
        echo "Ubuntu/Debian: sudo apt install mysql-server"
        echo "CentOS/RHEL: sudo yum install mysql-server"
        echo "macOS: brew install mysql"
        exit 1
    fi
    
    if ! systemctl is-active --quiet mysql; then
        print_step "Starting MySQL service..."
        sudo systemctl start mysql
    fi
    
    print_success "MySQL is running"
}

create_database() {
    print_step "Creating database and user..."
    
    echo "Please enter MySQL root password:"
    mysql -u root -p << EOF
-- Create database
CREATE DATABASE IF NOT EXISTS ${DB_NAME} 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER IF NOT EXISTS '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'${DB_HOST}';
FLUSH PRIVILEGES;

-- Show databases
SHOW DATABASES;
EOF
    
    print_success "Database and user created successfully"
}

run_schema() {
    print_step "Running database schema..."
    
    if [ ! -f "$SCHEMA_FILE" ]; then
        print_error "Schema file '$SCHEMA_FILE' not found!"
        exit 1
    fi
    
    echo "Please enter MySQL root password to run schema:"
    mysql -u root -p < "$SCHEMA_FILE"
    
    print_success "Database schema executed successfully"
}

verify_setup() {
    print_step "Verifying database setup..."
    
    echo "Please enter MySQL root password for verification:"
    TABLES_COUNT=$(mysql -u root -p -N -s -e "USE ${DB_NAME}; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${DB_NAME}';" 2>/dev/null || echo "0")
    
    if [ "$TABLES_COUNT" -gt "0" ]; then
        print_success "Database setup verified! Found $TABLES_COUNT tables."
        
        echo -e "\n${BLUE}Database Details:${NC}"
        echo "  Database: $DB_NAME"
        echo "  Host: $DB_HOST:$DB_PORT"
        echo "  User: $DB_USER"
        echo "  Tables: $TABLES_COUNT"
        
        mysql -u root -p -e "USE ${DB_NAME}; SHOW TABLES;" 2>/dev/null || echo "Could not list tables"
    else
        print_error "Database setup verification failed!"
        exit 1
    fi
}

show_connection_info() {
    echo -e "\n${GREEN}Setup Complete!${NC}"
    echo -e "\n${BLUE}Connection Information for your backend:${NC}"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  Username: $DB_USER"
    echo "  Password: $DB_PASSWORD"
    
    echo -e "\n${BLUE}Sample .env configuration:${NC}"
    echo "DB_HOST=$DB_HOST"
    echo "DB_PORT=$DB_PORT"
    echo "DB_NAME=$DB_NAME"
    echo "DB_USER=$DB_USER"
    echo "DB_PASS=$DB_PASSWORD"
    
    echo -e "\n${BLUE}Sample Node.js connection:${NC}"
    cat << 'EOF'
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'stock_user',
  password: 'stock_password_2024',
  database: 'ai_stock_management',
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);
EOF
}

main() {
    print_header
    
    case "${1:-setup}" in
        "setup")
            check_mysql
            create_database
            run_schema
            verify_setup
            show_connection_info
            ;;
        "schema-only")
            run_schema
            verify_setup
            ;;
        "verify")
            verify_setup
            ;;
        "info")
            show_connection_info
            ;;
        *)
            echo "Usage: $0 [setup|schema-only|verify|info]"
            echo "  setup      - Full setup (default)"
            echo "  schema-only - Run schema only"
            echo "  verify     - Verify existing setup"
            echo "  info       - Show connection info"
            exit 1
            ;;
    esac
    
    print_success "Database setup completed successfully!"
}

main "$@"
