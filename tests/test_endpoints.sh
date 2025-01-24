#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:3001"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=$3
    
    echo -e "\nTesting ${method} ${endpoint}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "${method}" "${BASE_URL}${endpoint}" -H "Content-Type: application/json" -d "${data}")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Success (HTTP ${status_code})${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed (HTTP ${status_code})${NC}"
        echo "$body"
    fi
}

# Test health endpoint
test_endpoint "/health"

# Test vulnerable endpoints
test_endpoint "/api/file/read?file=test.txt"
test_endpoint "/api/file/secure-read?filename=test.txt"
test_endpoint "/api/file/template?template=invoice.html"

# Test system endpoints
test_endpoint "/api/system/info"
test_endpoint "/api/system/ping"

# Test authentication
test_endpoint "/api/auth/register" "POST" '{"username":"test","password":"test123"}'
token=$(curl -s -X POST "${BASE_URL}/api/auth/login" -H "Content-Type: application/json" -d '{"username":"test","password":"test123"}' | jq -r '.token')

# Test authenticated endpoints
test_endpoint "/api/invoice/all" "GET" "" "Authorization: Bearer ${token}" 