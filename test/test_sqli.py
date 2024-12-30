import json
import unittest
from urllib.parse import quote

import pytest
import requests

BASE_URL = "http://localhost:3000"


def test_init_sample_data():
    """Test initializing sample data in MySQL database"""
    response = requests.post(f"{BASE_URL}/mysql/init-sample")
    assert response.status_code == 200
    assert "Sample data initialized successfully" in response.json()["message"]


def test_search_sqli():
    """Test SQL injection vulnerability in search endpoint"""
    # First, ensure we have sample data
    requests.post(f"{BASE_URL}/mysql/init-sample")

    # Normal search should return specific results
    normal_query = "John"
    response = requests.get(f"{BASE_URL}/mysql/search?query={normal_query}")
    normal_results = response.json()
    assert len(normal_results) == 1  # Should only find John Doe

    # SQL injection should return all results
    sqli_query = quote("' OR '1'='1")
    response = requests.get(f"{BASE_URL}/mysql/search?query={sqli_query}")
    sqli_results = response.json()
    assert len(sqli_results) > len(normal_results)  # Should return all customers


def test_credit_check_sqli():
    """Test SQL injection vulnerability in credit check endpoint"""
    # First, ensure we have sample data
    requests.post(f"{BASE_URL}/mysql/init-sample")

    # Normal credit check
    response = requests.get(f"{BASE_URL}/mysql/credit?customer_id=1")
    normal_credit = float(response.json()["credit_limit"])

    # SQL injection to get higher credit limit
    sqli_query = quote("0 UNION SELECT 999999")
    response = requests.get(f"{BASE_URL}/mysql/credit?customer_id={sqli_query}")
    sqli_credit = float(response.json()["credit_limit"])

    assert sqli_credit > normal_credit


def test_order_creation_sqli():
    """Test SQL injection vulnerability in order creation endpoint"""
    # First, ensure we have sample data
    requests.post(f"{BASE_URL}/mysql/init-sample")

    # Normal order creation
    normal_order = {"customer_id": "1", "amount": "100", "notes": "Normal order"}
    response = requests.post(
        f"{BASE_URL}/mysql/order",
        headers={"Content-Type": "application/json"},
        json=normal_order,
    )
    assert response.status_code == 200

    # SQL injection attempt
    sqli_order = {
        "customer_id": "1 OR 1=1",
        "amount": "100",
        "notes": "test'); DROP TABLE Orders; --",
    }
    response = requests.post(
        f"{BASE_URL}/mysql/order",
        headers={"Content-Type": "application/json"},
        json=sqli_order,
    )
    assert response.status_code == 500  # Should fail with SQL error
    assert "SQL syntax" in response.json()["error"]


def test_safe_search():
    """Test that safe search endpoint is not vulnerable to SQL injection"""
    # First, ensure we have sample data
    requests.post(f"{BASE_URL}/mysql/init-sample")

    # Normal search should return specific results
    normal_query = "John"
    response = requests.get(f"{BASE_URL}/mysql/safe-search?query={normal_query}")
    normal_results = response.json()
    assert len(normal_results) == 1  # Should only find John Doe

    # SQL injection attempt should not return additional results
    sqli_query = quote("' OR '1'='1")
    response = requests.get(f"{BASE_URL}/mysql/safe-search?query={sqli_query}")
    sqli_results = response.json()
    assert len(sqli_results) == 0  # Should not find any results with SQL injection


def create_test_suite():
    """Create a test suite containing all SQL injection tests."""
    suite = unittest.TestSuite()

    # Add all SQL injection tests
    test_functions = [
        test_init_sample_data,
        test_search_sqli,
        test_credit_check_sqli,
        test_order_creation_sqli,
        test_safe_search,
    ]

    for test_func in test_functions:
        suite.addTest(unittest.FunctionTestCase(test_func))

    return suite


if __name__ == "__main__":
    # Create and run the test suite
    suite = create_test_suite()
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)
