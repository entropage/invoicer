// @flow
import Router from '@koa/router';
import {createInvoice, getInvoiceById, getInvoices, updateInvoice, deleteInvoice} from './invoice';
import {login, register, verifyToken} from './auth';
import {readFile, readFileSecure, getPdfTemplate} from './file';
import {executeCommand, generatePdfReport, checkConnection, getSystemInfo} from './system';
import { User } from '../models/user';
import templateHandler from './template';
import settingsHandler from './settings';
import xssHandler from './xss';
import { InvoiceModel } from '../models/Invoice';

const router = new Router();

// Health check endpoint
router.get('/health', async (ctx) => {
  ctx.body = {status: 'ok'};
});

// VULNERABILITY: Exposes all user data including password hashes
// Even though API is authenticated, it shouldn't leak sensitive data like password hashes
router.get('/api/users', async (ctx) => {
  try {
    // Authenticate the request
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    await verifyToken(token);

    // Vulnerable: Returns all users with sensitive data including password hashes
    // Should filter out sensitive fields, but doesn't
    const users = await User.find({})
      .lean()  // Convert to plain JS objects
      .select('_id username password role createdAt')  // Explicitly select fields
      .exec();

    // Ensure consistent field names and string IDs
    const formattedUsers = users.map(user => ({
      ...user,
      _id: user._id.toString(),  // Convert ObjectId to string
    }));

    ctx.body = formattedUsers;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// XSS routes
router.use(xssHandler);

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
    const user = await verifyToken(token);
    const invoice = await getInvoiceById(ctx.params.id, user.id);
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

// Share invoice with another user
router.post('/api/invoice/:id/share', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    const user = await verifyToken(token);
    const invoice = await InvoiceModel.findOne({ invoiceId: ctx.params.id, userId: user.id });

    if (!invoice) {
      ctx.status = 404;
      ctx.body = { error: 'Invoice not found' };
      return;
    }

    const { userId } = ctx.request.body;
    if (!userId) {
      ctx.status = 400;
      ctx.body = { error: 'User ID is required' };
      return;
    }

    // Verify target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      ctx.status = 404;
      ctx.body = { error: 'Target user not found' };
      return;
    }

    // Add user to access list if not already there
    if (!invoice.accessList.includes(userId)) {
      invoice.accessList.push(userId);
      invoice.sharedAt = new Date();
      await invoice.save();
    }

    ctx.body = { message: 'Invoice shared successfully' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Remove user from invoice share list
router.delete('/api/invoice/:id/share', async (ctx) => {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    const user = await verifyToken(token);
    const invoice = await InvoiceModel.findOne({ invoiceId: ctx.params.id, userId: user.id });

    if (!invoice) {
      ctx.status = 404;
      ctx.body = { error: 'Invoice not found' };
      return;
    }

    const { userId } = ctx.request.body;
    if (!userId) {
      ctx.status = 400;
      ctx.body = { error: 'User ID is required' };
      return;
    }

    // Remove user from access list
    invoice.accessList = invoice.accessList.filter(id => id.toString() !== userId);
    await invoice.save();

    ctx.body = { message: 'Share access removed successfully' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
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
