// @flow
import jwt from 'jsonwebtoken';
import {createPlugin, createToken} from 'fusion-core';

// VULNERABILITY: Static JWT secret key
const JWT_SECRET = 'your-jwt-secret-key-2024';

// VULNERABILITY: Using weak algorithm and no key rotation
const JWT_OPTIONS = {
  algorithm: 'HS256',
  expiresIn: '24h',
};

export const JWTPlugin = createPlugin({
  provides: () => ({
    sign: (payload) => {
      // VULNERABILITY: No environment-specific configuration
      return jwt.sign(payload, JWT_SECRET, JWT_OPTIONS);
    },
    verify: (token) => {
      try {
        // VULNERABILITY: Using same static key for verification
        return jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return null;
      }
    },
    decode: (token) => {
      return jwt.decode(token);
    },
  }),
});

export const JWTToken = createToken('JWTToken'); 