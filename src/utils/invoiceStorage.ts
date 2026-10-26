import { Invoice, BusinessDetails } from '../types/invoice';
import { generateInvoiceId, generateItemId, generateNextInvoiceNumber, formatDateForInput, addDays } from './invoiceNumberGenerator';

const INVOICES_STORAGE_KEY = 'invoice_generator_invoices_v1';
const BUSINESS_PROFILE_KEY = 'invoice_generator_business_v1';
const RECENT_CLIENTS_KEY = 'invoice_generator_recent_clients_v1';

export const SAMPLE_BUSINESS: BusinessDetails = {
  name: 'Apex Digital Technologies Pvt. Ltd.',
  ownerName: 'Aryan Verma',
  email: 'billing@apexdigital.io',
  phone: '+91 98765 43210',
  address: 'Plot 42, Tech Park, Outer Ring Road, Bengaluru, Karnataka 560103',
  gstin: '29AABCU9603R1ZM',
  logoUrl: '',
};

export const INITIAL_SAMPLE_INVOICE: Invoice = {
  id: 'sample_inv_001',
  invoiceNumber: 'INV-2026-001',
  issueDate: formatDateForInput(new Date()),
  dueDate: addDays(formatDateForInput(new Date()), 15),
  paymentTerms: 'Net 15',
  poNumber: 'PO-9942',
  status: 'Pending',
  currency: 'INR',
  taxMode: 'cgst_sgst',
  business: {
    ...SAMPLE_BUSINESS,
  },
  client: {
    name: 'Starlight Retailers India LLP',
    contactPerson: 'Meera Kapoor',
    email: 'accounts@starlightretail.in',
    phone: '+91 91234 56789',
    address: 'Level 4, Orion Galleria, Andheri West, Mumbai, Maharashtra 400053',
    gstin: '27AADCS4128N1ZS',
  },
  items: [
    {
      id: generateItemId(),
      name: 'Custom E-Commerce Platform Development',
      description: 'Full-stack development, headless catalog architecture, payments integration and responsive UI',
      quantity: 1,
      unitPrice: 85000,
      taxRate: 18,
    },
    {
      id: generateItemId(),
      name: 'UI/UX Design & High-Fidelity Prototyping',
      description: 'Design system, interactive Figma prototypes, and user journey optimization',
      quantity: 1,
      unitPrice: 35000,
      taxRate: 18,
    },
    {
      id: generateItemId(),
      name: 'Cloud Infrastructure & CI/CD Pipeline Setup',
      description: 'AWS ECS container orchestration, automated deployment pipelines, and SSL configuration',
      quantity: 1,
      unitPrice: 20000,
      taxRate: 18,
    },
  ],
  discountType: 'percentage',
  discountValue: 5,
  amountPaid: 40000,
  paymentDetails: {
    bankName: 'HDFC Bank',
    accountNumber: '50200084920194',
    accountHolder: 'Apex Digital Technologies Pvt. Ltd.',
    ifscOrSwift: 'HDFC0001234',
    upiId: 'apexdigital@okhdfcbank',
    notes: 'Thank you for partnering with Apex Digital! Please remit payment via NEFT/RTGS or UPI referencing INV-2026-001.',
  },
  termsAndConditions: '1. Payment is due within 15 days of invoice date.\n2. Overdue payments are subject to a 1.5% interest charge per month.\n3. All intellectual property transfers upon receipt of full payment.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function createBlankInvoice(existingInvoices: Invoice[] = []): Invoice {
  const savedBusiness = getSavedBusinessProfile();
  const today = formatDateForInput(new Date());

  return {
    id: generateInvoiceId(),
    invoiceNumber: generateNextInvoiceNumber(existingInvoices),
    issueDate: today,
    dueDate: addDays(today, 15),
    paymentTerms: 'Net 15',
    poNumber: '',
    status: 'Draft',
    currency: 'INR',
    taxMode: 'cgst_sgst',
    business: savedBusiness || {
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      logoUrl: '',
    },
    client: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
    },
    items: [
      {
        id: generateItemId(),
        name: 'Professional Consulting Services',
        description: 'Design, development, and technical review',
        quantity: 1,
        unitPrice: 5000,
        taxRate: 18,
      },
    ],
    discountType: 'percentage',
    discountValue: 0,
    amountPaid: 0,
    paymentDetails: {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      ifscOrSwift: '',
      upiId: '',
      notes: 'Thank you for your business. Please reach out if you have any questions regarding this invoice.',
    },
    termsAndConditions: 'Payment is due within stated terms. Please include the invoice number in the payment reference.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getSavedInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!raw) {
      // First time loading: populate with initial sample invoice
      const initial = [INITIAL_SAMPLE_INVOICE];
      saveInvoicesList(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [INITIAL_SAMPLE_INVOICE];
  } catch (e) {
    console.error('Failed to read invoices from localStorage:', e);
    return [INITIAL_SAMPLE_INVOICE];
  }
}

export function saveInvoicesList(invoices: Invoice[]): boolean {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    return true;
  } catch (e) {
    console.error('Failed to save invoices to localStorage:', e);
    return false;
  }
}

export function saveInvoice(invoice: Invoice): { success: boolean; updatedList: Invoice[] } {
  const invoices = getSavedInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id);
  
  const updatedInvoice: Invoice = {
    ...invoice,
    updatedAt: new Date().toISOString(),
  };

  let newList: Invoice[];
  if (index >= 0) {
    newList = [...invoices];
    newList[index] = updatedInvoice;
  } else {
    newList = [updatedInvoice, ...invoices];
  }

  saveInvoicesList(newList);
  return { success: true, updatedList: newList };
}

export function deleteInvoiceById(id: string): { success: boolean; updatedList: Invoice[] } {
  const invoices = getSavedInvoices();
  const newList = invoices.filter(i => i.id !== id);
  saveInvoicesList(newList);
  return { success: true, updatedList: newList };
}

export function duplicateInvoice(invoice: Invoice, existingInvoices: Invoice[] = []): Invoice {
  const newNumber = generateNextInvoiceNumber(existingInvoices);
  const today = formatDateForInput(new Date());

  const duplicated: Invoice = {
    ...invoice,
    id: generateInvoiceId(),
    invoiceNumber: newNumber,
    issueDate: today,
    dueDate: addDays(today, 15),
    status: 'Draft',
    amountPaid: 0,
    items: invoice.items.map(item => ({
      ...item,
      id: generateItemId(),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return duplicated;
}

export function getSavedBusinessProfile(): BusinessDetails | null {
  try {
    const raw = localStorage.getItem(BUSINESS_PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function saveBusinessProfile(business: BusinessDetails): void {
  try {
    localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(business));
  } catch (e) {
    console.error('Failed to save business profile to localStorage:', e);
  }
}

export function resetToDemoData(): Invoice[] {
  const demoList = [INITIAL_SAMPLE_INVOICE];
  saveInvoicesList(demoList);
  return demoList;
}
