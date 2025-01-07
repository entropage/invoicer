export default `
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
`; 