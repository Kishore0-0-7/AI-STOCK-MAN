#!/bin/bash

# Stock Summary API Test Script
# Run this script to test all stock summary endpoints

BASE_URL="http://localhost:5000/api/v1/stock-summary"

echo "🧪 Testing Stock Summary API Endpoints"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    echo "----------------------------------------"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint")
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -eq 200 ]; then
            echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        else
            echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
            echo "$body"
        fi
    fi
}

# Test 1: Get stock summary (default parameters)
test_endpoint "GET" "$BASE_URL" "Get Stock Summary (default)"

# Test 2: Get stock summary with pagination
test_endpoint "GET" "$BASE_URL?page=1&limit=5" "Get Stock Summary (paginated)"

# Test 3: Get stock summary with search
test_endpoint "GET" "$BASE_URL?search=iron&limit=3" "Get Stock Summary (search)"

# Test 4: Get stock summary with category filter
test_endpoint "GET" "$BASE_URL?category=Iron%20Castings&limit=3" "Get Stock Summary (category filter)"

# Test 5: Get stock summary with stock filter
test_endpoint "GET" "$BASE_URL?stockFilter=low_stock&limit=3" "Get Stock Summary (low stock filter)"

# Test 6: Get stock summary with sorting
test_endpoint "GET" "$BASE_URL?sortBy=stock&sortOrder=desc&limit=3" "Get Stock Summary (sorted by stock)"

# Test 7: Get movement trends
test_endpoint "GET" "$BASE_URL/trends" "Get Movement Trends (7 days)"

# Test 8: Get movement trends (30 days)
test_endpoint "GET" "$BASE_URL/trends?days=30" "Get Movement Trends (30 days)"

# Test 9: Get category distribution
test_endpoint "GET" "$BASE_URL/category-distribution" "Get Category Distribution"

# Test 10: Get product movements (this will fail if no products exist)
echo -e "\n${BLUE}Testing: Get Product Movements${NC}"
echo "Note: This requires a valid product ID from your database"
echo "Endpoint: GET $BASE_URL/movements/[PRODUCT_ID]"
echo "Skipping this test - requires valid product ID"

echo -e "\n${BLUE}=============================================${NC}"
echo -e "${BLUE}Stock Summary API Test Complete${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check if server is running
echo -e "\n${BLUE}Checking server health...${NC}"
health_response=$(curl -s -w "\n%{http_code}" "http://localhost:5000/health")
health_code=$(echo "$health_response" | tail -n1)

if [ "$health_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Server is running and healthy${NC}"
else
    echo -e "${RED}❌ Server health check failed${NC}"
    echo "Make sure the server is running with: npm start"
fi
