import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv('API_URL', 'http://localhost:3001')
BASE_URL = API_URL

def get_auth_token(email: str, password: str) -> str:
    """Get authentication token for a user
    
    Args:
        email: User email
        password: User password
        
    Returns:
        JWT token string
    """
    response = requests.post(
        f"{API_URL}/api/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    assert response.status_code == 200, f"Login failed with status {response.status_code}"
    return response.json()["token"] 