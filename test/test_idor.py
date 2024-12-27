import json
import os
import time
from typing import Dict, Optional

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = os.getenv("API_URL", "http://localhost:3000") + "/api"


class InvoicerClient:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None

    def register(self) -> bool:
        """Register a new user, ignore if already exists"""
        try:
            response = requests.post(
                f"{BASE_URL}/auth/register",
                json={"username": self.username, "password": self.password},
            )
            return response.status_code == 200
        except:
            return False

    def login(self) -> bool:
        """Login and get JWT token"""
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"username": self.username, "password": self.password},
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.user_id = data.get("user", {}).get("id")
                return True
        except:
            pass
        return False

    @property
    def headers(self) -> Dict[str, str]:
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def create_invoice(self, invoice_id: str, amount: float) -> Optional[Dict]:
        """Create a new invoice"""
        data = {
            "invoice": {
                "invoiceId": invoice_id,
                "issueDate": "2024-01-01",
                "items": [
                    {
                        "description": f"Test Item for {self.username}",
                        "quantity": 1,
                        "unitPrice": amount,
                    }
                ],
            },
            "client": {
                "name": "Test Client",
                "email": "client@test.com",
                "address": "123 Client St",
            },
            "seller": {
                "name": "Test Seller",
                "email": "seller@test.com",
                "address": "456 Seller Ave",
            },
        }
        try:
            response = requests.post(
                f"{BASE_URL}/invoice", headers=self.headers, json=data
            )
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return None

    def get_invoice(self, invoice_id: str) -> Optional[Dict]:
        """Get a specific invoice"""
        try:
            response = requests.get(
                f"{BASE_URL}/invoice/{invoice_id}", headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return None

    def update_invoice(self, invoice_id: str, new_amount: float) -> Optional[Dict]:
        """Update an invoice"""
        data = {
            "items": [
                {"description": "Updated Item", "quantity": 1, "unitPrice": new_amount}
            ]
        }
        try:
            response = requests.put(
                f"{BASE_URL}/invoice/{invoice_id}", headers=self.headers, json=data
            )
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return None

    def delete_invoice(self, invoice_id: str) -> Optional[Dict]:
        """Delete an invoice"""
        try:
            response = requests.delete(
                f"{BASE_URL}/invoice/{invoice_id}", headers=self.headers
            )
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return None

    def list_invoices(self) -> Optional[Dict]:
        """List all invoices for the user"""
        try:
            response = requests.get(f"{BASE_URL}/invoice/all", headers=self.headers)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return None


def print_step(step_num: int, description: str):
    """Print a step header"""
    print(f"\n{'-' * 80}")
    print(f"Step {step_num}: {description}")
    print(f"{'-' * 80}")


def print_result(title: str, data: Optional[Dict]):
    """Print a result with proper formatting"""
    print(f"\n{title}:")
    if data:
        print(json.dumps(data, indent=2))
    else:
        print("No data or operation failed")


def test_idor():
    # Create two users
    alice = InvoicerClient("alice", "alice123")
    bob = InvoicerClient("bob", "bob123")

    print_step(1, "Setting up users")
    print("Registering users (will proceed even if they exist)...")
    alice.register()
    bob.register()

    print("\nLogging in users...")
    if not alice.login():
        print("Failed to login as Alice!")
        return
    if not bob.login():
        print("Failed to login as Bob!")
        return
    print("Both users logged in successfully!")

    # Generate unique invoice IDs using timestamp to avoid conflicts
    timestamp = int(time.time())
    alice_invoice_id = f"ALICE{timestamp}"
    bob_invoice_id = f"BOB{timestamp}"

    print_step(2, "Creating invoices")
    alice_invoice = alice.create_invoice(alice_invoice_id, 100.00)
    print_result("Alice's invoice", alice_invoice)

    bob_invoice = bob.create_invoice(bob_invoice_id, 200.00)
    print_result("Bob's invoice", bob_invoice)

    if not alice_invoice or not bob_invoice:
        print("Failed to create test invoices!")
        return

    print_step(3, "Testing IDOR #1: Unauthorized Access")
    alice_invoice_viewed_by_bob = bob.get_invoice(alice_invoice_id)
    print_result("Bob accessing Alice's invoice", alice_invoice_viewed_by_bob)

    print_step(4, "Testing IDOR #2: Unauthorized Modification")
    modified_invoice = bob.update_invoice(alice_invoice_id, 1.00)
    print_result("Bob modifying Alice's invoice", modified_invoice)

    print_step(5, "Verifying Modification")
    alice_invoice_after_mod = alice.get_invoice(alice_invoice_id)
    print_result("Alice's invoice after Bob's modification", alice_invoice_after_mod)

    print_step(6, "Testing IDOR #3: Unauthorized Deletion")
    delete_result = bob.delete_invoice(alice_invoice_id)
    print_result("Bob deleting Alice's invoice", delete_result)

    print_step(7, "Verifying Deletion")
    alice_invoice_after_delete = alice.get_invoice(alice_invoice_id)
    print_result("Alice's invoice after Bob's deletion", alice_invoice_after_delete)

    print_step(8, "Verifying Protected List Endpoint")
    bob_invoices = bob.list_invoices()
    print_result("Bob's invoice list (should only see his own)", bob_invoices)

    # Clean up Bob's invoice
    print_step(9, "Cleaning up")
    bob.delete_invoice(bob_invoice_id)
    print("Test completed!")


if __name__ == "__main__":
    test_idor()
