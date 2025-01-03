// @flow

// libs
import App from 'fusion-react';
import HelmetPlugin from 'fusion-plugin-react-helmet-async';
import mongoose from 'mongoose';
import Router from 'fusion-plugin-react-router';
import { createPlugin } from 'fusion-core';
import bodyParser from 'koa-bodyparser';
import bcrypt from 'bcryptjs';
import UniversalEvents, { UniversalEventsToken } from 'fusion-plugin-universal-events';
import { FetchToken } from 'fusion-tokens';

// src
import { App as root } from './App';
import handlers from './handlers';
import { MONGODB_URI } from './constants';
import { User } from './models/user';
import TemplatePlugin from './plugins/template';
import XMLParserPlugin from './plugins/xml-parser';
import InvoicePlugin from './handlers/invoice';
import DeserializePlugin from './handlers/deserialize';

// Create plugins
const BodyParserPlugin = createPlugin({
  middleware: () => __NODE__ && bodyParser(),
});

const HandlersPlugin = createPlugin({
  middleware: () => handlers,
});

// Create default user
async function createDefaultUser() {
  try {
    const username = 'test';
    const password = 'test123';

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Default user already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
    });

    await user.save();
    console.log('Default user created successfully');
  } catch (error) {
    console.error('Error creating default user:', error);
  }
}

export default function() {
  const app = new App(root);
  app.register(Router);
  app.register(HelmetPlugin);
  app.register(UniversalEventsToken, UniversalEvents);
  __BROWSER__ && app.register(FetchToken, window.fetch);

  if (__NODE__) {
    // Set port to 3000 to match test expectations
    process.env.PORT = '3000';

    mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(async () => {
        console.log('Mongodb Connected.');
        await createDefaultUser();
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
      });

    app.register(BodyParserPlugin);
    app.register(XMLParserPlugin);
    app.register(HandlersPlugin);
    app.register(TemplatePlugin);
    app.register(InvoicePlugin);
    app.register(DeserializePlugin);
  }

  return app;
}
