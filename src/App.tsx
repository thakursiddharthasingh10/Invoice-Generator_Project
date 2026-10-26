import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { InvoiceForm } from './components/InvoiceForm/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { VoiceGenerator } from './components/VoiceGenerator';
import { SavedInvoices } from './components/SavedInvoices';
import { AuthScreen } from './components/Auth/AuthScreen';
import { ToastProvider, useToast } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Invoice } from './types/invoice';
import { api } from './services/api';
import { createBlankInvoice } from './utils/invoiceStorage';
import { exportInvoiceToPdf, printInvoice } from './utils/pdfExport';
import { Edit3, Eye, Volume2, Loader2, Receipt } from 'lucide-react';

function InvoiceAppContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFetchingInvoices, setIsFetchingInvoices] = useState<boolean>(false);
  
  // Mobile / Tablet workspace sub-tab: 'form' | 'preview' | 'voice'
  const [workspaceTab, setWorkspaceTab] = useState<'form' | 'preview' | 'voice'>('form');

  // Fetch invoices from database whenever user logs in
  const loadInvoicesFromDb = useCallback(async () => {
    if (!isAuthenticated) {
      setInvoices([]);
      setCurrentInvoice(null);
      return;
    }

    try {
      setIsFetchingInvoices(true);
      const data = await api.invoices.list();
      setInvoices(data);

      if (data.length > 0) {
        setCurrentInvoice(data[0]);
      } else {
        // Create an initial fresh blank invoice for this user
        const blank = createBlankInvoice([]);
        if (user?.businessProfile) {
          blank.business = { ...user.businessProfile };
        } else if (user?.fullName) {
          blank.business.ownerName = user.fullName;
          blank.business.email = user.email;
        }
        setCurrentInvoice(blank);
      }
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      showToast(err.message || 'Failed to load invoices from database.', 'error');
    } finally {
      setIsFetchingInvoices(false);
    }
  }, [isAuthenticated, user, showToast]);

  useEffect(() => {
    loadInvoicesFromDb();
  }, [loadInvoicesFromDb]);

  const handleNewInvoice = () => {
    const blank = createBlankInvoice(invoices);
    if (user?.businessProfile) {
      blank.business = { ...user.businessProfile };
    } else if (user?.fullName) {
      blank.business.ownerName = user.fullName;
      blank.business.email = user.email;
    }
    setCurrentInvoice(blank);
    setActiveTab('editor');
    setWorkspaceTab('form');
    showToast(`Created new invoice draft: ${blank.invoiceNumber}`, 'info');
  };

  const handleSaveInvoice = async (invoiceToSave: Invoice) => {
    try {
      const isExisting = invoices.some(i => i.id === invoiceToSave.id);
      let saved: Invoice;

      if (isExisting) {
        saved = await api.invoices.update(invoiceToSave.id, invoiceToSave);
        setInvoices(prev => prev.map(inv => inv.id === saved.id ? saved : inv));
        showToast(`Invoice ${saved.invoiceNumber} updated in database!`, 'success');
      } else {
        saved = await api.invoices.create(invoiceToSave);
        setInvoices(prev => [saved, ...prev]);
        showToast(`Invoice ${saved.invoiceNumber} saved to database!`, 'success');
      }

      setCurrentInvoice(saved);
    } catch (err: any) {
      console.error('Failed to save invoice:', err);
      showToast(err.message || 'Error saving invoice to database.', 'error');
    }
  };

  const handleDuplicateInvoice = async (invoiceToDuplicate: Invoice) => {
    try {
      const duplicated = await api.invoices.duplicate(invoiceToDuplicate.id);
      setInvoices(prev => [duplicated, ...prev]);
      setCurrentInvoice(duplicated);
      setActiveTab('editor');
      setWorkspaceTab('form');
      showToast(`Duplicated as new invoice: ${duplicated.invoiceNumber}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate invoice.', 'error');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.invoices.delete(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      
      if (currentInvoice?.id === id) {
        const remaining = invoices.filter(i => i.id !== id);
        if (remaining.length > 0) {
          setCurrentInvoice(remaining[0]);
        } else {
          handleNewInvoice();
        }
      }
      showToast('Invoice deleted from database.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete invoice.', 'error');
    }
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setActiveTab('editor');
    setWorkspaceTab('form');
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

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F8FD] flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 animate-pulse">
          <Receipt className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Restoring secure session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Authentication Portal (Protected Route Guard)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F8FD] flex flex-col font-sans">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                Invoice<span className="text-blue-600">_Generator</span>
              </span>
            </div>
            <div className="text-xs font-medium text-slate-500">
              Secure Multi-User Invoicing
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <AuthScreen />
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
          Invoice_Generator • Protected Application • Encrypted Authentication
        </footer>
      </div>
    );
  }

  // Authenticated Application Workspace
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
        {/* Loading invoices spinner */}
        {isFetchingInvoices && invoices.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading your private invoices from database...</span>
          </div>
        ) : (
          <>
            {/* View 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <Dashboard
                invoices={invoices}
                onNewInvoice={handleNewInvoice}
                onSelectInvoice={handleSelectInvoice}
                onViewAllInvoices={() => setActiveTab('saved')}
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

                {/* Desktop Two-Column Layout */}
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-700">Invoice_Generator</span>
            <span>•</span>
            <span>Authenticated User: {user?.fullName} ({user?.email})</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SQLite Database Persistence</span>
            <span>•</span>
            <span>Row-Level Ownership</span>
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
      <AuthProvider>
        <InvoiceAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
