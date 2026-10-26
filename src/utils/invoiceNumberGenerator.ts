import { Invoice } from '../types/invoice';

export function generateInvoiceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

export function generateItemId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

export function generateNextInvoiceNumber(existingInvoices: Invoice[] = []): string {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  // Find all invoices that match INV-YYYY-XXX
  let maxSeq = 0;
  existingInvoices.forEach(inv => {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)) {
      const parts = inv.invoiceNumber.split('-');
      if (parts.length >= 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

export function formatDateForInput(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return formatDateForInput(d);
  } catch (e) {
    return dateStr;
  }
}
