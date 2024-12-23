// @flow
import {createInvoice, getInvoiceById, getInvoices, updateInvoice, deleteInvoice} from './invoice';
import {login, register, verifyToken} from './auth';

export default {
  // Auth routes
  'POST /api/auth/login': async ({body}) => {
    try {
      const result = await login(body);
      return {
        status: 200,
        body: result
      };
    } catch (error) {
      return {
        status: 500,
        body: {error: error.message}
      };
    }
  },

  'POST /api/auth/register': async ({body}) => {
    try {
      const result = await register(body);
      return {
        status: 200,
        body: result
      };
    } catch (error) {
      return {
        status: 500,
        body: {error: error.message}
      };
    }
  },

  // Invoice routes - Only getInvoices is properly protected
  'GET /api/invoice/all': async ({headers}) => {
    try {
      const token = headers.authorization?.replace('Bearer ', '');
      const user = await verifyToken(token);
      const invoices = await getInvoices(user.id);
      return {
        status: 200,
        body: invoices
      };
    } catch (error) {
      return {
        status: 500,
        body: {error: error.message}
      };
    }
  },

  // IDOR Vulnerability: No user check on specific invoice access
  'GET /api/invoice/:id': async ({params, headers}) => {
    try {
      const token = headers.authorization?.replace('Bearer ', '');
      await verifyToken(token);
      const invoice = await getInvoiceById(params.id);
      if (!invoice) {
        return {
          status: 404,
          body: {error: 'Invoice not found'}
        };
      }
      return {
        status: 200,
        body: invoice
      };
    } catch (error) {
      return {
        status: 500,
        body: {error: error.message}
      };
    }
  },

  'POST /api/invoice': async ({body, headers}) => {
    try {
      const token = headers.authorization?.replace('Bearer ', '');
      const user = await verifyToken(token);
      const invoice = await createInvoice(body, user.id);
      return {
        status: 200,
        body: invoice
      };
    } catch (error) {
      return {
        status: 500,
        body: {error: error.message}
      };
    }
  },

  // IDOR Vulnerability: No ownership check on update
  'PUT /api/invoice/:id': async ({params, body, headers}) => {
    try {
      const token = headers.authorization?.replace('Bearer ', '');
      await verifyToken(token);
      const invoice = await updateInvoice(params.id, body);
      if (!invoice) {
        return {
          status: 404,
          body: {error: 'Invoice not found'}
        };
      }
      return {
        status: 200,
        body: invoice
      };
    } catch (error) {
      return {
        status: 500,
        body: {error: error.message}
      };
    }
  },

  // IDOR Vulnerability: No ownership check on delete
  'DELETE /api/invoice/:id': async ({params, headers}) => {
    try {
      const token = headers.authorization?.replace('Bearer ', '');
      await verifyToken(token);
      const invoice = await deleteInvoice(params.id);
      if (!invoice) {
        return {
          status: 404,
          body: {error: 'Invoice not found'}
        };
      }
      return {
        status: 200,
        body: {message: 'Invoice deleted successfully'}
      };
    } catch (error) {
      return {
        status: 500,
        body: {error: error.message}
      };
    }
  }
};
