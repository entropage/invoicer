# Sensitive Data Leakage Demo

This demo showcases a common security vulnerability where an authenticated API
endpoint accidentally leaks sensitive user data.

## Vulnerability Overview

The vulnerability exists in the `/api/users` endpoint which, while properly
authenticated, leaks sensitive user data including password hashes. This is a
common security mistake where developers focus on authentication but forget
about proper data filtering.

## Key Components

1. Vulnerable API Endpoint (`/api/users`):

   - Requires authentication (JWT token)
   - Returns complete user objects including password hashes
   - No filtering of sensitive data
   - No pagination (returns all users)

2. Invoice Sharing Feature:
   - Used to demonstrate legitimate user data access
   - Provides context for why a user listing endpoint might exist

## How to Test

1. Create multiple test users:

   ```bash
   # Register first user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username": "user1", "password": "password1"}'

   # Register second user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username": "user2", "password": "password2"}'
   ```

2. Login as first user:

   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "user1", "password": "password1"}'
   ```

3. Use the returned JWT token to access the vulnerable endpoint:

   ```bash
   curl http://localhost:3000/api/users \
     -H "Authorization: Bearer <your-jwt-token>"
   ```

4. Observe the response includes sensitive data:
   ```json
   [
     {
       "_id": "...",
       "username": "user1",
       "password": "cGFzc3dvcmQx", // Base64 encoded password!
       "role": "user",
       "createdAt": "..."
     },
     {
       "_id": "...",
       "username": "user2",
       "password": "cGFzc3dvcmQy", // Base64 encoded password!
       "role": "user",
       "createdAt": "..."
     }
   ]
   ```

5. Decode the password and login as another user:
   ```bash
   # Decode the password using base64
   echo "cGFzc3dvcmQy" | base64 -d
   # Output: password2

   # Login as user2 using the decoded password
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "user2", "password": "password2"}'
   ```

## Using the Web Frontend

1. Open your browser and navigate to `http://localhost:3000`

2. Create two test accounts:

   - Click "Register" in the top navigation bar
   - Create first account with username "user1" and password "password1"
   - Logout and create second account with username "user2" and password
     "password2"

3. Test the vulnerability:
   - Login as user1
   - Navigate to "Create Invoice" page
   - Create a new invoice
   - Click the "Share" button on the invoice
   - In the user selection dropdown, you'll notice all user data is loaded
   - Open your browser's developer tools (F12)
   - Go to the Network tab
   - Find the `/api/users` request
   - Examine the response to see exposed sensitive data
   - Copy the base64 encoded password
   - Decode it using browser console: `atob('cGFzc3dvcmQy')`
   - Use the decoded password to login as that user

## Security Impact

1. Password Exposure:
   - Passwords are stored using base64 encoding (not hashing)
   - Base64 encoded passwords can be trivially decoded
   - No need for password cracking - direct impersonation possible
   - Compromised accounts can be used to access private data

2. User Enumeration:
   - Complete list of users is exposed
   - User roles and creation times leaked
   - Can be used for targeted attacks

## Proper Implementation

The endpoint should:

1. Filter sensitive fields before sending response:

   ```javascript
   const users = await User.find({})
     .select("username role createdAt") // Only select safe fields
     .lean();
   ```

2. Implement pagination to limit data exposure:

   ```javascript
   const users = await User.find({})
     .select("username role")
     .skip(page * limit)
     .limit(limit)
     .lean();
   ```

3. Consider implementing field-level access control based on user roles

## Related Vulnerabilities

- IDOR (Insecure Direct Object References)
- Mass Assignment
- Excessive Data Exposure
- Missing Function Level Access Control

## References

- [OWASP API Security Top 10 - Excessive Data Exposure](https://owasp.org/www-project-api-security/)
- [CWE-359: Exposure of Private Personal Information](https://cwe.mitre.org/data/definitions/359.html)
