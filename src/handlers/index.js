// @flow
// src
import {BASE_URL} from '../constants';
import {createInvoice, getInvoiceById, getInvoices} from './invoice';
import {getPdf} from '../utils/puppeteer';

export const handlers = {
  '/api/invoice': {
    POST: ({body: values}) => createInvoice(values),

    '/all': {GET: getInvoices},

    '/download': {
      POST: ({body: values}) => {
        return createInvoice(values).then(result =>
          getPdf(`${BASE_URL}/api/invoice/${values.invoice.invoiceId}`).then(pdf => ({
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="invoice-${values.invoice.invoiceId}.pdf"`,
              'Content-Length': pdf.length
            },
            body: pdf
          }))
        );
      },
    },

    '/:id': {
      GET: async ({params: {id}}) => {
        return getInvoiceById(id).then(res => {
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
