import { Client } from '../../models/Client';
import { Invoice } from '../../models/Invoice';

export const clientResolvers = {
  Query: {
    client: async (_, { id }) => {
      // IDOR vulnerability: no authorization check
      return await Client.findById(id);
    },
    clients: async () => {
      // IDOR vulnerability: returns all clients without filtering
      return await Client.find({});
    }
  },
  Client: {
    invoices: async (client) => {
      // IDOR vulnerability: no authorization check on nested queries
      return await Invoice.find({ clientId: client.id });
    }
  }
}; 