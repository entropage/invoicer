export default `
  type Comment {
    id: ID!
    invoiceId: ID!
    userId: ID!
    user: User!
    content: String!
    createdAt: String!
  }
`; 