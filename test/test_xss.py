import pytest
import requests

# Test configuration
BASE_URL = "http://localhost:3000"


@pytest.fixture
def api_client():
    """Create a session for making API requests."""
    return requests.Session()


def test_reflected_xss_search():
    """Test that the search endpoint reflects XSS payload."""
    payload = '<script>alert("xss")</script>'
    response = requests.get(f"{BASE_URL}/api/search", params={"q": payload})
    assert response.status_code == 200
    data = response.json()
    assert payload in data["rawHtml"]
    assert payload in data["searchHeader"]


def test_stored_xss_comment():
    """Test that comments endpoint stores XSS payload."""
    # First, post the comment with XSS payload
    payload = {"comment": '<script>alert("xss")</script>', "author": "test_user"}
    response = requests.post(f"{BASE_URL}/api/comments", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Then, get the comments to verify the XSS payload was stored
    response = requests.get(f"{BASE_URL}/api/comments")
    assert response.status_code == 200
    comments = response.json()
    assert any(payload["comment"] in comment["rawHtml"] for comment in comments)


def test_stored_xss_author():
    """Test that author field is vulnerable to XSS."""
    # First, post the comment with XSS payload in author
    payload = {"comment": "Normal comment", "author": '<script>alert("xss")</script>'}
    response = requests.post(f"{BASE_URL}/api/comments", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Then, get the comments to verify the XSS payload was stored
    response = requests.get(f"{BASE_URL}/api/comments")
    assert response.status_code == 200
    comments = response.json()
    assert any(payload["author"] in comment["rawHtml"] for comment in comments)


def test_js_context_breaking():
    """Test breaking out of JavaScript context in search."""
    payload = '");alert("xss");("'
    response = requests.get(f"{BASE_URL}/api/search", params={"q": payload})
    assert response.status_code == 200
    data = response.json()
    assert payload in data["rawHtml"]
