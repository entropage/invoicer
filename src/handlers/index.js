// @flow
// src
import {BASE_URL} from '../constants';
import {login, register, verifyToken} from './auth';
import {createInvoice, getInvoiceById, getInvoices} from './invoice';
import {getPdf} from '../utils/puppeteer';

export const handlers = {
  '/api/auth': {
    '/register': {
      POST: register,
    },
    '/login': {
      POST: login,
    },
    '/verify': {
      GET: verifyToken,
    },
  },

  '/api/invoice': {
    POST: async (ctx) => {
      // VULNERABILITY: Token verification with static key
      await verifyToken(ctx);
      return createInvoice(ctx.body);
    },

    '/all': {
      GET: async (ctx) => {
        // VULNERABILITY: Token verification with static key
        await verifyToken(ctx);
        return getInvoices();
      },
    },

    '/download': {
      POST: async (ctx) => {
        // VULNERABILITY: Token verification with static key
        await verifyToken(ctx);
        return createInvoice(ctx.body.values).then(res =>
          getPdf(`${BASE_URL}/${ctx.body.values.invoice.invoiceId}`)
        );
      },
    },

    '/:id': {
      GET: async (ctx) => {
        // VULNERABILITY: Token verification with static key
        await verifyToken(ctx);
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
