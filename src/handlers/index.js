// @flow
import Router from '@koa/router';
import {createInvoice, getInvoiceById, getInvoices, updateInvoice, deleteInvoice} from './invoice';
import {login, register, verifyToken} from './auth';
import {readFile, readFileSecure, getPdfTemplate} from './file';
import {executeCommand, generatePdfReport, checkConnection, getSystemInfo} from './system';
import templateHandler from './template';
import settingsHandler from './settings';

const router = new Router();

// Health check endpoint
router.get('/health', async (ctx) => {
  ctx.body = {status: 'ok'};
});

// Template routes
router.all('/api/template(.*)', templateHandler);

// Settings routes
router.all('/api/settings(.*)', settingsHandler);

// Auth routes
router.post('/api/auth/login', async (ctx) => {
  try {
    const result = await login(ctx);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.post('/api/auth/register', async (ctx) => {
  try {
    const result = await register(ctx);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

// Invoice routes
router.get('/api/invoice/all', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    const user = await verifyToken(token);
    const invoices = await getInvoices(user.id);
    ctx.body = invoices;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.get('/api/invoice/:id', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    await verifyToken(token);
    const invoice = await getInvoiceById(ctx.params.id);
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
});

router.post('/api/invoice', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    const user = await verifyToken(token);
    const invoice = await createInvoice(ctx.request.body, user.id);
    ctx.body = invoice;
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.put('/api/invoice/:id', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    await verifyToken(token);
    const invoice = await updateInvoice(ctx.params.id, ctx.request.body);
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
});

router.delete('/api/invoice/:id', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    await verifyToken(token);
    const invoice = await deleteInvoice(ctx.params.id);
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
});

// File routes
router.get('/api/file/read', async (ctx) => {
  try {
    await readFile(ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.get('/api/file/secure-read', async (ctx) => {
  try {
    await readFileSecure(ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.get('/api/file/template', async (ctx) => {
  try {
    await getPdfTemplate(ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

// System routes
router.get('/api/system/exec', async (ctx) => {
  try {
    await executeCommand(ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.get('/api/system/pdf', async (ctx) => {
  try {
    await generatePdfReport(ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.get('/api/system/ping', async (ctx) => {
  try {
    await checkConnection(ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

router.get('/api/system/info', async (ctx) => {
  try {
    await getSystemInfo(ctx);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {error: error.message};
  }
});

export default router.routes();
