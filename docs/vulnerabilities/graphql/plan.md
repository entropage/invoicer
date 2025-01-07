# Goal
Adding some features and expose some APIs via GraphQL.

# Context
https://chatgpt.com/share/677ca0c6-2754-8000-803f-e71eec366944
try to add some IDOR vulnerabilities according to this conversation, especially the nested query.

Note: We'll use the existing simple authentication system instead of an external IDP to maintain control over security and ensure our IDOR vulnerabilities can be properly demonstrated. This aligns with the educational nature of the project.

# Progress
- ✅ Defined GraphQL API schema and types
- ✅ Documented vulnerable endpoints and IDOR opportunities
- ✅ Set up basic GraphQL infrastructure
- ✅ Created schema files and type definitions
- ✅ Implemented User resolvers with IDOR vulnerabilities
- ✅ Implemented Invoice resolvers with IDOR vulnerabilities
- ✅ Implemented Client resolvers with IDOR vulnerabilities
- ⏳ Testing and Documentation

# Implemented Vulnerabilities

## 1. User Related IDOR
- Direct access to any user profile via ID
- Unrestricted user search exposing sensitive data
- Profile/preferences updates without ownership verification
- Nested query exposure of invoices and shared invoices

## 2. Invoice Related IDOR
- Direct access to any invoice via ID
- No ownership verification for updates
- Unrestricted sharing capabilities
- Exposed comments and shared users
- Nested query vulnerabilities in relationships

## 3. Client Related IDOR
- Access to all clients without authorization
- Unrestricted access to client invoices
- No filtering of sensitive client data

# Next Steps

## 1. Testing
- Create test cases for each vulnerability
- Verify nested query vulnerabilities
- Test data exposure scenarios

## 2. Documentation
- Document exploitation methods
- Create example queries
- Add security notes

## 3. Final Steps
- Deploy changes
- Verify in staging
- Final vulnerability verification

