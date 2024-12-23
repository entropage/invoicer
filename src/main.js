// @flow
// libs
import App from 'fusion-react';
import HelmetPlugin from 'fusion-plugin-react-helmet-async';
import mongoose from 'mongoose';
import Router from 'fusion-plugin-react-router';
import {createPlugin} from 'fusion-core';
import bodyParser from 'koa-bodyparser';

// src
import {App as ClientApp} from './App';
import handlers from './handlers';
import {MONGODB_URI} from './constants';

// Create plugins
const BodyParserPlugin = createPlugin({
  middleware: () => bodyParser()
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
