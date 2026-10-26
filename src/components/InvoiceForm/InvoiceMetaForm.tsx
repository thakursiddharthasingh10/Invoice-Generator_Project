import React from 'react';
import { FileText, Calendar, IndianRupee, Layers } from 'lucide-react';
import { Invoice, InvoiceStatus, TaxMode } from '../../types/invoice';
import { CURRENCIES } from '../../utils/currencyFormatter';
import { addDays } from '../../utils/invoiceNumberGenerator';

interface InvoiceMetaFormProps {
  invoice: Invoice;
  onChange: (updated: Partial<Invoice>) => void;
  errors?: Record<string, string>;
}

export const InvoiceMetaForm: React.FC<InvoiceMetaFormProps> = ({
  invoice,
  onChange,
  errors = {},
}) => {
  const handleTermsChange = (terms: string) => {
    let daysToAdd = 15;
    if (terms === 'Due on Receipt') daysToAdd = 0;
    else if (terms === 'Net 7') daysToAdd = 7;
    else if (terms === 'Net 15') daysToAdd = 15;
    else if (terms === 'Net 30') daysToAdd = 30;
    else if (terms === 'Net 60') daysToAdd = 60;

    const newDueDate = addDays(invoice.issueDate || new Date().toISOString().split('T')[0], daysToAdd);
    onChange({
      paymentTerms: terms,
      dueDate: newDueDate,
    });
  };

  const handleIssueDateChange = (date: string) => {
    // Keep relative due date or update
    let daysToAdd = 15;
    if (invoice.paymentTerms === 'Due on Receipt') daysToAdd = 0;
    else if (invoice.paymentTerms === 'Net 7') daysToAdd = 7;
    else if (invoice.paymentTerms === 'Net 15') daysToAdd = 15;
    else if (invoice.paymentTerms === 'Net 30') daysToAdd = 30;
    else if (invoice.paymentTerms === 'Net 60') daysToAdd = 60;

    const newDueDate = addDays(date, daysToAdd);
    onChange({
      issueDate: date,
      dueDate: newDueDate,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Invoice Information</h3>
          <p className="text-xs text-slate-500">Dates, currency, and invoice metadata</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Invoice Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Invoice Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={invoice.invoiceNumber}
            onChange={(e) => onChange({ invoiceNumber: e.target.value })}
            placeholder="INV-2026-001"
            className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors['invoiceNumber'] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {errors['invoiceNumber'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['invoiceNumber']}</p>
          )}
        </div>

        {/* Currency Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Currency
          </label>
          <select
            value={invoice.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {Object.values(CURRENCIES).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.symbol} {curr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Issue Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={invoice.issueDate}
            onChange={(e) => handleIssueDateChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors['issueDate'] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {errors['issueDate'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['issueDate']}</p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Due Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={invoice.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors['dueDate'] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {errors['dueDate'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['dueDate']}</p>
          )}
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Payment Terms
          </label>
          <select
            value={invoice.paymentTerms}
            onChange={(e) => handleTermsChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="Due on Receipt">Due on Receipt</option>
            <option value="Net 7">Net 7 Days</option>
            <option value="Net 15">Net 15 Days</option>
            <option value="Net 30">Net 30 Days</option>
            <option value="Net 60">Net 60 Days</option>
            <option value="Custom">Custom Terms</option>
          </select>
        </div>

        {/* PO Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            PO / Reference # (Optional)
          </label>
          <input
            type="text"
            value={invoice.poNumber || ''}
            onChange={(e) => onChange({ poNumber: e.target.value })}
            placeholder="e.g. PO-8841"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Invoice Status
          </label>
          <select
            value={invoice.status}
            onChange={(e) => onChange({ status: e.target.value as InvoiceStatus })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Tax Mode Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tax Structure Mode
          </label>
          <select
            value={invoice.taxMode}
            onChange={(e) => onChange({ taxMode: e.target.value as TaxMode })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="cgst_sgst">Indian GST (CGST + SGST)</option>
            <option value="igst">Indian IGST (Integrated Tax)</option>
            <option value="standard">Standard Single Tax %</option>
          </select>
        </div>
      </div>
    </div>
  );
};
