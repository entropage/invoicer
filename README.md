# Purpose
Another demo test app, to test zast.ai's capabilities of discover vulnerabilities in fusion.js based web app.  

# Current Status
Actively maintained.  

# Future Plan
Maybe integrated into benchmark-nodejs, or just part of the daily benchmark test.  

# Invoicer

An open-source app to generate / share invoices and download as PDF.  

## Security Vulnerabilities (For Educational Purposes)

This application intentionally includes security vulnerabilities for educational purposes. DO NOT use this version in production.  

### 1. Insecure Direct Object References (IDOR)

The application has IDOR vulnerabilities in the invoice endpoints that allow unauthorized access:

- GET `/api/invoice/:id` - Users can view any invoice by ID without proper authorization
- PUT `/api/invoice/:id` - Users can modify any invoice by ID without ownership verification
- DELETE `/api/invoice/:id` - Users can delete any invoice by ID without ownership verification

Only the `/api/invoice/all` endpoint properly checks user ownership.  

### 2. JWT Authentication Issues

The application has several JWT-related security issues:

- Static JWT secret key hardcoded in the source code
- Weak algorithm (HS256) for token signing
- No key rotation mechanism
- Sensitive user data included in JWT payload

### 3. Command Injection

The application has command injection vulnerabilities in:

- `/api/system/ping` - Allows injection of shell commands through the ping parameter
- `/api/system/info` - Allows injection of shell commands through the info parameter

### 4. Path Traversal

The application has path traversal vulnerabilities in:

- `/api/file/read` - Allows reading files outside the intended directory
- `/api/file/template` - Allows accessing templates outside the intended directory

### 5. SQL Injection

Please refer to the `sqli` branch for SQL injection cases.  

### 6. Server-Side Request Forgery (SSRF)

The application contains SSRF vulnerabilities in:

- `/api/fetch/url` - Allows making arbitrary HTTP requests to internal resources
- `/api/preview/invoice` - Allows making requests to internal network endpoints through preview functionality

### 7. Server-Side Template Injection (SSTI)

Template injection vulnerabilities exist in:

- `/api/template/render` - Allows injection of malicious template expressions
- `/api/invoice/custom` - Custom invoice templates are vulnerable to template injection

### 8. XML External Entity (XXE)

XXE vulnerabilities are present in:

- `/api/import/xml` - XML parser accepts external entities without proper validation
- `/api/invoice/import` - Invoice import functionality is vulnerable to XXE attacks

### 9. Prototype Pollution

The application contains prototype pollution vulnerabilities in:

- `/api/settings/update` - Allows polluting JavaScript object prototypes through nested JSON properties
- `/api/template/customize` - Template customization allows manipulation of object prototypes

### 10. Insecure Deserialization

The application contains multiple insecure deserialization vulnerabilities in:

- `/api/deserialize/node-serialize` - Vulnerable to RCE through node-serialize package
- `/api/deserialize/yaml` - Allows arbitrary code execution through YAML deserialization
- `/api/deserialize/eval` - Uses eval() for deserialization allowing code execution
- `/api/deserialize/function` - Uses Function constructor allowing code execution

The vulnerabilities allow attackers to:

- Execute arbitrary JavaScript code
- Access the file system
- Make network requests
- Execute system commands

### 11. Cross-Site Scripting (XSS)

The application contains multiple XSS vulnerabilities:

#### DOM-based XSS

- URL fragment processing in the main application allows execution of arbitrary
  JavaScript through the URL hash  
- Example: `#<script>alert('dom xss')</script>` or
  `#<img src=x onerror="alert('dom xss')">`  

#### Reflected XSS

- `/api/search` endpoint reflects user input without sanitization
- Search results are inserted into the DOM using `innerHTML`
- Scripts in search results are automatically executed

#### Stored XSS

- `/api/comments` endpoint stores and displays unfiltered user input
- Both comment content and author fields are vulnerable
- Stored XSS payloads persist across sessions and affect all users
- Comments are rendered using `dangerouslySetInnerHTML`

The XSS vulnerabilities allow attackers to:

- Execute arbitrary JavaScript in users' browsers
- Steal session cookies and tokens
- Perform actions on behalf of other users
- Deface the application
- Redirect users to malicious sites

## Running the Application

### Using Pre-built Image (Recommended)

1. Run `docker-compose up -d`
2. The application will be available at http://localhost:3001

### Building from Source

1. Install Docker and Docker Compose
2. Clone the repository
3. Run `docker-compose -f docker-compose.build.yml up -d`

## Testing the Vulnerabilities

### Prerequisites

1. Python 3.12 or later
2. Node.js 18 or later

### Setup Test Environment

1. Create a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install test dependencies:
```bash
cd test
pip install -r requirements.txt
```

### Running Tests

1. Command Injection Tests:
```bash
python test_command_injection.py
```

2. Path Traversal Tests:
```bash
python test_path_traversal.py
```

3. IDOR Tests:
```bash
python test_idor.py
```

4. JWT Authentication Tests:
```bash
python test_invoicer_jwt.py
```

5. Basic Functionality Tests:
```bash
python test_invoicer.py
```

6. Login Tests:
```bash
node test_login.js
```

## Features

1. Generate invoice
2. Download in PDF
3. Share invoice with clients using shareable link
4. Print invoice
- **GraphQL Explorer**: Interactive UI to test and explore GraphQL vulnerabilities
- **REST API**: Authentication endpoints with intentional vulnerabilities
- **MongoDB Backend**: NoSQL database with flexible schema
- **JWT Authentication**: Token-based authentication system
- **Docker Support**: Easy deployment with Docker containers

## Getting Started

1. Clone the repository
2. Install dependencies: `yarn install`
3. Start MongoDB: `docker-compose up -d mongodb`
4. Start the application: `yarn start`
5. Visit http://localhost:3000
6. Login with default credentials:
   - Username: test
   - Password: test123

## Exploring Vulnerabilities

The application includes several intentional vulnerabilities for educational purposes:

### GraphQL Vulnerabilities

Navigate to `/graphql-explorer` to access the interactive UI for testing GraphQL vulnerabilities:

1. Basic User Data IDOR
2. Private Data with Circular References
3. Admin Access IDOR
4. Invoice Access IDOR
5. Mass Assignment
6. Profile Update IDOR
7. Invoice Deletion IDOR
8. Predictable IDs
9. Error Information Disclosure

See [GraphQL IDOR Documentation](docs/vulnerabilities/graphql_idor.md) for detailed information.  

### REST API Vulnerabilities

The authentication endpoints demonstrate common REST API vulnerabilities:

1. SQL Injection
2. JWT Token Tampering
3. Path Traversal
4. Command Injection

See [REST API Documentation](docs/vulnerabilities/rest_api.md) for details.  

## Limitations

1. Once an invoice is generated then there's no way to edit it, you have to create a new one in order to update any information. (we're actively working to overcome this limitation)

## Future Goals

1. Email invoice
2. Company Logo upload
3. Change Currency through Dropdown
4. Date / Number Fields support

## Tools and Technologies Used

- [Fusion.js - Uber's universal web apps framework](https://fusionjs.com/)
- [Mongo DB](https://www.mongodb.com/)
- [Puppeteer - Headless Chrome](https://github.com/GoogleChrome/puppeteer)
- [Material UI](https://material-ui.com/)
- [Formik](https://github.com/jaredpalmer/formik)
