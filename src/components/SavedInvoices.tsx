import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit3, 
  Copy, 
  Trash2, 
  Download, 
  Printer, 
  Plus, 
  FolderArchive, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  FileEdit,
  Grid,
  List,
  Sparkles,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../types/invoice';
import { calculateInvoiceSummary } from '../utils/invoiceCalculations';
import { formatCurrency } from '../utils/currencyFormatter';
import { exportInvoiceToPdf, printInvoice } from '../utils/pdfExport';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from './Toast';

interface SavedInvoicesProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onNewInvoice: () => void;
}

export const SavedInvoices: React.FC<SavedInvoicesProps> = ({
  invoices,
  onSelectInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onNewInvoice,
}) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Status badges config
  const statusBadges: Record<InvoiceStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    Paid: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    Pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
    Overdue: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: <AlertOctagon className="w-3.5 h-3.5" /> },
    Draft: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', icon: <FileEdit className="w-3.5 h-3.5" /> },
  };

  // Filter & Sort Logic
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Status filter
        if (statusFilter !== 'All' && inv.status !== statusFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = inv.invoiceNumber?.toLowerCase().includes(q);
          const matchClient = inv.client?.name?.toLowerCase().includes(q);
          const matchBusiness = inv.business?.name?.toLowerCase().includes(q);
          const matchPo = inv.poNumber?.toLowerCase().includes(q);
          return matchNumber || matchClient || matchBusiness || matchPo;
        }

        return true;
      })
      .sort((a, b) => {
        const sumA = calculateInvoiceSummary(a).grandTotal;
        const sumB = calculateInvoiceSummary(b).grandTotal;
        const dateA = new Date(a.issueDate || a.createdAt).getTime();
        const dateB = new Date(b.issueDate || b.createdAt).getTime();

        if (sortBy === 'date-desc') return dateB - dateA;
        if (sortBy === 'date-asc') return dateA - dateB;
        if (sortBy === 'amount-desc') return sumB - sumA;
        if (sortBy === 'amount-asc') return sumA - sumB;
        return 0;
      });
  }, [invoices, statusFilter, searchQuery, sortBy]);

  const handleDownload = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      exportInvoiceToPdf(inv);
      showToast(`Invoice ${inv.invoiceNumber} PDF downloaded!`, 'success');
    } catch (err) {
      showToast('Error exporting PDF', 'error');
    }
  };

  const handleDuplicate = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicateInvoice(inv);
    showToast(`Invoice duplicated! Generated new draft.`, 'success');
  };

  const handleDeletePrompt = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvoiceToDelete(inv);
  };

  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      onDeleteInvoice(invoiceToDelete.id);
      showToast(`Invoice ${invoiceToDelete.invoiceNumber} deleted.`, 'info');
      setInvoiceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderArchive className="w-6 h-6 text-blue-600" />
            <span>Saved Invoices</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
              {invoices.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, manage, duplicate, and export your invoices
          </p>
        </div>

        <button
          type="button"
          onClick={onNewInvoice}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Invoice</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, client name, business..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Sort selector & View Mode */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="date-desc">Newest Date</option>
                <option value="date-asc">Oldest Date</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>

            {/* Toggle Table / Grid */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid / Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {(['All', 'Paid', 'Pending', 'Overdue', 'Draft'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Display */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No invoices match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery || statusFilter !== 'All' 
              ? 'Try adjusting your search query or status filter.'
              : 'You have not saved any invoices yet. Create your first invoice now.'}
          </p>
          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInvoices.map((inv) => {
                  const summary = calculateInvoiceSummary(inv);
                  const badge = statusBadges[inv.status] || statusBadges.Draft;

                  return (
                    <tr 
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 group-hover:text-blue-800">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.client.name || 'Unnamed Client'}</div>
                        {inv.client.contactPerson && (
                          <div className="text-[11px] text-slate-400">{inv.client.contactPerson}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {inv.issueDate || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-medium ${summary.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {inv.dueDate || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text}`}>
                          {badge.icon}
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(summary.grandTotal, inv.currency)}
                        </div>
                        {summary.amountDue > 0 && summary.amountDue < summary.grandTotal && (
                          <div className="text-[10px] text-amber-600 font-medium font-mono">
                            Due: {formatCurrency(summary.amountDue, inv.currency)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onSelectInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownload(inv, e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDuplicate(inv, e)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePrompt(inv, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid / Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((inv) => {
            const summary = calculateInvoiceSummary(inv);
            const badge = statusBadges[inv.status] || statusBadges.Draft;

            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvoice(inv)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Number & Badge */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="font-mono font-bold text-blue-600 text-sm">
                      {inv.invoiceNumber}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text}`}>
                      {badge.icon}
                      {inv.status}
                    </span>
                  </div>

                  {/* Client & Date Info */}
                  <div className="py-3 space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {inv.client.name || 'Unnamed Client'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Date: {inv.issueDate || '—'}  •  Due: <span className={summary.isOverdue ? 'text-rose-600 font-bold' : ''}>{inv.dueDate || '—'}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {inv.items.length} line {inv.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Amount</span>
                    <span className="font-mono font-bold text-slate-900 text-base">
                      {formatCurrency(summary.grandTotal, inv.currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelectInvoice(inv)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownload(inv, e)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(inv, e)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePrompt(inv, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(invoiceToDelete)}
        title="Delete Invoice?"
        message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoiceNumber}" for "${invoiceToDelete?.client?.name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setInvoiceToDelete(null)}
      />
    </div>
  );
};
