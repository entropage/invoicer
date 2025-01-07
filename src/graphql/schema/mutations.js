export default `
  type Mutation {
    # User mutations
    updateUserProfile(userId: ID!, input: UpdateUserProfileInput!): UserProfile!
    updateUserPreferences(userId: ID!, input: UpdateUserPreferencesInput!): UserPreferences!

    # Invoice mutations
    createInvoice(input: CreateInvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: UpdateInvoiceInput!): Invoice!
    shareInvoice(invoiceId: ID!, userId: ID!): Invoice!
    addInvoiceComment(invoiceId: ID!, content: String!): Comment!
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
`; 