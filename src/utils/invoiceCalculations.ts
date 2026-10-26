import { Invoice, InvoiceItem, InvoiceCalculationSummary } from '../types/invoice';

export function calculateItemAmounts(item: InvoiceItem) {
  const quantity = Math.max(0, Number(item.quantity) || 0);
  const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
  const taxRate = Math.max(0, Math.min(100, Number(item.taxRate) || 0));

  const taxableAmount = Math.round((quantity * unitPrice) * 100) / 100;
  const taxAmount = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
  const lineTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    quantity,
    unitPrice,
    taxRate,
    taxableAmount,
    taxAmount,
    lineTotal,
  };
}

export function calculateInvoiceSummary(invoice: Partial<Invoice>): InvoiceCalculationSummary {
  const items = invoice.items || [];
  
  let subtotal = 0;
  let totalTax = 0;

  items.forEach(item => {
    const calc = calculateItemAmounts(item);
    subtotal += calc.taxableAmount;
    totalTax += calc.taxAmount;
  });

  subtotal = Math.round(subtotal * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;

  // Discount calculation
  let discountAmount = 0;
  const discountVal = Number(invoice.discountValue) || 0;
  if (discountVal > 0) {
    if (invoice.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * (Math.min(100, discountVal) / 100)) * 100) / 100;
    } else {
      discountAmount = Math.min(subtotal + totalTax, Math.max(0, discountVal));
    }
  }

  // Grand Total
  const grandTotal = Math.max(0, Math.round((subtotal + totalTax - discountAmount) * 100) / 100);

  // Amount Paid & Amount Due
  const amountPaid = Math.max(0, Number(invoice.amountPaid) || 0);
  const amountDue = Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100);

  // Tax breakdowns
  const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
  const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100; // avoid rounding drift
  const igstAmount = totalTax;

  // Check overdue
  let isOverdue = false;
  if (invoice.dueDate && invoice.status !== 'Paid' && amountDue > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(invoice.dueDate);
    due.setHours(0, 0, 0, 0);
    if (!isNaN(due.getTime()) && due < today) {
      isOverdue = true;
    }
  }

  return {
    subtotal,
    taxableAmount: subtotal,
    totalTax,
    cgstAmount,
    sgstAmount,
    igstAmount,
    discountAmount,
    grandTotal,
    amountPaid,
    amountDue,
    isOverdue,
  };
}

export function getCalculatedInvoiceStatus(invoice: Invoice): Invoice['status'] {
  if (invoice.status === 'Paid') return 'Paid';
  const summary = calculateInvoiceSummary(invoice);
  if (summary.amountDue <= 0 && summary.grandTotal > 0) {
    return 'Paid';
  }
  if (summary.isOverdue) {
    return 'Overdue';
  }
  return invoice.status || 'Pending';
}
