import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3002"

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
    response = requests.post(f"{BASE_URL}/api/invoice", json=test_data)
    assert response.status_code == 200
    data = response.json()
    assert data["invoiceId"] == test_invoice["invoiceId"]
    return data

def test_get_all_invoices():
    """Test getting all invoices"""
    response = requests.get(f"{BASE_URL}/api/invoice/all")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    return data

def test_get_invoice_by_id(invoice_id):
    """Test getting a specific invoice"""
    response = requests.get(f"{BASE_URL}/api/invoice/{invoice_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["invoice"]["invoiceId"] == invoice_id
    return data

def test_download_invoice():
    """Test downloading invoice as PDF"""
    response = requests.post(f"{BASE_URL}/api/invoice/download", json=test_data)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    return response.content

def test_get_nonexistent_invoice():
    """Test getting a non-existent invoice"""
    response = requests.get(f"{BASE_URL}/api/invoice/nonexistent-id")
    assert response.status_code == 404

def run_tests():
    print("Running endpoint tests...")
    
    print("\n1. Creating new invoice...")
    invoice_data = test_create_invoice()
    print("✓ Invoice created successfully")
    
    print("\n2. Getting all invoices...")
    invoices = test_get_all_invoices()
    print(f"✓ Retrieved {len(invoices)} invoices")
    
    print("\n3. Getting specific invoice...")
    invoice = test_get_invoice_by_id(test_invoice["invoiceId"])
    print("✓ Retrieved specific invoice")
    
    print("\n4. Downloading invoice PDF...")
    pdf_data = test_download_invoice()
    print(f"✓ Downloaded PDF ({len(pdf_data)} bytes)")
    
    print("\n5. Testing error case...")
    test_get_nonexistent_invoice()
    print("✓ Non-existent invoice handled correctly")
    
    print("\nAll tests completed successfully!")

if __name__ == "__main__":
    run_tests() 