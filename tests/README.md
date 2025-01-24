# Invoicer Vulnerability Test Suite

This directory contains vulnerability tests for the Invoicer application. The tests are designed to verify that the vulnerabilities are working as expected for educational purposes.

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

## Running Tests

The test suite can be run in several ways:

1. Run all tests:
```bash
python test_all.py
```

2. Run all tests with verbose output:
```bash
python test_all.py -v
```

3. List available test classes and their test methods:
```bash
python test_all.py --list
```

4. Run a specific test class:
```bash
python test_all.py -t PathTraversalTest
```

## Test Categories

1. **Path Traversal Tests** (`PathTraversalTest`)
   - Simple path traversal using path.join
   - String replacement bypass attempts
   - Template path traversal
   - Unicode bypass attempts

2. **SSRF Tests** (`SSRFTest`)
   - Basic SSRF via logo URL
   - Internal network scanning
   - Cloud metadata access
   - Protocol tests

3. **Command Injection Tests** (`CommandInjectionTest`)
   - Basic command injection
   - Command chaining
   - Bypass attempts

4. **IDOR Tests** (`IDORTest`)
   - Unauthorized access to invoices
   - Parameter manipulation
   - Access control bypass

5. **JWT Tests** (`JWTTest`)
   - Token manipulation
   - Algorithm switching
   - Key disclosure

## Adding New Tests

When adding new vulnerability tests:

1. Create a new test file (e.g., `test_new_vuln.py`)
2. Create a test class that inherits from `unittest.TestCase`
3. Import the test class in `test_all.py`
4. Add the test class to the `test_classes` dictionary

## Notes

- These tests are for educational purposes only
- Some tests may require additional setup (e.g., local HTTP server for SSRF tests)
- All tests are designed to run against the Docker container 