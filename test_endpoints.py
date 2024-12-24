import requests
import json
import sys
from datetime import datetime, timedelta

BASE_URL = "http://10.0.0.105:3002"

def log_response(response, prefix=""):
    """Log response details"""
    print(f"\n{prefix} Response Details:")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    try:
        print(f"Content: {response.text[:1000]}...")  # First 1000 chars
    except Exception as e:
        print(f"Error reading content: {e}")

def make_request(method, url, **kwargs):
    """Make HTTP request with error handling"""
    print(f"\nMaking {method} request to {url}")
    try:
        response = requests.request(method, url, **kwargs)
        log_response(response)
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        print(f"Request details: {kwargs}")
        raise

# Test data
test_invoice_item = {
    "id": "item1",
    "description": "Test Item",
    "quantity": 1,
    "unitPrice": 100.00
}

test_person = {
    "name": "Test Person",
    "city": "Test City",
    "address": "123 Test St",
    "phone": "123-456-7890",
    "email": "test@example.com"
}

test_invoice = {
    "invoiceId": f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "issueDate": datetime.now().strftime("%Y-%m-%d"),
    "dueDate": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
    "currency": "USD",
    "taxValue": 10.00,
    "amountPaid": 0.00,
    "terms": "Net 30",
    "items": [test_invoice_item]
}

test_data = {
    "client": test_person,
    "seller": test_person,
    "invoice": test_invoice,
    "isEditable": True
}

def test_create_invoice():
    """Test creating a new invoice"""
    print("\nTesting invoice creation...")
    response = make_request("POST", f"{BASE_URL}/api/invoice", json=test_data)
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert data["invoiceId"] == test_invoice["invoiceId"], "Invoice ID mismatch"
    print("✓ Invoice created successfully")
    return data

def test_get_all_invoices():
    """Test getting all invoices"""
    print("\nTesting get all invoices...")
    response = make_request("GET", f"{BASE_URL}/api/invoice/all")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert isinstance(data, list), "Expected list response"
    print(f"✓ Retrieved {len(data)} invoices")
    return data

def test_get_invoice_by_id(invoice_id):
    """Test getting a specific invoice"""
    print(f"\nTesting get invoice by ID: {invoice_id}")
    response = make_request("GET", f"{BASE_URL}/api/invoice/{invoice_id}")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert data["invoice"]["invoiceId"] == invoice_id, "Invoice ID mismatch"
    print("✓ Retrieved specific invoice")
    return data

def test_download_invoice():
    """Test downloading invoice as PDF"""
    print("\nTesting invoice PDF download...")
    response = make_request("POST", f"{BASE_URL}/api/invoice/download", json=test_data)
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    content_type = response.headers.get("content-type", "")
    assert any(ct in content_type.lower() for ct in ["application/pdf", "application/octet-stream"]), \
        f"Expected PDF or octet-stream content type, got {content_type}"
    
    # Verify it's actually a PDF by checking the header
    assert response.content.startswith(b"%PDF-"), "Response content is not a valid PDF"
    print(f"✓ Downloaded PDF ({len(response.content)} bytes)")
    return response.content

def test_get_nonexistent_invoice():
    """Test getting a non-existent invoice"""
    print("\nTesting non-existent invoice retrieval...")
    response = make_request("GET", f"{BASE_URL}/api/invoice/nonexistent-id")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "failure", "Expected failure status"
    assert "Invoice doesn't exist" in data["data"]["message"], "Expected 'Invoice doesn't exist' message"
    print("✓ Non-existent invoice handled correctly")

def run_tests():
    """Run all tests with error handling"""
    try:
        print("\n=== Starting API Tests ===")
        
        invoice_data = test_create_invoice()
        test_get_all_invoices()
        test_get_invoice_by_id(test_invoice["invoiceId"])
        test_download_invoice()
        test_get_nonexistent_invoice()
        
        print("\n=== All tests completed successfully! ===")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_tests() 