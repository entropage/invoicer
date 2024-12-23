// @flow
// libs
import App from 'fusion-react';
import HelmetPlugin from 'fusion-plugin-react-helmet-async';
import mongoose from 'mongoose';
import Router from 'fusion-plugin-react-router';

// src
import {App as ClientApp} from './App';
import handlers from './handlers';
import {MONGODB_URI} from './constants';

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

    app.middleware((ctx, next) => {
      if (ctx.request.is('application/json')) {
        return new Promise((resolve) => {
          let body = '';
          ctx.req.on('data', chunk => {
            body += chunk.toString();
          });
          ctx.req.on('end', () => {
            try {
              ctx.request.body = JSON.parse(body);
            } catch (e) {
              ctx.request.body = {};
            }
            resolve(next());
          });
        });
      }
      return next();
    }, 1);

    app.middleware(handlers);
  }

  return app;
}
