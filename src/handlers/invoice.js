// @flow
// src
import { createPlugin } from 'fusion-core';
import { createOrUpdatePerson } from './person';
import { InvoiceModel } from '../models/Invoice';
import { Values } from '../types';
import axios from 'axios';

// Export all the functions first
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

export function getInvoiceById(invoiceId, userId) {
  // Include invoices where user is either owner or in accessList
  return InvoiceModel.findOne({
    invoiceId,
    $or: [
      { userId },
      { accessList: userId }
    ]
  }, { _id: 0 })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .populate({ path: 'accessList', select: 'username role' })
    .lean();
}

export function getInvoices(userId /*: string */) {
  // Include invoices where user is either owner or in accessList
  return InvoiceModel.find({
    $or: [
      { userId },
      { accessList: userId }
    ]
  })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .populate({ path: 'accessList', select: 'username role' })
    .lean();
}

export function updateInvoice(invoiceId /*: string */, updates /*: Object */) {
  return InvoiceModel.findOneAndUpdate({ invoiceId }, updates, { new: true })
    .populate({ path: 'client', select: { _id: 0 } })
    .populate({ path: 'seller', select: { _id: 0 } })
    .lean();
}

export function deleteInvoice(invoiceId /*: string */) {
  return InvoiceModel.findOneAndDelete({ invoiceId }).lean();
}

// Create and export the plugin with XML handling
const plugin = createPlugin({
  middleware: () => async (ctx, next) => {
    // Handle XML import endpoint
    if (ctx.path === '/api/invoice/import/xml' && ctx.method === 'POST') {
      try {
        console.log('Received XML import request');
        const xmlString = ctx.request.body;
        console.log('XML String:', xmlString);

        if (!xmlString) {
          throw new Error('No XML data provided');
        }

        // Vulnerable: Using parseXML with dangerous options
        const xmlDoc = ctx.xmlParser.parseXML(xmlString);
        console.log('XML parsed successfully');

        // Vulnerable: Extract and process ALL nodes including external entities
        const allNodes = xmlDoc.root().childNodes();
        const extractedData = {
          customer: '',
          items: []
        };

        allNodes.forEach(node => {
          if (node.type() === 'element') {
            if (node.name() === 'customer') {
              extractedData.customer = node.text();
            } else if (node.name() === 'items') {
              // Extract items and their content
              node.childNodes().forEach(itemNode => {
                if (itemNode.type() === 'element' && itemNode.name() === 'item') {
                  extractedData.items.push(itemNode.text());
                }
              });
            }
          }
        });

        console.log('Extracted data:', extractedData);

        // Vulnerable: Return all extracted data in response
        ctx.body = {
          success: true,
          data: extractedData,
          debug: {
            xmlString,
            parsedXml: xmlDoc.toString()
          }
        };
        ctx.status = 200;
      } catch (error) {
        // Vulnerable: Return detailed error information
        console.error('XML parsing error:', error);
        ctx.status = 500;
        ctx.body = {
          success: false,
          error: error.message,
          stack: error.stack,
          xmlString: ctx.request.body
        };
      }
      return;
    }
    return next();
  }
});

export default plugin;
