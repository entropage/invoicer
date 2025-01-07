import { User } from '../../models/User';
import { Invoice } from '../../models/Invoice';
import mongoose from 'mongoose';

export const userResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      // Intentionally no auth check for demo purposes
      return user;
    },
    user: async (_, { id }) => {
      // IDOR vulnerability: no authorization check
      return await User.findById(id);
    },
    userProfile: async (_, { userId }) => {
      // IDOR vulnerability: no authorization check
      const user = await User.findById(userId);
      return user?.profile;
    },
    searchUsers: async (_, { query }) => {
      // Data exposure vulnerability: no filtering of sensitive data
      return await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      });
    }
  },
  Mutation: {
    updateUserProfile: async (_, { userId, input }) => {
      // IDOR vulnerability: no ownership verification
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      if (!user.profile) {
        user.profile = {
          id: new mongoose.Types.ObjectId(),
          userId: user.id,
          ...input
        };
      } else {
        user.profile = { ...user.profile, ...input };
      }
      
      await user.save();
      return user.profile;
    },
    updateUserPreferences: async (_, { userId, input }) => {
      // IDOR vulnerability: no ownership verification
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      if (!user.preferences) {
        user.preferences = input;
      } else {
        user.preferences = { ...user.preferences, ...input };
      }
      
      await user.save();
      return user.preferences;
    }
  },
  User: {
    // Field resolvers for User type
    profile: (user) => user.profile,
    preferences: (user) => user.preferences,
    invoices: async (user) => {
      // IDOR vulnerability: no authorization check on nested queries
      return await Invoice.find({ ownerId: user.id });
    },
    sharedInvoices: async (user) => {
      // IDOR vulnerability: no authorization check on nested queries
      return await Invoice.find({ sharedWith: user.id });
    }
  }
}; 