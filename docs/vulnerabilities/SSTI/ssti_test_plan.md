# SSTI Vulnerability Test Plan

## Overview
This test plan outlines the approach for testing Server-Side Template Injection (SSTI) vulnerabilities in the application.

## Test Environment Setup
- Test server running on `0.0.0.0:8889` for network access tests
- Application server running on `localhost:3001`
- Environment variables loaded from `.env`
- Logging configured to show detailed test output

## Test Cases

### 1. Template Endpoint Verification (test_01_template_endpoints_exist)
- **Objective**: Verify all required template endpoints exist and function
- **Test Steps**:
  - Create a new template
  - Verify template ID is returned
  - Retrieve template by ID
  - Test template rendering endpoint
- **Expected Results**: All endpoints return 200 status code

### 2. Basic Template Rendering (test_02_basic_template_rendering)
- **Objective**: Verify basic template variable substitution
- **Test Steps**:
  - Render template with simple variable substitution
  - Template: `Hello ${name}!`
- **Expected Results**: Variables correctly substituted in output

### 3. Command Execution (test_03_code_execution)
- **Objective**: Demonstrate arbitrary command execution
- **Test Steps**:
  - Execute `echo` command with unique marker
  - Execute `id` command to show user context
  - Access process PID
- **Expected Results**: 
  - Commands execute successfully
  - Output contains command results
  - User context information visible
  - Process information accessible

### 4. File System Access (test_04_file_system_access)
- **Objective**: Demonstrate file system read access
- **Test Steps**:
  - Read `/etc/passwd` file
- **Expected Results**: 
  - File contents successfully retrieved
  - Output contains sensitive system information
  - Root user entry visible

### 5. Network Access (test_05_network_access) [Currently Disabled]
- **Objective**: Demonstrate network request capabilities
- **Test Steps**:
  - Make HTTP request to test server
  - Verify response contains test marker
- **Expected Results**: Successfully makes network requests

### 6. Sensitive Data Access (test_06_sensitive_data_access)
- **Objective**: Access sensitive application data
- **Test Steps**:
  - Read process environment variables
  - Format output as pretty JSON
- **Expected Results**:
  - Environment variables accessible
  - Contains standard variables (PATH, HOME)
  - Output properly formatted

## Test Execution

### Running Tests
```bash
# Run all SSTI tests
./devops/test.sh ssti

# Run specific test case
./devops/test.sh ssti -k "test_03_code_execution"
./devops/test.sh ssti -k "test_04_file_system_access"
./devops/test.sh ssti -k "test_06_sensitive_data_access"
```

### Test Output
- Detailed logging with timestamps
- Template contents shown before execution
- Command/operation results displayed
- Clear separation between test cases with dividers

## Success Criteria
1. All test cases pass successfully
2. Command execution results clearly visible in logs
3. File system access demonstrates vulnerability
4. Environment variables accessible and readable
5. Network requests functional (when enabled)

## Notes
- Network access test currently disabled but framework in place
- Test server automatically started/stopped for each test run
- Retries implemented for network operations
- Proper cleanup in teardown 