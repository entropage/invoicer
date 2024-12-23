// @flow
import {createInvoice, getInvoiceById, getInvoices, updateInvoice, deleteInvoice} from './invoice';
import {login, register, verifyToken} from './auth';

export default async (ctx, next) => {
  const {method, path} = ctx;
  
  if (path === '/api/auth/login' && method === 'POST') {
    try {
      const result = await login(ctx);
      ctx.body = result;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {error: error.message};
    }
    return;
  }

  if (path === '/api/auth/register' && method === 'POST') {
    try {
      const result = await register(ctx);
      ctx.body = result;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {error: error.message};
    }
    return;
  }

  // Invoice routes - Only getInvoices is properly protected
  if (path === '/api/invoice/all' && method === 'GET') {
    try {
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      const user = await verifyToken(token);
      const invoices = await getInvoices(user.id);
      ctx.body = invoices;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {error: error.message};
    }
    return;
  }

  // IDOR Vulnerability: No user check on specific invoice access
  if (path.startsWith('/api/invoice/') && method === 'GET' && path !== '/api/invoice/all') {
    try {
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      await verifyToken(token);
      const invoiceId = path.split('/')[3];
      const invoice = await getInvoiceById(invoiceId);
      if (!invoice) {
        ctx.status = 404;
        ctx.body = {error: 'Invoice not found'};
        return;
      }
      ctx.body = invoice;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {error: error.message};
    }
    return;
  }

  if (path === '/api/invoice' && method === 'POST') {
    try {
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      const user = await verifyToken(token);
      const invoice = await createInvoice(ctx.request.body, user.id);
      ctx.body = invoice;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {error: error.message};
    }
    return;
  }

  // IDOR Vulnerability: No ownership check on update
  if (path.startsWith('/api/invoice/') && method === 'PUT') {
    try {
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      await verifyToken(token);
      const invoiceId = path.split('/')[3];
      const invoice = await updateInvoice(invoiceId, ctx.request.body);
      if (!invoice) {
        ctx.status = 404;
        ctx.body = {error: 'Invoice not found'};
        return;
      }
      ctx.body = invoice;
    } catch (error) {
      ctx.status = 500;
      ctx.body = {error: error.message};
    }
    return;
  }

  // IDOR Vulnerability: No ownership check on delete
  if (path.startsWith('/api/invoice/') && method === 'DELETE') {
    try {
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      await verifyToken(token);
      const invoiceId = path.split('/')[3];
      const invoice = await deleteInvoice(invoiceId);
      if (!invoice) {
        ctx.status = 404;
        ctx.body = {error: 'Invoice not found'};
        return;
      }
      ctx.body = {message: 'Invoice deleted successfully'};
    } catch (error) {
      ctx.status = 500;
      ctx.body = {error: error.message};
    }
    return;
  }

  await next();
};
