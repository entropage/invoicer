// @flow
import {Router} from 'express';
import {createInvoice, getInvoiceById, getInvoices, updateInvoice, deleteInvoice} from './invoice';
import {login, register, authenticate} from './auth';

const router = Router();

// Auth routes
router.post('/auth/login', login);
router.post('/auth/register', register);

// Invoice routes - Only getInvoices is properly protected
router.get('/invoice/all', authenticate, async (req, res) => {
  try {
    const invoices = await getInvoices(req.user.id);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// IDOR Vulnerability: No user check on specific invoice access
router.get('/invoice/:id', authenticate, async (req, res) => {
  try {
    const invoice = await getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({error: 'Invoice not found'});
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

router.post('/invoice', authenticate, async (req, res) => {
  try {
    const invoice = await createInvoice(req.body, req.user.id);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// IDOR Vulnerability: No ownership check on update
router.put('/invoice/:id', authenticate, async (req, res) => {
  try {
    const invoice = await updateInvoice(req.params.id, req.body);
    if (!invoice) {
      return res.status(404).json({error: 'Invoice not found'});
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// IDOR Vulnerability: No ownership check on delete
router.delete('/invoice/:id', authenticate, async (req, res) => {
  try {
    const invoice = await deleteInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({error: 'Invoice not found'});
    }
    res.json({message: 'Invoice deleted successfully'});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

export default router;
