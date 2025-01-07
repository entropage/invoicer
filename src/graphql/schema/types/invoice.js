export default `
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
`; 