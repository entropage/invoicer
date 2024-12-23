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

### Testing the Vulnerabilities

Run the test script to demonstrate these vulnerabilities:
```bash
python test/test_idor.py
```

The test shows how user "Bob" can access, modify, and delete user "Alice's" invoices due to missing ownership checks.

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

## Project Setup

1. Install Mongo DB for your OS
2. Run `git clone <repo_url>`
3. Run `yarn install` or `npm install` in project directory
4. Run `yarn dev`

- If project ran successfully then it'll log all the routes configured in the app and status of mongo db connection.

## Tools and Technologies Used

- [Fusion.js - Uber's universal web apps framework](https://fusionjs.com/)
- [Mongo DB](https://www.mongodb.com/)
- [Puppeteer - Headless Chrome](https://github.com/GoogleChrome/puppeteer)
- [Material UI](https://material-ui.com/)
- [Formik](https://github.com/jaredpalmer/formik)
