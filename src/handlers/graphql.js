// @flow
import { createPlugin } from 'fusion-core';
import { ApolloServer } from '@apollo/server';
import { koaMiddleware } from '@as-integrations/koa';
import { buildSchema } from 'graphql';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/user';
import { InvoiceModel } from '../models/Invoice';
import { PersonModel } from '../models/Person';

// GraphQL Schema with intentionally vulnerable queries and mutations
const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
    role: String!
    createdAt: String!
    # Vulnerable: Allows infinite nesting
    privateData: PrivateUserData
  }

  input RegisterInput {
    username: String!
    password: String!
    role: String
  }

  type Person {
    id: ID!
    name: String!
    address: String
    city: String
    phone: String
    email: String
  }

  type InvoiceItem {
    description: String!
    quantity: Float!
    unitPrice: Float!
  }

  input InvoiceItemInput {
    description: String!
    quantity: Float!
    unitPrice: Float!
  }

  type Invoice {
    id: ID!
    invoiceId: String!
    issueDate: String!
    dueDate: String!
    items: [InvoiceItem!]!
    client: Person!
    seller: Person!
    userId: String!
    amountPaid: Float!
  }

  input InvoiceInput {
    issueDate: String!
    dueDate: String!
    items: [InvoiceItemInput!]!
  }

  type PrivateUserData {
    id: ID!
    username: String!
    email: String!
    phone: String
    address: String
    bankAccount: String
    taxId: String
    # Vulnerable: Creates circular reference
    user: User
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # IDOR Vulnerability 1: No authorization check
    user(id: ID!): User

    # IDOR Vulnerability 2: No ownership validation
    userPrivateData(userId: ID!): PrivateUserData

    # IDOR Vulnerability 3: No access control
    allUsers: [User!]!

    # IDOR Vulnerability 4: No validation
    invoice(id: ID!): Invoice

    # IDOR Vulnerability 5: Mass assignment
    searchInvoices(filter: String): [Invoice!]!
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthPayload
    login(username: String!, password: String!): AuthPayload

    # IDOR Vulnerability 6: No validation
    updateUserProfile(userId: ID!, newUsername: String!): User

    # IDOR Vulnerability 7: No validation
    deleteInvoice(invoiceId: ID!): Boolean

    # IDOR Vulnerability 8: Predictable IDs
    createPrivateUserData(userId: ID!, data: String!): PrivateUserData

    # Invoice creation
    createInvoice(input: InvoiceInput!): Invoice
  }
