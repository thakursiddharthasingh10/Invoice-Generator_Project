import React, { useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  Copy, 
  Download, 
  Printer, 
  Volume2, 
  CheckCircle2, 
  AlertCircle,
  Building,
  UserCheck,
  Calendar,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { Invoice } from '../../types/invoice';
import { BusinessDetailsForm } from './BusinessDetailsForm';
import { ClientDetailsForm } from './ClientDetailsForm';
import { InvoiceMetaForm } from './InvoiceMetaForm';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceSummaryForm } from './InvoiceSummaryForm';
import { validateInvoice, ValidationError } from '../../utils/invoiceValidation';
import { useToast } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';
import confetti from 'canvas-confetti';

interface InvoiceFormProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  onSave: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onReset: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onVoiceTrigger?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onChange,
  onSave,
  onDuplicate,
  onReset,
  onDownloadPdf,
  onPrint,
  onVoiceTrigger,
}) => {
  const { showToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'business' | 'client' | 'meta' | 'items' | 'summary'>('all');

  const handleUpdate = (partial: Partial<Invoice>) => {
    onChange({
      ...invoice,
      ...partial,
    });
  };

  const handleSaveClick = () => {
    const validation = validateInvoice(invoice);
    if (!validation.isValid) {
      const errMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errMap[err.field] = err.message;
      });
      setErrors(errMap);
      showToast(`Please correct the ${validation.errors.length} highlighted error(s) before saving.`, 'error');
      return;
    }

    setErrors({});
    onSave(invoice);

    // If marked as paid, trigger celebration confetti!
    if (invoice.status === 'Paid') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="space-y-5">
      {/* Top Form Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Invoice Studio
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {invoice.invoiceNumber || 'INV-001'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(invoice)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Duplicate as new invoice"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl text-xs transition-colors"
            title="Clear & create blank invoice"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {errorCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Please resolve the following before saving:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700">
              {Object.values(errors).slice(0, 4).map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Form Sections */}
      <div className="space-y-5">
        {/* 1. Invoice Meta Info */}
        <InvoiceMetaForm
          invoice={invoice}
          onChange={handleUpdate}
          errors={errors}
        />

        {/* 2. Business Details */}
        <BusinessDetailsForm
          business={invoice.business}
          onChange={(biz) => handleUpdate({ business: biz })}
          errors={errors}
        />

        {/* 3. Client Details */}
        <ClientDetailsForm
          client={invoice.client}
          onChange={(cli) => handleUpdate({ client: cli })}
          errors={errors}
        />

        {/* 4. Dynamic Line Items Table */}
        <InvoiceItemsTable
          items={invoice.items}
          currency={invoice.currency}
          onChange={(items) => handleUpdate({ items })}
          errors={errors}
        />

        {/* 5. Discounts, Taxes, Bank & Notes */}
        <InvoiceSummaryForm
          invoice={invoice}
          onChange={handleUpdate}
          errors={errors}
        />
      </div>

      {/* Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time preview synchronized</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save & Finalize Invoice</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Invoice Form?"
        message="This will clear current entries and generate a new blank invoice. Any unsaved modifications to this invoice will be lost."
        confirmLabel="Yes, Reset"
        cancelLabel="Keep Editing"
        isDestructive={true}
        onConfirm={() => {
          setShowResetConfirm(false);
          setErrors({});
          onReset();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
