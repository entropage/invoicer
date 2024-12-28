import pytest
import requests
import logging
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class VulnerabilityTest:
    """Base class for vulnerability tests"""
    
    # Configuration
    API_URL = os.getenv('API_URL', 'http://localhost:3001')
    TEST_TIMEOUT = int(os.getenv('TEST_TIMEOUT', '5000'))
    TEST_RETRIES = int(os.getenv('TEST_RETRIES', '3'))
    
    @classmethod
    def setup_class(cls):
        """Setup before all tests in the class"""
        logger.info(f"\nSetting up {cls.__name__} test environment...")
        cls._wait_for_app_server()
    
    @classmethod
    def teardown_class(cls):
        """Cleanup after all tests in the class"""
        logger.info(f"\nCleaning up {cls.__name__} test environment...")
    
    @classmethod
    def _wait_for_app_server(cls, timeout: int = 30, interval: int = 1):
        """Wait for application server to be ready"""
        for _ in range(timeout):
            try:
                # Try template endpoint instead of health since it's part of the test
                response = requests.get(f"{cls.API_URL}/api/template/test")
                if response.status_code in [404, 200]:  # 404 is fine, means endpoint exists but template not found
                    logger.info("Application server is ready")
                    return True
            except requests.exceptions.RequestException:
                pass
        raise TimeoutError("Application server failed to start")
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> requests.Response:
        """Make HTTP request with retries
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            data: Request data/body
            headers: Request headers
            **kwargs: Additional arguments for requests
            
        Returns:
            Response object
        """
        url = f"{self.API_URL}{endpoint}"
        timeout = self.TEST_TIMEOUT / 1000  # Convert to seconds
        
        for attempt in range(self.TEST_RETRIES):
            try:
                response = requests.request(
                    method,
                    url,
                    json=data,
                    headers=headers,
                    timeout=timeout,
                    **kwargs
                )
                return response
            except requests.exceptions.RequestException as e:
                if attempt == self.TEST_RETRIES - 1:
                    raise
                logger.warning(f"Request failed (attempt {attempt + 1}/{self.TEST_RETRIES}): {e}")
    
    def verify_vulnerability(self, response: requests.Response, expected_marker: str):
        """Verify vulnerability was successfully exploited
        
        Args:
            response: Response from vulnerable endpoint
            expected_marker: Marker that should be present in response
            
        Raises:
            AssertionError: If vulnerability check fails
        """
        assert response.status_code == 200, f"Request failed with status {response.status_code}"
        assert expected_marker in response.text, "Vulnerability marker not found in response" 