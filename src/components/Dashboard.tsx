import React from 'react';
import { 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Plus, 
  ArrowRight, 
  TrendingUp,
  Receipt,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Invoice } from '../types/invoice';
import { calculateInvoiceSummary } from '../utils/invoiceCalculations';
import { formatCurrency } from '../utils/currencyFormatter';
import { resetToDemoData } from '../utils/invoiceStorage';
import { useToast } from './Toast';

interface DashboardProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onViewAllInvoices: () => void;
  onResetDemo: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  onNewInvoice,
  onSelectInvoice,
  onViewAllInvoices,
  onResetDemo,
}) => {
  const { showToast } = useToast();

  // Aggregate stats
  const stats = React.useMemo(() => {
    let totalInvoices = invoices.length;
    let totalInvoicedAmount = 0;
    let paidCount = 0;
    let paidAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    invoices.forEach((inv) => {
      const summary = calculateInvoiceSummary(inv);
      totalInvoicedAmount += summary.grandTotal;

      if (inv.status === 'Paid') {
        paidCount++;
        paidAmount += summary.grandTotal;
      } else if (summary.isOverdue || inv.status === 'Overdue') {
        overdueCount++;
        overdueAmount += summary.amountDue;
      } else {
        pendingCount++;
        pendingAmount += summary.amountDue;
      }
    });

    const collectionRate = totalInvoicedAmount > 0 
      ? Math.round((paidAmount / totalInvoicedAmount) * 100) 
      : 0;

    return {
      totalInvoices,
      totalInvoicedAmount,
      paidCount,
      paidAmount,
      pendingCount,
      pendingAmount,
      overdueCount,
      overdueAmount,
      collectionRate,
    };
  }, [invoices]);

  const recentInvoices = invoices.slice(0, 5);

  const handleResetToDemo = () => {
    onResetDemo();
    showToast('Loaded sample demo invoice into dashboard.', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Primary CTA Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Smart Invoicing & Voice Synthesis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Create, Calculate & Narrate Professional Invoices
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Auto-calculate Indian GST, IGST, and itemized totals in real time. Generate spoken audio narrations and export crisp vector A4 PDFs in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNewInvoice}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Invoice</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDemo}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-medium text-xs sm:text-sm backdrop-blur-md transition-colors"
              title="Reset sample data"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Demo Sample</span>
            </button>
          </div>
        </div>

        {/* Subtle Decorative Geometry */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Summary Statistics Cards (Section 3B) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoiced Amount */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(stats.totalInvoicedAmount, 'INR')}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Across {stats.totalInvoices} created invoices</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Invoices Created */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Invoices Created
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {stats.totalInvoices}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span>{stats.paidCount} paid • {stats.pendingCount + stats.overdueCount} outstanding</span>
            </div>
          </div>
        </div>

        {/* Card 3: Paid Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Paid Invoices
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
              {formatCurrency(stats.paidAmount, 'INR')}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{stats.paidCount} invoices settled</span>
              <span className="font-bold text-emerald-700">{stats.collectionRate}% rate</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${stats.collectionRate}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Card 4: Pending / Overdue Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending & Overdue
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              stats.overdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {stats.overdueCount > 0 ? <AlertOctagon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(stats.pendingAmount + stats.overdueAmount, 'INR')}
            </div>
            <div className="text-xs mt-1 flex items-center justify-between">
              <span className="text-amber-700 font-medium">{stats.pendingCount} pending</span>
              {stats.overdueCount > 0 && (
                <span className="text-rose-600 font-bold">{stats.overdueCount} overdue</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Invoices</h2>
            <p className="text-xs text-slate-500">Quickly resume editing or previewing your recent invoices</p>
          </div>
          <button
            type="button"
            onClick={onViewAllInvoices}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>View All ({invoices.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No invoices yet. Click "+ Create New Invoice" to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentInvoices.map((inv) => {
              const summary = calculateInvoiceSummary(inv);

              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (inv.status === 'Paid') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              else if (inv.status === 'Pending') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              else if (inv.status === 'Overdue') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      INV
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {inv.client.name || 'Unnamed Client'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {inv.invoiceNumber} • {inv.issueDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 text-sm sm:text-base">
                        {formatCurrency(summary.grandTotal, inv.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {summary.amountDue > 0 ? `Due: ${formatCurrency(summary.amountDue, inv.currency)}` : 'Settled'}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
