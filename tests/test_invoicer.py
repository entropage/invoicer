import sys
import requests
import time

def test_invoicer(base_url):
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
                "name": "Test Client",
                "email": "test@example.com",
                "address": "123 Test St"
            },
            "seller": {
                "name": "Test Seller",
                "email": "seller@example.com",
                "address": "456 Seller St"
            },
            "invoice": {
                "invoiceId": "TEST001",
                "items": [
                    {
                        "description": "Test Item",
                        "quantity": 1,
                        "price": 100
                    }
                ]
            }
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

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_endpoints.py <service_name>")
        sys.exit(1)
        
    service = sys.argv[1]
    base_url = f"http://10.0.0.105:3001"
    
    if service == "invoicer":
        test_invoicer(base_url)
    else:
        print(f"Unknown service: {service}")
        sys.exit(1)

if __name__ == "__main__":
    main() 