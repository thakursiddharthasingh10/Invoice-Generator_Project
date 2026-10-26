import React, { useRef } from 'react';
import { 
  Download, 
  Printer, 
  Share2, 
  CheckCircle, 
  Clock, 
  AlertOctagon, 
  FileEdit,
  Building,
  User,
  CreditCard,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Invoice } from '../types/invoice';
import { calculateInvoiceSummary, calculateItemAmounts } from '../utils/invoiceCalculations';
import { formatCurrency, getCurrencyConfig } from '../utils/currencyFormatter';
import { exportInvoiceToPdf, printInvoice } from '../utils/pdfExport';
import { useToast } from './Toast';

interface InvoicePreviewProps {
  invoice: Invoice;
  onEdit?: () => void;
  onVoiceTrigger?: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ 
  invoice,
  onEdit,
  onVoiceTrigger,
}) => {
  const { showToast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const summary = calculateInvoiceSummary(invoice);
  const currencyConfig = getCurrencyConfig(invoice.currency);

  const handleDownloadPdf = () => {
    try {
      exportInvoiceToPdf(invoice);
      showToast(`Invoice ${invoice.invoiceNumber} PDF downloaded successfully!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const handlePrint = () => {
    printInvoice();
  };

  // Status badge styling
  const statusColors = {
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusIcons = {
    Paid: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
    Pending: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    Overdue: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />,
    Draft: <FileEdit className="w-3.5 h-3.5 text-slate-500" />,
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Preview Action Header (Hidden during browser print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Live Preview
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[invoice.status] || statusColors.Draft}`}>
            {statusIcons[invoice.status] || statusIcons.Draft}
            {invoice.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95"
            title="Download vector PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors"
            title="Print invoice"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          {onVoiceTrigger && (
            <button
              type="button"
              onClick={onVoiceTrigger}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors"
              title="Speak invoice details"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* Actual Invoice Sheet (A4 Proportion, Professional Clean Styling) */}
      <div 
        id="invoice-document"
        ref={previewRef}
        className="invoice-printable bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-[#14213D] max-w-[850px] mx-auto w-full transition-all duration-150"
      >
        {/* Top Accent Strip */}
        <div className="w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-sm -mt-6 sm:-mt-10 -mx-6 sm:-mx-10 mb-6 sm:mb-8" />

        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
          {/* Business Info / Logo */}
          <div className="space-y-2 max-w-sm">
            {invoice.business.logoUrl ? (
              <img 
                src={invoice.business.logoUrl} 
                alt="Business Logo" 
                className="h-12 w-auto object-contain max-w-[180px] rounded-md mb-2"
              />
            ) : null}

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {invoice.business.name || 'Your Company Name'}
            </h2>

            <div className="text-xs text-slate-600 space-y-1">
              {invoice.business.ownerName && (
                <p className="font-medium text-slate-700">{invoice.business.ownerName}</p>
              )}
              {invoice.business.address && (
                <p className="whitespace-pre-line text-slate-500">{invoice.business.address}</p>
              )}
              <div className="flex flex-wrap gap-x-3 text-slate-500">
                {invoice.business.email && <span>{invoice.business.email}</span>}
                {invoice.business.phone && <span>{invoice.business.phone}</span>}
              </div>
              {invoice.business.gstin && (
                <p className="font-mono text-[11px] text-blue-700 font-semibold pt-0.5">
                  GSTIN / TAX ID: {invoice.business.gstin}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Meta Card (Right) */}
          <div className="sm:text-right space-y-3 min-w-[200px]">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                TAX INVOICE
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono mt-0.5">
                {invoice.invoiceNumber || 'INV-001'}
              </h1>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-xs space-y-1.5 sm:text-right">
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-slate-500 font-medium">Issue Date:</span>
                <span className="font-semibold text-slate-800">{invoice.issueDate || '—'}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className={`font-semibold ${summary.isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                  {invoice.dueDate || '—'}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-slate-500 font-medium">Payment Terms:</span>
                <span className="font-semibold text-slate-800">{invoice.paymentTerms || 'Net 15'}</span>
              </div>
              {invoice.poNumber && (
                <div className="flex justify-between sm:justify-end gap-4">
                  <span className="text-slate-500 font-medium">PO Number:</span>
                  <span className="font-mono text-slate-800">{invoice.poNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Recipient Details */}
        <div className="py-6 border-b border-slate-200">
          <div className="bg-blue-50/40 rounded-xl p-4 sm:p-5 border border-blue-100 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Billed To
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {invoice.client.name || 'Client / Recipient Business Name'}
              </h3>
              {invoice.client.contactPerson && (
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  Attn: {invoice.client.contactPerson}
                </p>
              )}
              {invoice.client.address && (
                <p className="text-xs text-slate-500 whitespace-pre-line mt-1">
                  {invoice.client.address}
                </p>
              )}
            </div>

            <div className="sm:text-right text-xs text-slate-600 space-y-1">
              {invoice.client.email && (
                <p><span className="text-slate-400">Email:</span> {invoice.client.email}</p>
              )}
              {invoice.client.phone && (
                <p><span className="text-slate-400">Phone:</span> {invoice.client.phone}</p>
              )}
              {invoice.client.gstin && (
                <p className="font-mono text-[11px] text-slate-800 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                  Client GSTIN: {invoice.client.gstin}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-blue-600 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3">Item & Description</th>
                <th className="py-2.5 px-3 text-right w-16">Qty</th>
                <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                <th className="py-2.5 px-3 text-right w-20">Tax %</th>
                <th className="py-2.5 px-3 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No line items added yet. Click "+ Add Item" on the left form to add services or products.
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, index) => {
                  const calc = calculateItemAmounts(item);
                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{item.name || 'Untitled item'}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 whitespace-pre-line mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {calc.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(calc.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {calc.taxRate}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">
                        {formatCurrency(calc.lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown & Payment Details Section */}
        <div className="pt-4 pb-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Payment Instructions & Bank Details */}
          <div className="md:col-span-6 space-y-4 text-xs">
            {invoice.paymentDetails && (invoice.paymentDetails.bankName || invoice.paymentDetails.upiId) && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Payment Instructions</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  {invoice.paymentDetails.bankName && (
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Bank Name</span>
                      <span className="font-semibold text-slate-800">{invoice.paymentDetails.bankName}</span>
                    </div>
                  )}
                  {invoice.paymentDetails.accountHolder && (
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Account Holder</span>
                      <span className="font-semibold text-slate-800">{invoice.paymentDetails.accountHolder}</span>
                    </div>
                  )}
                  {invoice.paymentDetails.accountNumber && (
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Account Number</span>
                      <span className="font-mono font-semibold text-slate-800">{invoice.paymentDetails.accountNumber}</span>
                    </div>
                  )}
                  {invoice.paymentDetails.ifscOrSwift && (
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">IFSC / SWIFT</span>
                      <span className="font-mono font-semibold text-slate-800">{invoice.paymentDetails.ifscOrSwift}</span>
                    </div>
                  )}
                  {invoice.paymentDetails.upiId && (
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">UPI ID</span>
                      <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {invoice.paymentDetails.upiId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {invoice.paymentDetails?.notes && (
              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Notes
                </span>
                <p className="text-slate-500 whitespace-pre-line leading-relaxed">
                  {invoice.paymentDetails.notes}
                </p>
              </div>
            )}

            {invoice.termsAndConditions && (
              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Terms & Conditions
                </span>
                <p className="text-[11px] text-slate-400 whitespace-pre-line leading-relaxed">
                  {invoice.termsAndConditions}
                </p>
              </div>
            )}
          </div>

          {/* Right: Calculations Totals Box */}
          <div className="md:col-span-6 flex flex-col justify-end">
            <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(summary.subtotal, invoice.currency)}
                </span>
              </div>

              {summary.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span>
                    Discount {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}:
                  </span>
                  <span className="font-mono font-semibold">
                    -{formatCurrency(summary.discountAmount, invoice.currency)}
                  </span>
                </div>
              )}

              {/* Tax Breakdowns */}
              {invoice.taxMode === 'cgst_sgst' && summary.totalTax > 0 ? (
                <>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(summary.cgstAmount, invoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>SGST (9%):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatCurrency(summary.sgstAmount, invoice.currency)}
                    </span>
                  </div>
                </>
              ) : invoice.taxMode === 'igst' && summary.totalTax > 0 ? (
                <div className="flex justify-between items-center text-slate-600">
                  <span>IGST (18%):</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(summary.igstAmount, invoice.currency)}
                  </span>
                </div>
              ) : summary.totalTax > 0 ? (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Tax:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(summary.totalTax, invoice.currency)}
                  </span>
                </div>
              ) : null}

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-slate-900">
                <span className="text-sm font-extrabold uppercase tracking-wide">Grand Total:</span>
                <span className="text-lg sm:text-xl font-black font-mono text-blue-600">
                  {formatCurrency(summary.grandTotal, invoice.currency)}
                </span>
              </div>

              {/* Amount Paid & Due */}
              {summary.amountPaid > 0 && (
                <div className="flex justify-between items-center text-slate-500 pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatCurrency(summary.amountPaid, invoice.currency)}
                  </span>
                </div>
              )}

              <div className={`p-3 rounded-xl flex justify-between items-center ${
                summary.amountDue > 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-900'
              }`}>
                <span className="font-bold text-xs uppercase tracking-wider">
                  {summary.amountDue > 0 ? 'Amount Due:' : 'Paid in Full'}
                </span>
                <span className="font-mono font-extrabold text-base">
                  {formatCurrency(summary.amountDue, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Signature Line */}
        <div className="pt-8 border-t border-slate-200 mt-6 flex flex-col sm:flex-row justify-between items-end gap-4 text-slate-400 text-[11px]">
          <div>
            <p className="font-medium text-slate-500">Thank you for your business!</p>
            <p>Invoice generated electronically via Invoice_Generator.</p>
          </div>

          <div className="text-center sm:text-right">
            <div className="w-40 border-b border-slate-300 mb-1" />
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
              Authorized Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
