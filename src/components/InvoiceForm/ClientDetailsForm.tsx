import React from 'react';
import { UserCheck } from 'lucide-react';
import { ClientDetails } from '../../types/invoice';

interface ClientDetailsFormProps {
  client: ClientDetails;
  onChange: (updated: ClientDetails) => void;
  errors?: Record<string, string>;
}

export const ClientDetailsForm: React.FC<ClientDetailsFormProps> = ({
  client,
  onChange,
  errors = {},
}) => {
  const handleFieldChange = (field: keyof ClientDetails, value: string) => {
    onChange({
      ...client,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Client Details</h3>
          <p className="text-xs text-slate-500">Who this invoice is being issued to</p>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client Business / Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Client / Business Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={client.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g. Zenith Global Ltd."
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors['client.name'] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {errors['client.name'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['client.name']}</p>
          )}
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Contact Person
          </label>
          <input
            type="text"
            value={client.contactPerson}
            onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* GSTIN / Tax ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Client GSTIN / Tax ID (Optional)
          </label>
          <input
            type="text"
            value={client.gstin || ''}
            onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
            placeholder="e.g. 27AADCS4128N1ZS"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Client Email Address
          </label>
          <input
            type="email"
            value={client.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="accounts@client.com"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
              errors['client.email'] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
          {errors['client.email'] && (
            <p className="text-[11px] text-rose-600 mt-1">{errors['client.email']}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Client Phone Number
          </label>
          <input
            type="text"
            value={client.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="+91 91234 56789"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Billing Address
          </label>
          <textarea
            rows={2}
            value={client.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="Billing address, City, State, Country, Postal Code"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
