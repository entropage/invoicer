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

Please refer to the `pan/sqli` branch for SQL injection cases.

## Running the Application

### Using Pre-built Image (Recommended)

1. Install Docker and Docker Compose
2. Create a `docker-compose.yml` file with:
```yaml
version: '3'
services:
  invoicer:
    image: 339713064450.dkr.ecr.us-west-2.amazonaws.com/entropage/invoicer:0.3
    ports:
      - "3001:3001"
      - "9229:9229"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DEBUG=*
      - MONGODB_URI=mongodb://mongodb:27017/invoicer
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```
3. Run `docker-compose up -d`
4. The application will be available at http://localhost:3001

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
