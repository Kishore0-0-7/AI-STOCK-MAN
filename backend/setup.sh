#!/bin/bash

echo "🚀 AI Stock Management Backend Setup"
echo "===================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "✅ Node.js and MySQL found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Database setup
echo "🗄️ Setting up database..."
echo "Please enter your MySQL root password when prompted:"

mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS ai_stock_management;
SHOW DATABASES LIKE 'ai_stock_management';
"

if [ $? -eq 0 ]; then
    echo "✅ Database 'ai_stock_management' created successfully"
else
    echo "❌ Failed to create database. Please check your MySQL credentials."
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update database credentials in config/database.js if needed"
echo "2. Run 'npm start' to start the server"
echo "3. Visit http://localhost:4000 for API documentation"
echo ""
echo "Happy coding! 🚀"
