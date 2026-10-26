export type InvoiceStatus = 'Draft' | 'Pending' | 'Paid' | 'Overdue';

export type TaxMode = 'standard' | 'cgst_sgst' | 'igst';

export type DiscountType = 'percentage' | 'fixed';

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // in percentage e.g. 18
}

export interface BusinessDetails {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  logoUrl?: string; // base64 or url
}

export interface ClientDetails {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
}

export interface PaymentDetails {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  ifscOrSwift?: string;
  upiId?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  paymentTerms: string;
  poNumber?: string;
  status: InvoiceStatus;
  currency: string;  // e.g. 'INR', 'USD', 'EUR', 'GBP'
  taxMode: TaxMode;
  
  business: BusinessDetails;
  client: ClientDetails;
  items: InvoiceItem[];
  
  discountType: DiscountType;
  discountValue: number;
  amountPaid: number;
  
  paymentDetails: PaymentDetails;
  termsAndConditions?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCalculationSummary {
  subtotal: number;
  taxableAmount: number;
  totalTax: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  isOverdue: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  narrationUnit: string;
  narrationFraction: string;
  locale: string;
}