`);

// JWT configuration (intentionally vulnerable)
const JWT_SECRET = 'your-jwt-secret-key-2024';
const JWT_OPTIONS = {
    algorithm: 'HS256',
    expiresIn: '24h',
};

// Vulnerable resolvers
const root = {
    // Auth resolvers
    register: async ({ input }) => {
        const { username, password, role = 'user' } = input;

        try {
            // VULNERABILITY: Using base64 encoding instead of proper password hashing
            const encodedPassword = Buffer.from(password).toString('base64');

            const user = new User({
                username,
                password: encodedPassword,
                role
            });

            await user.save();

            const token = jwt.sign(
                { id: user._id, username: user.username, role: user.role },
                JWT_SECRET,
                JWT_OPTIONS
            );

            return {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    createdAt: user.createdAt
                }
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    login: async ({ username, password }) => {
        const user = await User.findOne({ username });
        if (!user) throw new Error('User not found');

        // VULNERABILITY: Compare base64 encoded passwords
        const encodedPassword = Buffer.from(password).toString('base64');
        const valid = encodedPassword === user.password;
        if (!valid) throw new Error('Invalid password');

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            JWT_OPTIONS
        );

        return {
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt
            }
        };
    },

    // Vulnerability 1: No authorization check
    user: async ({ id }) => {
        try {
            // Vulnerable: Directly fetches user without checking authorization
            const user = await User.findById(mongoose.Types.ObjectId(id));
            if (!user) {
                // Vulnerable: Expose detailed error message
                throw new Error(`User not found with id: ${id}. The ID format appears to be invalid or the user may have been deleted.`);
            }

            // Create a function to generate private data with circular reference
            const createPrivateData = (user, depth = 0) => {
                const privateData = {
                    id: `PRIVATE-${user._id}`,
                    username: user.username,
                    email: 'private@example.com',
                    phone: '+1234567890',
                    address: '123 Private St',
                    bankAccount: 'BANK-1234-5678',
                    taxId: 'TAX-ID-12345'
                };

                // Add circular reference up to a reasonable depth to avoid stack overflow
                if (depth < 10) {
                    privateData.user = {
                        id: user._id,
                        username: user.username,
                        role: user.role,
                        createdAt: user.createdAt,
                        privateData: createPrivateData(user, depth + 1)
                    };
                }

                return privateData;
            };

            // Vulnerable: Returns user data without authorization check and allows deep nesting
            return {
                id: user._id,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt,
                privateData: createPrivateData(user)
            };
        } catch (error) {
            // Vulnerable: Expose internal error details to clients
            console.error(`Error fetching user with id ${id}:`, error);
            // Ensure we expose MongoDB-specific error details
            if (error.name === 'Error' && error.message.includes('must be a single String')) {
                throw new Error(`CastError: Cast to ObjectId failed for value "${id}" at "user" because the value is not a valid ObjectId. Stack trace: ${error.stack}`);
            }
            throw new Error(`Database operation failed: ${error.message}. Stack trace: ${error.stack}`);
        }
    },

    // Vulnerability 2: No ownership validation
    userPrivateData: async ({ userId }) => {
        try {
            // Vulnerable: Returns sensitive data without verifying requester's identity
            let user;

            // Handle both direct IDs and predictable pattern IDs
            if (userId.startsWith('PRIVATE-')) {
                const actualUserId = userId.replace('PRIVATE-', '');
                user = await User.findById(mongoose.Types.ObjectId(actualUserId));
            } else {
                user = await User.findById(mongoose.Types.ObjectId(userId));
            }

            if (!user) {
                throw new Error('User not found');
            }

            // Vulnerable: Returns sensitive data
            return {
                id: `PRIVATE-${user._id}`,
                username: user.username,
                email: 'private@example.com',
                phone: '+1234567890',
                address: '123 Private St',
                bankAccount: 'BANK-1234-5678',
                taxId: 'TAX-ID-12345'
            };
        } catch (error) {
            console.error('Error in userPrivateData resolver:', error);
            throw new Error(`Failed to fetch private data: ${error.message}`);
        }
    },

    // Vulnerability 3: No access control
    allUsers: async () => {
        // Vulnerable: Returns all users without checking admin status
        return await User.find({});
    },

    // Vulnerability 4: No invoice ownership validation
    invoice: async ({ id }) => {
        // Vulnerable: Returns invoice without checking if user owns it
        return await InvoiceModel.findById(id)
            .populate('client')
            .populate('seller');
    },

    // Vulnerability 5: Unsafe filtering
    searchInvoices: async ({ filter }) => {
        // Vulnerable: Allows arbitrary MongoDB queries through filter
        const query = filter ? JSON.parse(filter) : {};
        return await InvoiceModel.find(query)
            .populate('client')
            .populate('seller');
    },

    // Vulnerability 6: No ownership validation before update
    updateUserProfile: async ({ userId, newUsername }) => {
        try {
            // Vulnerable: Updates user without verifying requester's identity
            const existingUser = await User.findById(mongoose.Types.ObjectId(userId));
            if (!existingUser) {
                throw new Error('User not found');
            }

            // Update the user
            existingUser.username = newUsername;
            await existingUser.save();

            return {
                id: existingUser._id,
                username: existingUser.username,
                role: existingUser.role,
                createdAt: existingUser.createdAt
            };
        } catch (error) {
            console.error('Update error:', error);
            // Intentionally expose error details for the vulnerability
            throw new Error(`Failed to update user: ${error.message}`);
        }
    },

    // Vulnerability 7: No validation before deletion
    deleteInvoice: async ({ invoiceId }) => {
        // Vulnerable: Deletes invoice without checking ownership
        await InvoiceModel.findByIdAndDelete(invoiceId);
        return true;
    },

    // Vulnerability 8: Predictable IDs
    createPrivateUserData: async ({ userId, data }) => {
        // Vulnerable: Creates data with predictable ID pattern
        const user = await User.findById(userId);
        return {
            id: `PRIVATE-${userId}`,
            username: user.username,
            email: data,
            phone: '+1234567890',
            address: '123 Private St',
            bankAccount: 'BANK-1234-5678',
            taxId: 'TAX-ID-12345'
        };
    },

    // Invoice creation
    createInvoice: async ({ input }, context) => {
        const { issueDate, dueDate, items } = input;

        // Create dummy client and seller
        const client = await PersonModel.create({
            name: "Test Client",
            email: "client@test.com"
        });

        const seller = await PersonModel.create({
            name: "Test Seller",
            email: "seller@test.com"
        });

        const invoice = await InvoiceModel.create({
            invoiceId: `INV-${Date.now()}`,
            issueDate,
            dueDate,
            items,
            client: client._id,
            seller: seller._id,
            userId: context?.user?.id || 'anonymous',
            amountPaid: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        });

        return await invoice.populate('client').populate('seller').execPopulate();
    }
};

// Create and export the plugin
export default createPlugin({
    middleware: () => {
        // Create Apollo Server
        const server = new ApolloServer({
            schema,
            rootValue: root,
            includeStacktraceInErrorResponses: true, // Intentionally vulnerable
        });

        // Start the server
        let serverStarted = false;
        const startServer = async () => {
            if (!serverStarted) {
                await server.start();
                serverStarted = true;
            }
        };

        // Return the middleware function
        return async (ctx, next) => {
            if (ctx.path === '/graphql') {
                // Ensure server is started
                await startServer();

                // Create context for each request
                const contextValue = {
                    ctx,
                    user: null
                };

                try {
                    // Get token from header
                    const token = ctx.headers.authorization?.replace('Bearer ', '');
                    if (token) {
                        // Verify token
                        const decoded = jwt.verify(token, JWT_SECRET);
                        const user = await User.findById(decoded.id);
                        if (user) {
                            contextValue.user = user;
                        }
                    }
                } catch (error) {
                    console.error('Auth error:', error);
                }

                // Use the Koa middleware from @as-integrations/koa
                return koaMiddleware(server, {
                    context: async () => contextValue
                })(ctx, next);
            }
            return next();
        };
    }
});
