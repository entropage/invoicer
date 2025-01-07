# GraphQL API Definition

## Types

### User Type
```graphql
type User {
  id: ID!
  email: String!
  name: String
  role: String!
  preferences: UserPreferences
  profile: UserProfile
  invoices: [Invoice!]
  sharedInvoices: [Invoice!]
  createdAt: String!
  updatedAt: String!
}

type UserPreferences {
  theme: String
  language: String
  notifications: Boolean
  currency: String
}

type UserProfile {
  id: ID!
  userId: ID!
  phoneNumber: String
  address: String
  taxId: String
  companyName: String
  bankDetails: String
  sensitiveNotes: String
}
```

### Invoice Type
```graphql
type Invoice {
  id: ID!
  number: String!
  owner: User!
  client: Client!
  amount: Float!
  status: InvoiceStatus!
  items: [InvoiceItem!]!
  sharedWith: [User!]
  comments: [Comment!]
  createdAt: String!
  updatedAt: String!
}

type InvoiceItem {
  id: ID!
  description: String!
  quantity: Int!
  unitPrice: Float!
  total: Float!
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}
```

### Client Type
```graphql
type Client {
  id: ID!
  name: String!
  email: String
  address: String
  phone: String
  invoices: [Invoice!]
}
```

### Comment Type
```graphql
type Comment {
  id: ID!
  invoiceId: ID!
  userId: ID!
  user: User!
  content: String!
  createdAt: String!
}
```

## Queries

### User Queries
```graphql
type Query {
  # Get current user
  me: User!
  
  # Get user by ID (intentionally vulnerable to IDOR)
  user(id: ID!): User
  
  # Get user profile (intentionally vulnerable to IDOR)
  userProfile(userId: ID!): UserProfile
  
  # Search users (intentionally vulnerable to data exposure)
  searchUsers(query: String!): [User!]!
}
```

### Invoice Queries
```graphql
type Query {
  # Get invoice by ID (intentionally vulnerable to IDOR)
  invoice(id: ID!): Invoice
  
  # Get all invoices for current user
  myInvoices(status: InvoiceStatus): [Invoice!]!
  
  # Get shared invoices (intentionally vulnerable to IDOR)
  sharedInvoices: [Invoice!]!
  
  # Get invoice comments (intentionally vulnerable to IDOR)
  invoiceComments(invoiceId: ID!): [Comment!]!
}
```

### Client Queries
```graphql
type Query {
  # Get client by ID (intentionally vulnerable to IDOR)
  client(id: ID!): Client
  
  # Get all clients (intentionally vulnerable to data exposure)
  clients: [Client!]!
}
```

## Mutations

### User Mutations
```graphql
type Mutation {
  # Update user profile (intentionally vulnerable to IDOR)
  updateUserProfile(
    userId: ID!
    input: UpdateUserProfileInput!
  ): UserProfile!
  
  # Update user preferences (intentionally vulnerable to IDOR)
  updateUserPreferences(
    userId: ID!
    input: UpdateUserPreferencesInput!
  ): UserPreferences!
}

input UpdateUserProfileInput {
  phoneNumber: String
  address: String
  taxId: String
  companyName: String
  bankDetails: String
  sensitiveNotes: String
}

input UpdateUserPreferencesInput {
  theme: String
  language: String
  notifications: Boolean
  currency: String
}
```

### Invoice Mutations
```graphql
type Mutation {
  # Create invoice
  createInvoice(input: CreateInvoiceInput!): Invoice!
  
  # Update invoice (intentionally vulnerable to IDOR)
  updateInvoice(
    id: ID!
    input: UpdateInvoiceInput!
  ): Invoice!
  
  # Share invoice (intentionally vulnerable to IDOR)
  shareInvoice(
    invoiceId: ID!
    userId: ID!
  ): Invoice!
  
  # Add comment to invoice (intentionally vulnerable to IDOR)
  addInvoiceComment(
    invoiceId: ID!
    content: String!
  ): Comment!
}

input CreateInvoiceInput {
  clientId: ID!
  number: String!
  items: [InvoiceItemInput!]!
}

input UpdateInvoiceInput {
  number: String
  status: InvoiceStatus
  items: [InvoiceItemInput!]
}

input InvoiceItemInput {
  description: String!
  quantity: Int!
  unitPrice: Float!
}
```

## Vulnerability Notes

1. IDOR Vulnerabilities:
   - User queries accept any user ID without authorization checks
   - Profile operations don't verify requesting user
   - Invoice operations don't verify ownership
   - Comment operations don't verify access rights

2. Data Exposure:
   - Sensitive fields exposed in nested queries
   - No field-level authorization
   - Unrestricted access to related data

3. Query Depth:
   - No limits on nested queries
   - Can traverse between users through relationships
   - Can access unauthorized data through nested fields

4. Implementation Notes:
   - No rate limiting
   - No query complexity checks
   - Minimal input validation
   - No field-level authorization 