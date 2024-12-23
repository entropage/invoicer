// @flow
// libs
import App from 'fusion-react';
import HelmetPlugin from 'fusion-plugin-react-helmet-async';
import {HttpHandlerToken, HttpHandlerPlugin} from 'fusion-plugin-http-handler';
import mongoose from 'mongoose';
import Router from 'fusion-plugin-react-router';

// src
import {App as ClientApp} from './App';
import handlers from './handlers';
import {MONGODB_URI} from './constants';
import {JWTPlugin, JWTToken} from './plugins/jwt';

export default function() {
  const app = new App(ClientApp);
  app.register(Router);
  app.register(HelmetPlugin);
  app.register(JWTToken, JWTPlugin);

  if (__NODE__) {
    mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(res => {
        console.log('Mongodb Connected.');
      });

    app.register(HttpHandlerToken, HttpHandlerPlugin);
    app.register(HttpHandlerToken.Handlers, handlers);
  }

  return app;
}
