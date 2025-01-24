import logging
import os
import sys

from playwright.sync_api import sync_playwright

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Configuration
API_URL = os.getenv("API_URL", "http://10.0.0.105:3001")
TEST_USERNAME = os.getenv("TEST_USERNAME", "test")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "test123")


def test_login():
    """Test login functionality including form submission and JWT token verification."""
    logger.info("Starting login functionality test")

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        page = browser.new_page()

        try:
            # Navigate to login page
            logger.info("Navigating to login page")
            page.goto(f"{API_URL}/login", wait_until="networkidle")

            # Wait for login form to load
            page.wait_for_selector("form", timeout=10000)
            logger.info("Login form loaded")

            # Take screenshot of login page
            page.screenshot(path="tests/screenshots/login-page.png")
            logger.info("Login page screenshot saved")

            # Fill in login form
            page.type('input[type="text"]', TEST_USERNAME)
            page.type('input[type="password"]', TEST_PASSWORD)
            logger.info("Filled in login credentials")

            # Submit form and wait for navigation
            with page.expect_navigation():
                page.click('button[type="submit"]')
            logger.info("Submitted login form")

            # Check if redirected to home page
            current_url = page.url
            logger.info(f"Current URL: {current_url}")

            if current_url == f"{API_URL}/":
                logger.info("Login successful - redirected to home page")
            else:
                logger.error("Login failed - not redirected to home page")
                raise AssertionError("Login failed - incorrect redirect")

            # Take screenshot of home page
            page.screenshot(path="tests/screenshots/home-page.png")
            logger.info("Home page screenshot saved")

            # Check for error messages
            error_element = page.query_selector(
                'div[style*="backgroundColor: #ffebee"]'
            )
            if error_element:
                error_text = error_element.text_content()
                logger.error(f"Error message found: {error_text}")
                raise AssertionError(f"Login error: {error_text}")

            # Check local storage for token
            token = page.evaluate("() => localStorage.getItem('token')")
            if token:
                logger.info("JWT token found in localStorage")
            else:
                logger.error("No JWT token found in localStorage")
                raise AssertionError("No JWT token found after login")

        except Exception as e:
            logger.error(f"Test failed: {str(e)}")
            # Take screenshot of failure state
            page.screenshot(path="tests/screenshots/login-failure.png")
            raise
        finally:
            browser.close()
            logger.info("Browser closed")


if __name__ == "__main__":
    # Create screenshots directory if it doesn't exist
    os.makedirs("tests/screenshots", exist_ok=True)
    test_login()
