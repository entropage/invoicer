export default `
  type Client {
    id: ID!
    name: String!
    email: String
    address: String
    phone: String
    invoices: [Invoice!]
  }
`; 