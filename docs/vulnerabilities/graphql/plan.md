# Goal
Adding some features and expose some APIs via GraphQL.

# Context
https://chatgpt.com/share/677ca0c6-2754-8000-803f-e71eec366944
try to add some IDOR vulnerabilities according to this conversation, especially the nested query.

Note: We'll use the existing simple authentication system instead of an external IDP to maintain control over security and ensure our IDOR vulnerabilities can be properly demonstrated. This aligns with the educational nature of the project.

# Plan

## 1. Add some features
1. User profile management
   - Add user profile data model with sensitive information
   - Implement profile update functionality
   - Store user preferences and settings

2. Invoice sharing functionality
   - Allow users to share invoices with other users
   - Add collaboration features on shared invoices
   - Implement invoice comments system

## 2. Expose some APIs via GraphQL
1. Setup GraphQL infrastructure
   - Install required dependencies
   - Configure GraphQL middleware in Fusion.js
   - Setup basic schema structure

2. Create GraphQL types
   - User type with profile information
   - Invoice type with nested relationships
   - Comments type for invoice discussions

3. Implement GraphQL queries
   - Query for user profiles
   - Query for invoices with nested user data
   - Query for comments with user details

4. Add GraphQL mutations
   - Profile update mutation
   - Invoice sharing mutation
   - Comment creation mutation

## 3. Ensure some IDOR vulnerabilities can be exploited via step #2
1. Implement vulnerable queries
   - User profile query without proper authorization checks
   - Invoice query that allows access to any invoice by ID
   - Comment query that exposes all comments regardless of ownership

2. Create nested query vulnerabilities
   - Allow unrestricted access to nested user data in invoice queries
   - Expose sensitive user information in comment queries
   - Enable traversal between different user's data through relationships

3. Test cases for vulnerabilities
   - Document exploitation methods
   - Create proof of concept queries
   - Verify unauthorized access is possible

## 4. Testing and Documentation
1. Write test cases
   - Unit tests for new features
   - Integration tests for GraphQL endpoints
   - Specific tests for vulnerability verification

2. Documentation
   - API documentation for legitimate use
   - Internal documentation of vulnerabilities
   - Usage examples and queries

## 5. Deployment and Verification
1. Deploy changes
   - Update build scripts
   - Configure GraphQL playground
   - Set up monitoring

2. Final verification
   - Test all features in staging
   - Verify vulnerabilities are exploitable
   - Document any additional findings
