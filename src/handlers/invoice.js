// @flow
// src
import {createOrUpdatePerson} from './person';
import {InvoiceModel} from '../models/Invoice';
import {Values} from '../types';

export async function createInvoice(values: Values, userId: string) {
  const foundInvoice = await getInvoiceById(values.invoice.invoiceId);

  if (foundInvoice) {
    return Promise.resolve(foundInvoice);
  }

  const clientPromise = createOrUpdatePerson(values.client);
  const sellerPromise = createOrUpdatePerson(values.seller);

  return Promise.all([clientPromise, sellerPromise])
    .then(
      ([client, seller]) =>
        new InvoiceModel({...values.invoice, client, seller, userId})
    )
    .then(invoice => invoice.save());
}

// IDOR Vulnerability: No authorization check on invoice ID access
export function getInvoiceById(invoiceId) {
  return InvoiceModel.findOne({invoiceId}, {_id: 0})
    .populate({path: 'client', select: {_id: 0}})
    .populate({path: 'seller', select: {_id: 0}})
    .lean();
}

// Get invoices for a specific user
export function getInvoices(userId: string) {
  return InvoiceModel.find({userId})
    .populate({path: 'client', select: {_id: 0}})
    .populate({path: 'seller', select: {_id: 0}})
    .lean();
}

// IDOR Vulnerability: No authorization check on invoice updates
export function updateInvoice(invoiceId: string, updates: Object) {
  return InvoiceModel.findOneAndUpdate(
    {invoiceId},
    updates,
    {new: true}
  )
  .populate({path: 'client', select: {_id: 0}})
  .populate({path: 'seller', select: {_id: 0}})
  .lean();
}

// IDOR Vulnerability: No authorization check on invoice deletion
export function deleteInvoice(invoiceId: string) {
  return InvoiceModel.findOneAndDelete({invoiceId}).lean();
}
