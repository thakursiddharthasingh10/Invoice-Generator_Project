import React from 'react';
import { Percent, CreditCard, FileSignature, ShieldCheck } from 'lucide-react';
import { Invoice, PaymentDetails } from '../../types/invoice';
import { calculateInvoiceSummary } from '../../utils/invoiceCalculations';
import { formatCurrency } from '../../utils/currencyFormatter';

interface InvoiceSummaryFormProps {
  invoice: Invoice;
  onChange: (updated: Partial<Invoice>) => void;
  errors?: Record<string, string>;
}

export const InvoiceSummaryForm: React.FC<InvoiceSummaryFormProps> = ({
  invoice,
  onChange,
  errors = {},
}) => {
  const summary = calculateInvoiceSummary(invoice);

  const handlePaymentDetailsChange = (field: keyof PaymentDetails, value: string) => {
    onChange({
      paymentDetails: {
        ...invoice.paymentDetails,
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <CreditCard className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Discounts, Payments & Notes</h3>
          <p className="text-xs text-slate-500">Bank accounts, discount rules, and terms</p>
        </div>
      </div>

      {/* Discount & Amount Paid Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Discount Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Invoice Discount
          </label>
          <div className="flex items-center gap-2">
            <select
              value={invoice.discountType}
              onChange={(e) => onChange({ discountType: e.target.value as 'percentage' | 'fixed' })}
              className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="percentage">Percent (%)</option>
              <option value="fixed">Flat Amount</option>
            </select>
            <input
              type="number"
              min="0"
              max={invoice.discountType === 'percentage' ? 100 : undefined}
              step="any"
              value={invoice.discountValue || ''}
              onChange={(e) => onChange({ discountValue: Math.max(0, parseFloat(e.target.value) || 0) })}
              placeholder="0"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {errors['discountValue'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['discountValue']}</p>
          )}
        </div>

        {/* Amount Paid Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Amount Paid So Far (Partial Payment)
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={invoice.amountPaid || ''}
            onChange={(e) => onChange({ amountPaid: Math.max(0, parseFloat(e.target.value) || 0) })}
            placeholder="0.00"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {errors['amountPaid'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['amountPaid']}</p>
          )}
        </div>
      </div>

      {/* Bank & Remittance Details */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Bank & Remittance Details (Printed on Invoice)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
            <input
              type="text"
              value={invoice.paymentDetails?.bankName || ''}
              onChange={(e) => handlePaymentDetailsChange('bankName', e.target.value)}
              placeholder="e.g. HDFC Bank"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Holder</label>
            <input
              type="text"
              value={invoice.paymentDetails?.accountHolder || ''}
              onChange={(e) => handlePaymentDetailsChange('accountHolder', e.target.value)}
              placeholder="e.g. Acme Tech Solutions"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
            <input
              type="text"
              value={invoice.paymentDetails?.accountNumber || ''}
              onChange={(e) => handlePaymentDetailsChange('accountNumber', e.target.value)}
              placeholder="e.g. 50200012345678"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">IFSC / SWIFT / Sort Code</label>
            <input
              type="text"
              value={invoice.paymentDetails?.ifscOrSwift || ''}
              onChange={(e) => handlePaymentDetailsChange('ifscOrSwift', e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0001234"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">UPI ID / VPA (for Instant Pay)</label>
            <input
              type="text"
              value={invoice.paymentDetails?.upiId || ''}
              onChange={(e) => handlePaymentDetailsChange('upiId', e.target.value)}
              placeholder="e.g. yourbusiness@okhdfcbank"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes & Payment Instructions
          </label>
          <textarea
            rows={2}
            value={invoice.paymentDetails?.notes || ''}
            onChange={(e) => handlePaymentDetailsChange('notes', e.target.value)}
            placeholder="Thank you for your business. Please include invoice number in transaction reference."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Terms & Conditions
          </label>
          <textarea
            rows={2}
            value={invoice.termsAndConditions || ''}
            onChange={(e) => onChange({ termsAndConditions: e.target.value })}
            placeholder="Payment is due within 15 days. Late payments subject to interest fee."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
