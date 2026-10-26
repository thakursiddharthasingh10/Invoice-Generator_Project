import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { InvoiceForm } from './components/InvoiceForm/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { VoiceGenerator } from './components/VoiceGenerator';
import { SavedInvoices } from './components/SavedInvoices';
import { ToastProvider, useToast } from './components/Toast';
import { Invoice } from './types/invoice';
import { 
  getSavedInvoices, 
  saveInvoice, 
  deleteInvoiceById, 
  duplicateInvoice, 
  createBlankInvoice,
  resetToDemoData
} from './utils/invoiceStorage';
import { exportInvoiceToPdf, printInvoice } from './utils/pdfExport';
import { Edit3, Eye, Volume2 } from 'lucide-react';

function InvoiceApp() {
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Mobile / Tablet workspace sub-tab: 'form' | 'preview' | 'voice'
  const [workspaceTab, setWorkspaceTab] = useState<'form' | 'preview' | 'voice'>('form');

  // Load invoices on mount
  useEffect(() => {
    const loaded = getSavedInvoices();
    setInvoices(loaded);
    if (loaded.length > 0) {
      setCurrentInvoice(loaded[0]);
    } else {
      const blank = createBlankInvoice([]);
      setCurrentInvoice(blank);
    }
  }, []);

  const handleNewInvoice = () => {
    const blank = createBlankInvoice(invoices);
    setCurrentInvoice(blank);
    setActiveTab('editor');
    setWorkspaceTab('form');
    showToast(`Created new invoice draft: ${blank.invoiceNumber}`, 'info');
  };

  const handleSaveInvoice = (invoiceToSave: Invoice) => {
    const result = saveInvoice(invoiceToSave);
    if (result.success) {
      setInvoices(result.updatedList);
      setCurrentInvoice(invoiceToSave);
      showToast(`Invoice ${invoiceToSave.invoiceNumber} saved successfully!`, 'success');
    } else {
      showToast('Failed to save invoice. Please check browser storage.', 'error');
    }
  };

  const handleDuplicateInvoice = (invoiceToDuplicate: Invoice) => {
    const duplicated = duplicateInvoice(invoiceToDuplicate, invoices);
    const result = saveInvoice(duplicated);
    setInvoices(result.updatedList);
    setCurrentInvoice(duplicated);
    setActiveTab('editor');
    setWorkspaceTab('form');
    showToast(`Duplicated invoice as ${duplicated.invoiceNumber}!`, 'success');
  };

  const handleDeleteInvoice = (id: string) => {
    const result = deleteInvoiceById(id);
    setInvoices(result.updatedList);
    if (currentInvoice?.id === id) {
      if (result.updatedList.length > 0) {
        setCurrentInvoice(result.updatedList[0]);
      } else {
        setCurrentInvoice(createBlankInvoice([]));
      }
    }
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setActiveTab('editor');
    setWorkspaceTab('form');
  };

  const handleResetDemo = () => {
    const demo = resetToDemoData();
    setInvoices(demo);
    setCurrentInvoice(demo[0]);
  };

  const handleDownloadPdf = () => {
    if (!currentInvoice) return;
    try {
      exportInvoiceToPdf(currentInvoice);
      showToast(`Invoice ${currentInvoice.invoiceNumber} downloaded as PDF!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Could not generate PDF. Please ensure all details are valid.', 'error');
    }
  };

  const handlePrint = () => {
    printInvoice();
  };

  return (
    <div className="min-h-screen bg-[#F5F8FD] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewInvoice={handleNewInvoice}
        savedInvoicesCount={invoices.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard
            invoices={invoices}
            onNewInvoice={handleNewInvoice}
            onSelectInvoice={handleSelectInvoice}
            onViewAllInvoices={() => setActiveTab('saved')}
            onResetDemo={handleResetDemo}
          />
        )}

        {/* View 2: Saved Invoices */}
        {activeTab === 'saved' && (
          <SavedInvoices
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            onDuplicateInvoice={handleDuplicateInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onNewInvoice={handleNewInvoice}
          />
        )}

        {/* View 3: Invoice Studio (Main Workspace with Form & Live Preview) */}
        {activeTab === 'editor' && currentInvoice && (
          <div className="space-y-4">
            {/* Mobile / Tablet Segmented Sub-Navigation */}
            <div className="lg:hidden flex items-center justify-center p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-4">
              <button
                type="button"
                onClick={() => setWorkspaceTab('form')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  workspaceTab === 'form'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Form Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceTab('preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  workspaceTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Live Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceTab('voice')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  workspaceTab === 'voice'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Voice TTS</span>
              </button>
            </div>

            {/* Desktop Two-Column Professional Layout (Section 3C) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Editor */}
              <div className={`lg:col-span-6 space-y-6 ${workspaceTab !== 'form' ? 'hidden lg:block' : ''}`}>
                <InvoiceForm
                  invoice={currentInvoice}
                  onChange={setCurrentInvoice}
                  onSave={handleSaveInvoice}
                  onDuplicate={handleDuplicateInvoice}
                  onReset={handleNewInvoice}
                  onDownloadPdf={handleDownloadPdf}
                  onPrint={handlePrint}
                  onVoiceTrigger={() => setWorkspaceTab('voice')}
                />
              </div>

              {/* Right Column: Live Invoice Preview & Voice Panel */}
              <div className={`lg:col-span-6 space-y-6 ${
                workspaceTab === 'form' ? 'hidden lg:block' : ''
              }`}>
                {/* Voice Generator Panel */}
                <div className={workspaceTab === 'preview' ? 'hidden lg:block' : ''}>
                  <VoiceGenerator invoice={currentInvoice} />
                </div>

                {/* Live Invoice Preview Document */}
                <div className={workspaceTab === 'voice' ? 'hidden lg:block' : ''}>
                  <InvoicePreview
                    invoice={currentInvoice}
                    onVoiceTrigger={() => setWorkspaceTab('voice')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer (Section 2 & 7) */}
      <footer className="no-print mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-700">Invoice_Generator</span>
            <span>•</span>
            <span>Professional Business Invoicing & TTS Speech Synthesis</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Client-side Storage</span>
            <span>•</span>
            <span>PDF Vector Engine</span>
            <span>•</span>
            <span>Print Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <InvoiceApp />
    </ToastProvider>
  );
}
