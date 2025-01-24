import base64
import os
import subprocess
import time
from datetime import datetime

import jwt
import pytest
import requests
from pymongo import MongoClient

# Test constants
TEST_JWT_SECRET = "your-jwt-secret-key-2024"
MONGO_URI = "mongodb://localhost:27017/invoicer_test"


@pytest.fixture(scope="module")
def requests_session():
    """Create a requests session and manage application lifecycle"""
    # Kill any existing app instance
    subprocess.run(["pkill", "-f", "fusion dev"], check=False)

    # Start the app with test database
    env = os.environ.copy()
    env["MONGODB_URI"] = MONGO_URI
    env["PORT"] = "3000"

    app_process = subprocess.Popen(
        ["yarn", "fusion", "dev"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    # Wait for app to start
    print("Waiting for app to start...")
    time.sleep(10)

    # Create session
    session = requests.Session()

    yield session

    # Cleanup
    session.close()
    app_process.terminate()
    app_process.wait()

    # Drop test database
    client = MongoClient(MONGO_URI)
    client.drop_database("invoicer_test")
    client.close()


@pytest.fixture(scope="module")
def test_users():
    """Create test users in the database"""
    # Connect to database
    client = MongoClient(MONGO_URI)
    db = client.get_database()

    # Create test users
    users = db.users
    password = "test123"
    # VULNERABILITY: Using base64 encoding instead of proper hashing
    encoded_password = base64.b64encode(password.encode()).decode()

    # Create users with consistent field names
    user1 = users.insert_one(
        {
            "username": "user1",
            "password": encoded_password,
            "role": "user",
            "createdAt": datetime.utcnow(),
        }
    )

    user2 = users.insert_one(
        {
            "username": "user2",
            "password": encoded_password,
            "role": "user",
            "createdAt": datetime.utcnow(),
        }
    )

    user_ids = [str(user1.inserted_id), str(user2.inserted_id), encoded_password]

    # Close connection
    client.close()

    return user_ids


@pytest.fixture(scope="module")
def test_invoice(test_users):
    """Create test invoice"""
    # Connect to database
    client = MongoClient(MONGO_URI)
    db = client.get_database()

    # Create test invoice
    invoices = db.invoices
    invoice = invoices.insert_one(
        {
            "invoiceId": "TEST-001",
            "userId": test_users[0],
            "issueDate": "2024-01-01",
            "dueDate": "2024-02-01",
            "items": [],
            "accessList": [],
        }
    )

    invoice_id = str(invoice.inserted_id)

    # Close connection
    client.close()

    return invoice_id


@pytest.fixture(scope="module")
def auth_headers(test_users):
    """Create authentication headers with JWT token"""
    token = jwt.encode(
        {"id": test_users[0], "username": "user1", "role": "user"},
        TEST_JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def test_sensitive_data_leakage(requests_session, auth_headers, test_users):
    """Test that /api/users endpoint leaks sensitive data"""
    # Print request details
    print("\nRequest details:")
    print("URL:", "http://localhost:3000/api/users")
    print("Headers:", auth_headers)

    response = requests_session.get(
        "http://localhost:3000/api/users", headers=auth_headers
    )

    # Print response details
    print("\nResponse details:")
    print("Status code:", response.status_code)
    print("Response headers:", dict(response.headers))

    assert response.status_code == 200

    try:
        users = response.json()
    except Exception as e:
        print("Failed to parse JSON response:", str(e))
        print("Raw response:", response.text)
        raise

    # Print response data
    print("\nResponse data:")
    print("Users:", users)
    print("Number of users:", len(users) if isinstance(users, list) else "not a list")
    print("Looking for user ID:", test_users[0])
    if isinstance(users, list):
        print("Available user IDs:", [u.get("_id") for u in users])

    # Verify password hash is leaked
    found_user = None
    for user in users:
        print(f"Checking user: {user}")  # Print each user we're checking
        if str(user.get("_id")) == test_users[0]:
            found_user = user
            break

    assert (
        found_user is not None
    ), f"User {test_users[0]} not found in response. Available users: {users}"
    assert (
        found_user.get("password") == test_users[2]
    ), f"Password hash mismatch. Expected: {test_users[2]}, Got: {found_user.get('password')}"
    assert "role" in found_user, f"Role field missing from user: {found_user}"


def test_invoice_sharing(requests_session, auth_headers, test_users, test_invoice):
    """Test invoice sharing functionality"""
    # Try sharing invoice
    response = requests_session.post(
        "http://localhost:3000/api/invoice/TEST-001/share",
        headers=auth_headers,
        json={"userId": test_users[1]},
    )
    assert response.status_code == 200

    # Verify shared user can access the invoice
    token2 = jwt.encode(
        {"id": test_users[1], "username": "user2", "role": "user"},
        TEST_JWT_SECRET,
        algorithm="HS256",
    )
    headers2 = {"Authorization": f"Bearer {token2}"}

    response = requests_session.get(
        "http://localhost:3000/api/invoice/TEST-001", headers=headers2
    )
    assert response.status_code == 200
    invoice = response.json()
    assert invoice["invoiceId"] == "TEST-001"


def test_invoice_unsharing(requests_session, auth_headers, test_users, test_invoice):
    """Test removing share access"""
    # Remove share access
    response = requests_session.delete(
        "http://localhost:3000/api/invoice/TEST-001/share",
        headers=auth_headers,
        json={"userId": test_users[1]},
    )
    assert response.status_code == 200

    # Verify shared user can no longer access the invoice
    token2 = jwt.encode(
        {"id": test_users[1], "username": "user2", "role": "user"},
        TEST_JWT_SECRET,
        algorithm="HS256",
    )
    headers2 = {"Authorization": f"Bearer {token2}"}

    response = requests_session.get(
        "http://localhost:3000/api/invoice/TEST-001", headers=headers2
    )
    assert response.status_code == 404
