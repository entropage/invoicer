import json
import os

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def test_invoicer(base_url=None):
    base_url = base_url or os.getenv("API_URL", "http://localhost:3001")
    print(f"\nTesting invoicer at {base_url}")

    # Test GET /api/invoice/all
    try:
        response = requests.get(f"{base_url}/api/invoice/all")
        print(f"✅ GET /api/invoice/all returned {response.status_code}")
    except Exception as e:
        print(f"❌ Failed to connect to {base_url}/api/invoice/all: {str(e)}")

    # Test POST /api/invoice
    try:
        test_invoice = {
            "client": {
                "name": os.getenv("TEST_CLIENT_NAME", "Test Client"),
                "email": os.getenv("TEST_CLIENT_EMAIL", "test@example.com"),
                "address": os.getenv("TEST_CLIENT_ADDRESS", "123 Test St"),
            },
            "seller": {
                "name": os.getenv("TEST_SELLER_NAME", "Test Seller"),
                "email": os.getenv("TEST_SELLER_EMAIL", "seller@example.com"),
                "address": os.getenv("TEST_SELLER_ADDRESS", "456 Seller St"),
            },
            "invoice": {
                "invoiceId": "TEST001",
                "items": [{"description": "Test Item", "quantity": 1, "price": 100}],
            },
        }
        response = requests.post(f"{base_url}/api/invoice", json=test_invoice)
        print(f"✅ POST /api/invoice returned {response.status_code}")

        # If invoice creation was successful, test GET /api/invoice/:id
        if response.status_code == 200:
            invoice_id = response.json().get("invoiceId", "TEST001")
            response = requests.get(f"{base_url}/api/invoice/{invoice_id}")
            print(f"✅ GET /api/invoice/{invoice_id} returned {response.status_code}")

    except Exception as e:
        print(f"❌ Failed to test invoice creation: {str(e)}")


if __name__ == "__main__":
    test_invoicer()
