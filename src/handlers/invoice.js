// @flow
// src
import { createPlugin } from 'fusion-core';
import { createOrUpdatePerson } from './person';
import { InvoiceModel } from '../models/Invoice';
import { Values } from '../types';
import axios from 'axios';

export default createPlugin({
  middleware: () => async (ctx, next) => {
    if (ctx.path === '/api/invoice/import/xml' && ctx.method === 'POST') {
      try {
        console.log('Received XML import request');
        const xmlString = ctx.request.body;
        console.log('XML String:', xmlString);

        if (!xmlString) {
          throw new Error('No XML data provided');
        }

        const xmlDoc = ctx.xmlParser.parseXML(xmlString);
        console.log('XML parsed successfully');
        
        // Extract invoice data from XML
        const customerNode = xmlDoc.get('//customer');
        if (!customerNode) {
          throw new Error('Customer node not found in XML');
        }
        const customer = customerNode.text();
        
        const itemNodes = xmlDoc.find('//item');
        if (!itemNodes || itemNodes.length === 0) {
          throw new Error('No item nodes found in XML');
        }
        const items = itemNodes.map(item => item.text());
        
        console.log('Extracted data:', { customer, items });
        
        ctx.body = {
          success: true,
          data: {
            customer,
            items
          }
        };
        ctx.status = 200;
      } catch (error) {
        console.error('XML parsing error:', error);
        ctx.status = 500;
        ctx.body = {
          success: false,
          error: error.message
        };
      }
      return;
    }
    return next();
  }
});

export async function createInvoice(values /*: Values */, userId /*: string */) {
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
export function getInvoices(userId /*: string */) {
  return InvoiceModel.find({ userId })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .lean();
}

// IDOR Vulnerability: No authorization check on invoice updates
export function updateInvoice(invoiceId /*: string */, updates /*: Object */) {
  return InvoiceModel.findOneAndUpdate({ invoiceId }, updates, { new: true })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .lean();
}

// IDOR Vulnerability: No authorization check on invoice deletion
export function deleteInvoice(invoiceId /*: string */) {
  return InvoiceModel.findOneAndDelete({ invoiceId }).lean();
}
