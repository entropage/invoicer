// @flow
// Polyfills
import './polyfills';

// libs
import App from 'fusion-react';
import HelmetPlugin from 'fusion-plugin-react-helmet-async';
import mongoose from 'mongoose';
import Router from 'fusion-plugin-react-router';
import {createPlugin} from 'fusion-core';
import bodyParser from 'koa-bodyparser';
import bcrypt from 'bcryptjs';

// src
import {App as ClientApp} from './App';
import handlers from './handlers';
import {MONGODB_URI} from './constants';
import {User} from './models/user';

// Create plugins
const BodyParserPlugin = createPlugin({
  middleware: () => bodyParser()
});

const HandlersPlugin = createPlugin({
  middleware: () => handlers
});

// Create default user
async function createDefaultUser() {
  try {
    const username = 'test';
    const password = 'test123';

    // Check if user exists
    const existingUser = await User.findOne({username});
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
  const app = new App(ClientApp);
  app.register(Router);
  app.register(HelmetPlugin);

  if (__NODE__) {
    mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(async () => {
        console.log('Mongodb Connected.');
        await createDefaultUser();
      })
      .catch(err => {
        console.error('MongoDB connection error:', err);
      });

    app.register(BodyParserPlugin);
    app.register(HandlersPlugin);
  }

  return app;
}
