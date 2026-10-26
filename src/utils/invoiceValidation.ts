import { Invoice } from '../types/invoice';

export interface ValidationError {
  field: string;
  message: string;
}

export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true; // optional unless marked required
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function validateInvoice(invoice: Invoice): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Business validations
  if (!invoice.business.name || !invoice.business.name.trim()) {
    errors.push({ field: 'business.name', message: 'Business name is required' });
  }
  if (invoice.business.email && !isValidEmail(invoice.business.email)) {
    errors.push({ field: 'business.email', message: 'Please enter a valid business email' });
  }

  // Client validations
  if (!invoice.client.name || !invoice.client.name.trim()) {
    errors.push({ field: 'client.name', message: 'Client business / customer name is required' });
  }
  if (invoice.client.email && !isValidEmail(invoice.client.email)) {
    errors.push({ field: 'client.email', message: 'Please enter a valid client email' });
  }

  // Invoice Meta validations
  if (!invoice.invoiceNumber || !invoice.invoiceNumber.trim()) {
    errors.push({ field: 'invoiceNumber', message: 'Invoice number is required' });
  }
  if (!invoice.issueDate) {
    errors.push({ field: 'issueDate', message: 'Issue date is required' });
  }
  if (!invoice.dueDate) {
    errors.push({ field: 'dueDate', message: 'Due date is required' });
  }

  // Date sequence check
  if (invoice.issueDate && invoice.dueDate) {
    const issue = new Date(invoice.issueDate);
    const due = new Date(invoice.dueDate);
    if (due < issue) {
      errors.push({ field: 'dueDate', message: 'Due date cannot be earlier than the issue date' });
    }
  }

  // Line items validation
  if (!invoice.items || invoice.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one line item is required' });
  } else {
    let hasValidItem = false;
    invoice.items.forEach((item, index) => {
      if (!item.name || !item.name.trim()) {
        errors.push({ field: `items.${index}.name`, message: `Item #${index + 1}: Name is required` });
      } else {
        hasValidItem = true;
      }
      if (item.quantity <= 0) {
        errors.push({ field: `items.${index}.quantity`, message: `Item #${index + 1}: Quantity must be greater than 0` });
      }
      if (item.unitPrice < 0) {
        errors.push({ field: `items.${index}.unitPrice`, message: `Item #${index + 1}: Unit price cannot be negative` });
      }
      if (item.taxRate < 0 || item.taxRate > 100) {
        errors.push({ field: `items.${index}.taxRate`, message: `Item #${index + 1}: Tax rate must be between 0% and 100%` });
      }
    });

    if (!hasValidItem) {
      errors.push({ field: 'items', message: 'At least one item with a valid name is required' });
    }
  }

  // Numeric fields validation
  if (invoice.discountValue < 0) {
    errors.push({ field: 'discountValue', message: 'Discount cannot be negative' });
  }
  if (invoice.discountType === 'percentage' && invoice.discountValue > 100) {
    errors.push({ field: 'discountValue', message: 'Discount percentage cannot exceed 100%' });
  }
  if (invoice.amountPaid < 0) {
    errors.push({ field: 'amountPaid', message: 'Amount paid cannot be negative' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
