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

class TestUserIDOR:
    def test_access_other_user_profile(self, auth_headers):
        """Test IDOR: User1 accessing User2's profile"""
        query = """
        query {
            userProfile(userId: "2") {
                id
                phoneNumber
                bankDetails
                sensitiveNotes
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "userProfile" in result["data"]
        assert result["data"]["userProfile"] is not None  # Should succeed due to IDOR

    def test_update_other_user_profile(self, auth_headers):
        """Test IDOR: User1 updating User2's profile"""
        query = """
        mutation {
            updateUserProfile(
                userId: "2",
                input: {
                    phoneNumber: "9999999999",
                    bankDetails: "Compromised Bank Details",
                    sensitiveNotes: "Compromised Notes"
                }
            ) {
                id
                phoneNumber
                bankDetails
                sensitiveNotes
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "updateUserProfile" in result["data"]  # Should succeed due to IDOR

class TestInvoiceIDOR:
    def test_access_other_user_invoice(self, auth_headers):
        """Test IDOR: Accessing invoice belonging to another user"""
        query = """
        query {
            invoice(id: "2") {
                id
                number
                amount
                owner {
                    id
                    email
                    profile {
                        bankDetails
                        sensitiveNotes
                    }
                }
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "invoice" in result["data"]
        assert result["data"]["invoice"] is not None  # Should succeed due to IDOR

    def test_nested_data_exposure(self, auth_headers):
        """Test IDOR: Accessing sensitive data through nested queries"""
        query = """
        query {
            invoice(id: "2") {
                owner {
                    profile {
                        bankDetails
                        sensitiveNotes
                    }
                    preferences {
                        theme
                        notifications
                    }
                }
                client {
                    email
                    phone
                }
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "invoice" in result["data"]
        assert result["data"]["invoice"]["owner"]["profile"] is not None  # Should expose sensitive data

    def test_unauthorized_invoice_update(self, auth_headers):
        """Test IDOR: Updating another user's invoice"""
        query = """
        mutation {
            updateInvoice(
                id: "2",
                input: {
                    number: "COMPROMISED-001",
                    status: PAID
                }
            ) {
                id
                number
                status
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "updateInvoice" in result["data"]  # Should succeed due to IDOR

class TestCommentIDOR:
    def test_access_private_comments(self, auth_headers):
        """Test IDOR: Accessing comments on another user's invoice"""
        query = """
        query {
            invoiceComments(invoiceId: "2") {
                id
                content
                user {
                    email
                    profile {
                        bankDetails
                    }
                }
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "invoiceComments" in result["data"]
        assert isinstance(result["data"]["invoiceComments"], list)  # Should expose comments

    def test_add_comment_to_other_invoice(self, auth_headers):
        """Test IDOR: Adding comment to another user's invoice"""
        query = """
        mutation {
            addInvoiceComment(
                invoiceId: "2",
                content: "Unauthorized comment"
            ) {
                id
                content
                invoiceId
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "addInvoiceComment" in result["data"]  # Should succeed due to IDOR

class TestDataTraversal:
    def test_traverse_relationships(self, auth_headers):
        """Test IDOR: Traversing relationships to access unauthorized data"""
        query = """
        query {
            invoice(id: "1") {
                owner {
                    sharedInvoices {
                        id
                        number
                        owner {
                            profile {
                                bankDetails
                                sensitiveNotes
                            }
                        }
                    }
                }
            }
        }
        """
        result = graphql_query(query, auth_headers)
        assert "data" in result
        assert "invoice" in result["data"]
        # Should be able to traverse and access data from other users 