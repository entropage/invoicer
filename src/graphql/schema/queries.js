export default `
  type Query {
    # User queries
    me: User!
    user(id: ID!): User
    userProfile(userId: ID!): UserProfile
    searchUsers(query: String!): [User!]!

    # Invoice queries
    invoice(id: ID!): Invoice
    myInvoices(status: InvoiceStatus): [Invoice!]!
    sharedInvoices: [Invoice!]!
    invoiceComments(invoiceId: ID!): [Comment!]!

    # Client queries
    client(id: ID!): Client
    clients: [Client!]!
  }
`; 