// @flow
// src
import { createOrUpdatePerson } from './person';
import { InvoiceModel } from '../models/Invoice';
import { Values } from '../types';
import axios from 'axios';

export async function createInvoice(values: Values, userId: string) {
  const foundInvoice = await getInvoiceById(values.invoice.invoiceId);

  if (foundInvoice) {
    return Promise.resolve(foundInvoice);
  }

  const [client, seller] = await Promise.all([createOrUpdatePerson(values.client), createOrUpdatePerson(values.seller)]);

  let logoData;
  if (values.invoice.logoUrl) {
    try {
      const response = await axios.get(values.invoice.logoUrl, {
        responseType: 'text',
        validateStatus: () => true,
      });
      logoData = response.data;
    } catch (error) {
      logoData = error.message;
    }
  }

  return new InvoiceModel({
    ...values.invoice,
    client,
    seller,
    userId,
    logoData,
  })
    .save()
    .then((invoice) => invoice.save());
}

// IDOR Vulnerability: No authorization check on invoice ID access
export function getInvoiceById(invoiceId) {
  return InvoiceModel.findOne({ invoiceId }, { _id: 0 })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .lean();
}

// Get invoices for a specific user
export function getInvoices(userId: string) {
  return InvoiceModel.find({ userId })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .lean();
}

// IDOR Vulnerability: No authorization check on invoice updates
export function updateInvoice(invoiceId: string, updates: Object) {
  return InvoiceModel.findOneAndUpdate({ invoiceId }, updates, { new: true })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .lean();
}

// IDOR Vulnerability: No authorization check on invoice deletion
export function deleteInvoice(invoiceId: string) {
  return InvoiceModel.findOneAndDelete({ invoiceId }).lean();
}
