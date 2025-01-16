# Goal
Demonstrator a vulnerability of login token leakage (a small example of sensitive info leakage)

# Context
There is no easy rule to tell what is sensitive and what is not. Because it's a multi-dimension problem:
- PII (personal identifierable information) is usually sensitive in web app context
    - only owner is supposed to read/write/admin their own PII
- User's app data is harder:
    - social network app usually is encouraging users to interact with each other as much as possible
    - financial app usually supports no interaction among users, except for transfer maybe
    - everything else is in the middle grey area, it really depends on the context
- login info is usually the most sensitive data
    - because with it, attacker can control victim's account and do whatever on his/her behave

# Enhanced Plan for Sensitive Token Leakage Demo

## Phase 1: Infrastructure Updates
1. Update User Model:
   - Add `sessionToken` field (String, required)
   - Add `lastLogin` field (Date)
   - Add migration script for existing users

2. Update Invoice Model:
   - Add `accessList` field (Array of userIds)
   - Add `sharedAt` field (Date)
   - Add migration script for existing invoices

## Phase 2: API Implementation
1. Create new endpoints:
   - GET `/api/users` - Lists all users (with sensitive token info leaked)
   - POST `/api/invoices/:id/share` - Add user to invoice access list
   - DELETE `/api/invoices/:id/share` - Remove user from access list

2. Update existing endpoints:
   - Modify GET `/api/invoices/:id` to check accessList
   - Update invoice listing to include shared invoices

## Phase 3: Frontend Changes
1. Add share button to invoice view
2. Create share modal with:
   - User search/selection
   - Current share status
   - Share/unshare actions

## Phase 4: Vulnerability Implementation
1. In GET `/api/users`:
   - Include full user object including sessionToken
   - No filtering of sensitive data
   - No pagination (to ensure all data is sent at once)

2. Frontend will only display:
   - Username
   - Role
   (But token will be in response data)

## Phase 5: Testing
1. Create test accounts
2. Verify sharing works
3. Verify token leakage:
   - Capture API response
   - Extract token
   - Use token to impersonate user


