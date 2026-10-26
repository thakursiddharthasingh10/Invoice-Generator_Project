import React from 'react';
import { Plus, Trash2, ShoppingBag, Sparkles, AlertCircle } from 'lucide-react';
import { InvoiceItem } from '../../types/invoice';
import { generateItemId } from '../../utils/invoiceNumberGenerator';
import { calculateItemAmounts } from '../../utils/invoiceCalculations';
import { formatCurrency } from '../../utils/currencyFormatter';

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  currency: string;
  onChange: (items: InvoiceItem[]) => void;
  errors?: Record<string, string>;
}

const PRESET_SERVICES = [
  { name: 'Web Application Development', desc: 'Custom frontend & backend development with API integration', price: 45000, tax: 18 },
  { name: 'UI/UX Design & Wireframing', desc: 'Design system, interactive prototypes and responsive layouts', price: 25000, tax: 18 },
  { name: 'Cloud Infrastructure & DevOps', desc: 'Docker, Kubernetes, CI/CD pipeline automation & monitoring', price: 30000, tax: 18 },
  { name: 'Technical Consultation & Audit', desc: 'Codebase review, security audit and architecture planning', price: 15000, tax: 18 },
];

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
  currency,
  onChange,
  errors = {},
}) => {
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: generateItemId(),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 18,
    };
    onChange([...items, newItem]);
  };

  const handleAddPreset = (preset: typeof PRESET_SERVICES[0]) => {
    const newItem: InvoiceItem = {
      id: generateItemId(),
      name: preset.name,
      description: preset.desc,
      quantity: 1,
      unitPrice: preset.price,
      taxRate: preset.tax,
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Line Items & Services</h3>
            <p className="text-xs text-slate-500">Products or services delivered to the client</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Preset Quick-Add Chips */}
      <div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Quick Add Template Services
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_SERVICES.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(p)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/70 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items list / table */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
            <p className="text-xs text-slate-500">No items added yet.</p>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Line Item</span>
            </button>
          </div>
        ) : (
          items.map((item, index) => {
            const calc = calculateItemAmounts(item);
            const nameError = errors[`items.${index}.name`];
            const qtyError = errors[`items.${index}.quantity`];
            const priceError = errors[`items.${index}.unitPrice`];
            const taxError = errors[`items.${index}.taxRate`];

            return (
              <div 
                key={item.id || index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
              >
                {/* Row Header: Item number & Remove */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    #{index + 1} Line Item
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove this item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Primary item row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Item Name */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Service / Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="e.g. Website Redesign"
                      className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                        nameError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {nameError && <p className="text-[10px] text-rose-600 mt-0.5">{nameError}</p>}
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                        qtyError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {qtyError && <p className="text-[10px] text-rose-600 mt-0.5">{qtyError}</p>}
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                        priceError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    {priceError && <p className="text-[10px] text-rose-600 mt-0.5">{priceError}</p>}
                  </div>

                  {/* Tax Rate % */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tax Rate (%)
                    </label>
                    <select
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18% (Standard GST)</option>
                      <option value="28">28%</option>
                    </select>
                    {taxError && <p className="text-[10px] text-rose-600 mt-0.5">{taxError}</p>}
                  </div>
                </div>

                {/* Optional description */}
                <div>
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description, scope of work, or specifications (optional)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200/80 text-xs text-slate-600 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Calculation breakdown strip for this item */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-200/60 text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>Taxable: <strong className="font-mono text-slate-700">{formatCurrency(calc.taxableAmount, currency)}</strong></span>
                    <span>Tax ({calc.taxRate}%): <strong className="font-mono text-slate-700">{formatCurrency(calc.taxAmount, currency)}</strong></span>
                  </div>
                  <div className="text-right">
                    <span>Line Total: <strong className="font-mono text-slate-900 font-bold text-sm">{formatCurrency(calc.lineTotal, currency)}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {errors['items'] && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errors['items']}</span>
        </div>
      )}
    </div>
  );
};
