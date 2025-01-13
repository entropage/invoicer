# GraphQL IDOR Vulnerabilities

This document describes the intentionally vulnerable GraphQL endpoints  
implemented for educational purposes in the Invoicer application.  

## Overview

Insecure Direct Object References (IDOR) in GraphQL APIs occur when an  
application fails to properly validate access permissions before performing  
operations on objects. Our implementation includes various IDOR  
vulnerabilities  
commonly found in GraphQL applications.  

## Vulnerabilities and Test Cases

### 1. Basic User Data IDOR

**Vulnerability**: Allows fetching any user's data without authorization.  

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    username
    role
    createdAt
  }
}
```

**Impact**: Any authenticated user can access another user's data, including  
sensitive role information.  

### 2. Private Data IDOR with Circular References

**Vulnerability**: Exposes private user information through nested circular  
references.  

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    privateData {
      bankAccount
      taxId
      user {
        privateData {
          bankAccount
          user {
            # Can be nested up to 10 levels deep
          }
        }
      }
    }
  }
}
```

**Impact**:

- Exposes sensitive financial data
- Allows deep nesting that could impact server performance
- Creates circular references that could be exploited

### 3. Admin Access IDOR

**Vulnerability**: No role-based access control for admin features.  

```graphql
query {
  allUsers {
    id
    username
    role
  }
}
```

**Impact**: Regular users can access admin-only functionality.  

### 4. Invoice Access IDOR

**Vulnerability**: No ownership validation for invoice access.  

```graphql
query {
  invoice(id: "any-invoice-id") {
    invoiceId
    items {
      description
      quantity
      unitPrice
    }
  }
}
```

**Impact**: Users can access any invoice in the system.  

### 5. Mass Assignment IDOR

**Vulnerability**: Allows arbitrary MongoDB queries through filter parameter.  

```graphql
query {
  searchInvoices(filter: "{\"$where\": \"return true\"}") {
    invoiceId
    amountPaid
  }
}
```

**Impact**: Potential NoSQL injection through unvalidated filters.  

### 6. Profile Update IDOR

**Vulnerability**: No ownership validation before profile updates.  

```graphql
mutation {
  updateUserProfile(userId: "any-user-id", newUsername: "hacked") {
    username
  }
}
```

**Impact**: Users can modify other users' profiles.  

### 7. Invoice Deletion IDOR

**Vulnerability**: No ownership check before deletion.  

```graphql
mutation {
  deleteInvoice(invoiceId: "any-invoice-id")
}
```

**Impact**: Unauthorized deletion of any invoice.  

### 8. Predictable IDs IDOR

**Vulnerability**: Uses predictable ID patterns for sensitive data.  

```graphql
mutation {
  createPrivateUserData(userId: "user-1", data: "test@example.com") {
    id # Returns in format: PRIVATE-{userId}
  }
}
```

**Impact**: Predictable IDs make it easier to enumerate and access private data.  

## Additional Security Issues

### 9. Error Information Disclosure

**Vulnerability**: Returns detailed error messages including stack traces and  
database internals.  

```graphql
query {
  user(id: "invalid-id") {
    username
  }
}
```

**Example Response**:

```json
{
  "errors": [
    {
      "message": "CastError: Cast to ObjectId failed...",
      "extensions": {
        "stacktrace": ["at model.Document.get...", "at MongoDB.findById..."]
      }
    }
  ]
}
```

**Impact**: Reveals implementation details that could aid attackers.  

### 10. Query Depth Attack

**Vulnerability**: Allows deeply nested queries (up to 10 levels) that could  
cause performance issues.  

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    privateData {
      user {
        privateData {
          user {
            # Can be nested multiple times
          }
        }
      }
    }
  }
}
```

**Impact**:

- Potential DoS through resource exhaustion
- Memory consumption through deep nesting
- CPU consumption through circular references

## Security Notes

These vulnerabilities are intentionally implemented for educational purposes  
in a production environment, you should:

1. Implement proper authorization checks
2. Validate object ownership
3. Use role-based access control
4. Implement query depth limiting
5. Add rate limiting
6. Sanitize error messages
7. Use non-predictable IDs
8. Validate input thoroughly
9. Prevent circular references

## Testing

Run the test suite to verify all vulnerabilities are working as expected:

```bash
pytest test_graphql_idor.py -v
```

All tests should pass, demonstrating each vulnerability is properly  
implemented  
for educational purposes.  

## Exploring Vulnerabilities

The application includes a dedicated GraphQL Explorer page that provides an  
interactive interface to test all vulnerabilities:

### Using the GraphQL Explorer UI

1. Login with default credentials (username: test, password: test123)
2. Navigate to `/graphql-explorer`
3. Use the interactive UI to test each vulnerability:

Each vulnerability has its own section with:

- Dedicated inputs and controls
- Real-time results display
- Error messages and stack traces when applicable
- Clear examples of how to exploit the vulnerability

### Available Vulnerability Tests

1. **Basic User Data IDOR**

   - Input any user ID to access their data
   - View username, role, and creation date
   - No authorization checks are performed

2. **Private Data with Circular References**

   - Configure nesting depth (up to 10 levels)
   - View sensitive financial data
   - Observe circular reference exploitation

3. **Admin Access**

   - View all users in the system
   - Access admin-only functionality
   - No role-based access control

4. **Invoice Access**

   - Access any invoice by ID
   - View detailed invoice information
   - No ownership validation

5. **Mass Assignment**

   - Execute arbitrary MongoDB queries
   - Test different filter patterns
   - Explore NoSQL injection possibilities

6. **Profile Update**

   - Modify any user's profile
   - No ownership validation
   - Test unauthorized modifications

7. **Invoice Deletion**

   - Delete any invoice by ID
   - No ownership checks
   - Test unauthorized deletions

8. **Predictable IDs**

   - Create private data with predictable IDs
   - Observe ID patterns
   - Test enumeration possibilities

9. **Error Information Disclosure**
   - View detailed error messages
   - Observe stack traces
   - Access internal implementation details

### Tips for Testing

1. Use browser dev tools to:

   - Monitor GraphQL requests in Network tab
   - Observe query variables and responses
   - Study error messages and stack traces

2. Try different input patterns:

   - Invalid IDs to trigger errors
   - Deep nesting to test performance
   - Various MongoDB query operators

3. Observe security implications:
   - Data exposure through IDOR
   - Authorization bypass methods
   - Information disclosure vectors

Remember: These vulnerabilities are intentionally implemented for educational  
purposes. In a production environment, proper authorization checks and data  
access controls should be implemented.  
