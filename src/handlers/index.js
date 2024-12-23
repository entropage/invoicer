// @flow
// src
import {BASE_URL} from '../constants';
import {login, register, verifyToken} from './auth';
import {createInvoice, getInvoiceById, getInvoices} from './invoice';
import {getPdf} from '../utils/puppeteer';
import {JWTPlugin, JWTToken} from '../plugins/jwt';

// Create a JWT instance
const jwt = JWTPlugin.provides();

// VULNERABILITY: No authentication required if no token provided
const optionalAuth = async (ctx) => {
  try {
    if (ctx.headers && ctx.headers.authorization) {
      await verifyToken({...ctx, jwt});
    }
  } catch (error) {
    // Ignore auth errors when no token is provided
  }
};

export const handlers = {
  '/api/auth': {
    '/register': {
      POST: register,
    },
    '/login': {
      POST: async (ctx) => {
        return login({...ctx, jwt});
      },
    },
    '/verify': {
      GET: async (ctx) => {
        return verifyToken({...ctx, jwt});
      },
    },
  },

  '/api/invoice': {
    POST: async (ctx) => {
      // VULNERABILITY: Optional authentication
      await optionalAuth(ctx);
      return createInvoice(ctx.body);
    },

    '/all': {
      GET: async (ctx) => {
        // VULNERABILITY: Optional authentication
        await optionalAuth(ctx);
        return getInvoices();
      },
    },

    '/download': {
      POST: async (ctx) => {
        // VULNERABILITY: Optional authentication
        await optionalAuth(ctx);
        return createInvoice(ctx.body.values).then(res =>
          getPdf(`${BASE_URL}/${ctx.body.values.invoice.invoiceId}`)
        );
      },
    },

    '/:id': {
      GET: async (ctx) => {
        // VULNERABILITY: Optional authentication
        await optionalAuth(ctx);
        return getInvoiceById(ctx.params.id).then(res => {
          if (!res) {
            return Promise.reject(new Error("Invoice doesn't exist."));
          }

          const {client, seller, ...invoice} = res;
          return {client, seller, invoice};
        });
      },
    },
  },
};
