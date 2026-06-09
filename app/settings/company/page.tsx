'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Save, Building, Image as ImageIcon, Upload } from 'lucide-react';

function FirmBrandingCard({ firm, onSaved, showToast }: any) {
  const [name, setName] = useState(firm.name);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    firm.logo ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/v1/api', '')}${firm.logo}` : null
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update Name
      if (name !== firm.name) {
        await apiFetch(`/firms/${firm._id}`, {
          method: 'PUT',
          body: JSON.stringify({ name })
        });
      }

      // Update Logo
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const token = localStorage.getItem('wa_crm_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/firms/${firm._id}/logo`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to upload logo');
      }

      showToast('success', `${firm.name} branding updated successfully!`);
      setTimeout(() => {
        window.location.reload(); // Reload to update sidebar logo if it's the current firm
      }, 1500);
      
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Building className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{firm.name} <span className="text-xs text-gray-400 font-normal ml-2">({firm.code})</span></h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Firm Details</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Display Name</label>
          <div className="relative">
            <Building className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent focus:border-amber-300 transition-all"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">This name will be displayed in the sidebar and dashboard for all members of this firm.</p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Logo</label>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-300" />
              )}
              <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-5 h-5 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-3">Recommended size: 256x256px.<br/>PNG or JPG format.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all border border-transparent hover:border-gray-300"
              >
                Choose File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all disabled:opacity-50 shadow-sm shadow-amber-500/20"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}

export default function CompanyManagementPage() {
  const { staff } = useAuth();
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/firms');
      const allFirms = res.data || [];
      
      // Show all firms regardless of role, as requested by user
      setFirms(allFirms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirms();
  }, [staff]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  if (!staff) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Firm Branding</h2>
        <p className="text-sm text-gray-500 mt-0.5">Customize the display name and logo for all registered firms.</p>
      </div>

      {toast && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-3xl border border-gray-100 shadow-sm">
          Loading firms...
        </div>
      ) : firms.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <Building className="w-12 h-12 text-gray-200 mb-3" />
          No firms available to manage.
        </div>
      ) : (
        <div className="space-y-6">
          {firms.map(firm => (
            <FirmBrandingCard 
              key={firm._id} 
              firm={firm} 
              onSaved={fetchFirms} 
              showToast={showToast} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
