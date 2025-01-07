import {GraphQLSchema} from 'graphql';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {merge} from 'lodash';

// Import types
import userType from './schema/types/user';
import invoiceType from './schema/types/invoice';
import clientType from './schema/types/client';
import commentType from './schema/types/comment';
import queries from './schema/queries';
import mutations from './schema/mutations';

// Import resolvers
import {userResolvers} from './resolvers/user';
import {invoiceResolvers} from './resolvers/invoice';
import {clientResolvers} from './resolvers/client';

const typeDefs = `
  ${userType}
  ${invoiceType}
  ${clientType}
  ${commentType}
  ${queries}
  ${mutations}
`;

const resolvers = merge(
  userResolvers,
  invoiceResolvers,
  clientResolvers
);

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
}); 