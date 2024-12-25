// @flow

export type InvoiceItem = {
  id: string,
  description: string,
  quantity: number,
  unitPrice: number,
};

export type Invoice = {
  invoiceId: string,
  issueDate: string,
  dueDate: string,

  currency: string,
  taxValue: number,
  amountPaid: number,
  terms: string,
  items: InvoiceItem[],
  // SSRF Vulnerability: No URL validation on logo URL
  logoUrl?: string,
  logoData?: string,
};

export type Person = {
  name: string,
  city: string,
  address: string,
  phone: string,
  email: string,
};

export type Values = {
  client: Person,
  seller: Person,
  invoice: Invoice,
  isEditable?: boolean,
  action?: string,
};
