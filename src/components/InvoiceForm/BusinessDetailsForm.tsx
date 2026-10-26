import React, { useRef } from 'react';
import { Building, Upload, Trash2, CheckCircle2, BookmarkCheck } from 'lucide-react';
import { BusinessDetails } from '../../types/invoice';
import { saveBusinessProfile } from '../../utils/invoiceStorage';
import { useToast } from '../Toast';

interface BusinessDetailsFormProps {
  business: BusinessDetails;
  onChange: (updated: BusinessDetails) => void;
  errors?: Record<string, string>;
}

export const BusinessDetailsForm: React.FC<BusinessDetailsFormProps> = ({
  business,
  onChange,
  errors = {},
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (field: keyof BusinessDetails, value: string) => {
    onChange({
      ...business,
      [field]: value,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, SVG).', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file size should be less than 2MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleFieldChange('logoUrl', event.target.result as string);
        showToast('Logo uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleFieldChange('logoUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Logo removed.', 'info');
  };

  const handleSaveAsDefault = () => {
    if (!business.name.trim()) {
      showToast('Please enter at least a business name before saving as default.', 'warning');
      return;
    }
    saveBusinessProfile(business);
    showToast('Business details saved as default for future invoices!', 'success');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Business Details</h3>
            <p className="text-xs text-slate-500">Your company information appearing on the invoice</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAsDefault}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          title="Save this business info as default for future invoices"
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Save as Default</span>
        </button>
      </div>

      {/* Logo Upload Section */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Business Logo (Optional)
        </label>
        <div className="flex items-center gap-4">
          {business.logoUrl ? (
            <div className="relative group border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center h-16 w-32">
              <img 
                src={business.logoUrl} 
                alt="Business Logo Preview" 
                className="max-h-12 max-w-full object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition-transform hover:scale-110"
                title="Remove logo"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-colors text-xs font-medium text-slate-600"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Upload Logo (PNG, JPG, SVG up to 2MB)</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Business Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Business / Company Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={business.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g. Acme Innovations Pvt. Ltd."
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors['business.name'] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {errors['business.name'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['business.name']}</p>
          )}
        </div>

        {/* Owner / Contact Person */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Contact Person / Owner
          </label>
          <input
            type="text"
            value={business.ownerName}
            onChange={(e) => handleFieldChange('ownerName', e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* GSTIN / Tax ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            GSTIN / Tax ID (Optional)
          </label>
          <input
            type="text"
            value={business.gstin || ''}
            onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
            placeholder="e.g. 29ABCDE1234F1Z5"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Business Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={business.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="billing@acme.com"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors['business.email'] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {errors['business.email'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['business.email']}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={business.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Business Address
          </label>
          <textarea
            rows={2}
            value={business.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="Street address, City, State, PIN / Postal code"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
