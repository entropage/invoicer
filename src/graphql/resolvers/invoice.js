import { Invoice } from '../../models/Invoice';
import { User } from '../../models/User';
import { Client } from '../../models/Client';
import mongoose from 'mongoose';

export const invoiceResolvers = {
  Query: {
    invoice: async (_, { id }) => {
      // IDOR vulnerability: no authorization check
      return await Invoice.findById(id);
    },
    myInvoices: async (_, { status }, { user }) => {
      const query = { ownerId: user.id };
      if (status) query.status = status;
      return await Invoice.find(query);
    },
    sharedInvoices: async (_, __, { user }) => {
      // IDOR vulnerability: no authorization check
      return await Invoice.find({ sharedWith: user.id });
    },
    invoiceComments: async (_, { invoiceId }) => {
      // IDOR vulnerability: no authorization check
      const invoice = await Invoice.findById(invoiceId);
      return invoice?.comments || [];
    }
  },
  Mutation: {
    createInvoice: async (_, { input }, { user }) => {
      const invoice = new Invoice({
        ...input,
        ownerId: user.id,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return await invoice.save();
    },
    updateInvoice: async (_, { id, input }) => {
      // IDOR vulnerability: no ownership verification
      const updateData = {
        ...input,
        updatedAt: new Date().toISOString()
      };
      return await Invoice.findByIdAndUpdate(id, updateData, { new: true });
    },
    shareInvoice: async (_, { invoiceId, userId }) => {
      // IDOR vulnerability: no ownership verification
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      if (!invoice.sharedWith) {
        invoice.sharedWith = [userId];
      } else if (!invoice.sharedWith.includes(userId)) {
        invoice.sharedWith.push(userId);
      }
      
      invoice.updatedAt = new Date().toISOString();
      return await invoice.save();
    },
    addInvoiceComment: async (_, { invoiceId, content }, { user }) => {
      // IDOR vulnerability: no authorization check
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const comment = {
        id: new mongoose.Types.ObjectId(),
        invoiceId,
        userId: user.id,
        content,
        createdAt: new Date().toISOString()
      };
      
      if (!invoice.comments) {
        invoice.comments = [comment];
      } else {
        invoice.comments.push(comment);
      }
      
      invoice.updatedAt = new Date().toISOString();
      await invoice.save();
      return comment;
    }
  },
  Invoice: {
    owner: async (invoice) => await User.findById(invoice.ownerId),
    client: async (invoice) => await Client.findById(invoice.clientId),
    items: (invoice) => invoice.items || [],
    sharedWith: async (invoice) => {
      // IDOR vulnerability: exposes all shared users
      if (!invoice.sharedWith) return [];
      return await User.find({ _id: { $in: invoice.sharedWith } });
    },
    comments: (invoice) => invoice.comments || []
  }
}; 