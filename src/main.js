// @flow
// libs
import App from 'fusion-react';
import HelmetPlugin from 'fusion-plugin-react-helmet-async';
import mongoose from 'mongoose';
import Router from 'fusion-plugin-react-router';
import {createPlugin} from 'fusion-core';

// src
import {App as ClientApp} from './App';
import handlers from './handlers';
import {MONGODB_URI} from './constants';

// Create plugins
const BodyParserPlugin = createPlugin({
  middleware: () => async (ctx, next) => {
    if (ctx.request.is('application/json')) {
      let body = '';
      for await (const chunk of ctx.req) {
        body += chunk.toString();
      }
      try {
        ctx.request.body = JSON.parse(body);
      } catch (e) {
        ctx.request.body = {};
      }
    }
    return next();
  }
});

const HandlersPlugin = createPlugin({
  middleware: () => handlers
});

export default function() {
  const app = new App(ClientApp);
  app.register(Router);
  app.register(HelmetPlugin);

  if (__NODE__) {
    mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(res => {
        console.log('Mongodb Connected.');
      });

    app.register(BodyParserPlugin);
    app.register(HandlersPlugin);
  }

  return app;
}
