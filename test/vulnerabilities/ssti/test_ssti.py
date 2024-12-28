import pytest
import uuid
from utils.test_base import VulnerabilityTest
from .payloads import SSTI_PAYLOADS

class TestSSTI(VulnerabilityTest):
    """Test cases for Server-Side Template Injection vulnerability"""

    def test_01_template_endpoints_exist(self):
        """Verify template endpoints are accessible"""
        # Test template creation
        response = self._make_request('POST', '/template', data={'template': 'test'})
        assert response.status_code == 200
        template_id = response.json().get('id')
        assert template_id is not None

        # Test template rendering
        response = self._make_request('GET', f'/template/{template_id}')
        assert response.status_code == 200

    def test_02_basic_template_rendering(self):
        """Verify basic template rendering works"""
        template = '${(() => "test")()}'
        response = self._make_request('POST', '/template', data={'template': template})
        template_id = response.json()['id']
        
        response = self._make_request('GET', f'/template/{template_id}')
        self.verify_vulnerability(response, "test")

    def test_03_code_execution(self):
        """Verify command execution via SSTI"""
        marker = str(uuid.uuid4())
        template = SSTI_PAYLOADS['command_execution'].format(marker=marker)
        
        response = self._make_request('POST', '/template', data={'template': template})
        template_id = response.json()['id']
        
        response = self._make_request('GET', f'/template/{template_id}')
        self.verify_vulnerability(response, marker)

    def test_04_file_system_access(self):
        """Verify file system access via SSTI"""
        template = SSTI_PAYLOADS['file_read'].format(file='/etc/passwd')
        
        response = self._make_request('POST', '/template', data={'template': template})
        template_id = response.json()['id']
        
        response = self._make_request('GET', f'/template/{template_id}')
        self.verify_vulnerability(response, 'root:')

    def test_05_process_info_access(self):
        """Verify process information access via SSTI"""
        template = SSTI_PAYLOADS['process_info']
        
        response = self._make_request('POST', '/template', data={'template': template})
        template_id = response.json()['id']
        
        response = self._make_request('GET', f'/template/{template_id}')
        self.verify_vulnerability(response, 'process.env') 