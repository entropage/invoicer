import {createPlugin} from 'fusion-core';
import {graphqlHTTP} from 'koa-graphql';
import {schema} from '../graphql';

export default createPlugin({
  middleware: () => {
    const middleware = graphqlHTTP({
      schema,
      graphiql: true, // Enable GraphiQL interface for testing
    });

    return async (ctx, next) => {
      if (ctx.path === '/graphql') {
        await middleware(ctx, next);
      } else {
        return next();
      }
    };
  },
}); 