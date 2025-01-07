import pytest
import json
import requests
from test.utils.auth import get_auth_token, BASE_URL

GRAPHQL_ENDPOINT = f"{BASE_URL}/graphql"

@pytest.fixture
def auth_headers():
    token = get_auth_token("user1@test.com", "password123")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

@pytest.fixture
def auth_headers_user2():
    token = get_auth_token("user2@test.com", "password123")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def graphql_query(query, headers=None, variables=None):
    payload = {
        "query": query,
        "variables": variables or {}
    }
    response = requests.post(
        GRAPHQL_ENDPOINT,
        json=payload,
        headers=headers
    )
    return response.json()

class TestUserFeatures:
    def test_me_query(self, auth_headers):
        query = """
        query {
            me {
                id
                email
                role
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "me" in result["data"]
        assert result["data"]["me"]["email"] == "user1@test.com"

    def test_user_profile_creation(self, auth_headers):
        query = """
        mutation {
            updateUserProfile(
                userId: "1",
                input: {
                    phoneNumber: "1234567890",
                    companyName: "Test Company",
                    bankDetails: "Test Bank Details",
                    sensitiveNotes: "Sensitive Information"
                }
            ) {
                id
                phoneNumber
                companyName
                bankDetails
                sensitiveNotes
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "updateUserProfile" in result["data"]
        assert result["data"]["updateUserProfile"]["companyName"] == "Test Company"

class TestInvoiceFeatures:
    def test_create_invoice(self, auth_headers):
        query = """
        mutation {
            createInvoice(
                input: {
                    clientId: "1",
                    number: "INV-001",
                    items: [
                        {
                            description: "Test Item",
                            quantity: 1,
                            unitPrice: 100.00
                        }
                    ]
                }
            ) {
                id
                number
                amount
                status
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "createInvoice" in result["data"]
        assert result["data"]["createInvoice"]["number"] == "INV-001"

    def test_my_invoices(self, auth_headers):
        query = """
        query {
            myInvoices {
                id
                number
                amount
                status
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "myInvoices" in result["data"]
        assert isinstance(result["data"]["myInvoices"], list)

class TestClientFeatures:
    def test_create_client(self, auth_headers):
        query = """
        mutation {
            createClient(
                input: {
                    name: "Test Client",
                    email: "client@test.com",
                    phone: "1234567890"
                }
            ) {
                id
                name
                email
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "createClient" in result["data"]
        assert result["data"]["createClient"]["name"] == "Test Client" 