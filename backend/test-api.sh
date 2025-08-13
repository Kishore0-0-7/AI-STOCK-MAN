#!/bin/bash

# Test script for AI Stock Management Backend API
# This script tests all the dashboard endpoints

echo "🧪 Testing AI Stock Management Backend API..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"
API_URL="${BASE_URL}/api/v1"

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${BLUE}Testing:${NC} ${method} ${endpoint}"
    echo -e "${YELLOW}Description:${NC} ${description}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}${endpoint}")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "${data}" "${API_URL}${endpoint}")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ PASS${NC} - HTTP ${response}"
    else
        echo -e "${RED}❌ FAIL${NC} - HTTP ${response}"
    fi
    echo "---"
}

# Test health check first
echo -e "${BLUE}Testing Health Check...${NC}"
health_response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
if [ "$health_response" = "200" ]; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not responding${NC}"
    exit 1
fi
echo "---"

# Test Dashboard Endpoints
echo -e "${YELLOW}🏠 DASHBOARD API TESTS${NC}"
test_endpoint "GET" "/dashboard/overview" "Get dashboard overview metrics"
test_endpoint "GET" "/dashboard/activity" "Get recent activities"
test_endpoint "GET" "/dashboard/trends" "Get trends data"
test_endpoint "GET" "/dashboard/stock-summary" "Get stock summary by category"
test_endpoint "GET" "/dashboard/alerts" "Get active alerts"
test_endpoint "GET" "/dashboard/stock-movements" "Get recent stock movements"
test_endpoint "GET" "/dashboard/sales-metrics" "Get sales analytics"
test_endpoint "GET" "/dashboard/purchase-metrics" "Get purchase analytics"
test_endpoint "GET" "/dashboard/warehouse-metrics" "Get warehouse utilization"
test_endpoint "GET" "/dashboard/quality-metrics" "Get quality control metrics"

# Test with query parameters
test_endpoint "GET" "/dashboard/alerts?limit=5&priority=high" "Get high priority alerts (limited)"
test_endpoint "GET" "/dashboard/sales-metrics?period=7" "Get sales metrics for last 7 days"

# Test Products Endpoints
echo -e "${YELLOW}📦 PRODUCTS API TESTS${NC}"
test_endpoint "GET" "/products" "Get all products"
test_endpoint "GET" "/products/low-stock" "Get low stock products"
test_endpoint "GET" "/products/categories" "Get product categories"

# Test Alerts Endpoints
echo -e "${YELLOW}🚨 ALERTS API TESTS${NC}"
test_endpoint "GET" "/alerts" "Get all alerts"
test_endpoint "GET" "/alerts/stats" "Get alert statistics"

# Test Activity Logging
test_endpoint "POST" "/dashboard/activity" "Log user activity" '{
    "activity_type": "view",
    "description": "User viewed dashboard",
    "user_name": "Test User",
    "user_role": "admin"
}'

echo -e "${GREEN}🎉 API Testing Complete!${NC}"
echo "---"
echo -e "${BLUE}Available Endpoints:${NC}"
echo "🏥 Health: ${BASE_URL}/health"
echo "📊 Dashboard: ${API_URL}/dashboard/*"
echo "📦 Products: ${API_URL}/products"
echo "🚨 Alerts: ${API_URL}/alerts"
echo "---"
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your frontend .env with: VITE_API_URL=http://localhost:5000/api/v1"
echo "2. Test the frontend connection"
echo "3. Create sample data in your database"
