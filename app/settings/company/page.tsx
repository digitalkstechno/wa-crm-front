'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Save, Building, Image as ImageIcon, Upload, Globe, Key, Phone, FileText, Languages, Cpu } from 'lucide-react';

function FirmBrandingCard({ firm, onSaved, showToast }: any) {
  const [name, setName] = useState(firm.name);
  const [waApiDomain, setWaApiDomain] = useState(firm.waApiDomain || '');
  const [waApiVersion, setWaApiVersion] = useState(firm.waApiVersion || '');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState(firm.waPhoneNumberId || '');
  const [waAccessToken, setWaAccessToken] = useState(firm.waAccessToken || '');
  const [waTemplateId, setWaTemplateId] = useState(firm.waTemplateId || '');
  const [waTemplateLang, setWaTemplateLang] = useState(firm.waTemplateLang || '');
  const [waTemplateJson, setWaTemplateJson] = useState(firm.waTemplateJson || '');
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

  const placeholderGroups = [
    {
      title: "👤 Customer Placeholders",
      placeholders: [
        { label: "Name", value: "{customerName}" },
        { label: "Phone", value: "{customerPhone}" },
        { label: "Email", value: "{customerEmail}" },
      ]
    },
    {
      title: "🆔 Task Placeholders",
      placeholders: [
        { label: "ID", value: "{taskId}" },
        { label: "Title", value: "{taskTitle}" },
        { label: "Due Date", value: "{taskDueDate}" },
        { label: "Due Time", value: "{taskDueTime}" },
        { label: "Description", value: "{taskDescription}" },
      ]
    },
    {
      title: "⏰ Reminder Placeholders",
      placeholders: [
        { label: "Title", value: "{reminderTitle}" },
        { label: "Name", value: "{reminderName}" },
        { label: "Scheduled At", value: "{reminderScheduledAt}" },
        { label: "Custom Message", value: "{reminderCustomMessage}" },
      ]
    },
    {
      title: "🏢 Firm & Staff Placeholders",
      placeholders: [
        { label: "Firm Name", value: "{firmName}" },
        { label: "Staff Name", value: "{staffName}" },
        { label: "Staff Phone", value: "{staffPhone}" },
        { label: "Staff Email", value: "{staffEmail}" },
      ]
    },
    {
      title: "🎲 Meta Custom Variables",
      placeholders: [
        { label: "Template Body", value: "{templateBody}" },
        { label: "Random Code", value: "{randomCode}" },
      ]
    }
  ];

  const insertJsonPlaceholder = (val: string) => {
    const textarea = document.getElementById(`wa-template-json-textarea-${firm._id}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = waTemplateJson;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const newText = before + val + after;
    setWaTemplateJson(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + val.length, start + val.length);
    }, 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update Name and WhatsApp API settings
      if (
        name !== firm.name ||
        waApiDomain !== (firm.waApiDomain || '') ||
        waApiVersion !== (firm.waApiVersion || '') ||
        waPhoneNumberId !== (firm.waPhoneNumberId || '') ||
        waAccessToken !== (firm.waAccessToken || '') ||
        waTemplateId !== (firm.waTemplateId || '') ||
        waTemplateLang !== (firm.waTemplateLang || '') ||
        waTemplateJson !== (firm.waTemplateJson || '')
      ) {
        await apiFetch(`/firms/${firm._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            waApiDomain: waApiDomain || null,
            waApiVersion: waApiVersion || null,
            waPhoneNumberId: waPhoneNumberId || null,
            waAccessToken: waAccessToken || null,
            waTemplateId: waTemplateId || null,
            waTemplateLang: waTemplateLang || null,
            waTemplateJson: waTemplateJson || null
          })
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

      {/* WhatsApp Configuration Section */}
      <div className="border-t border-gray-100 p-6 md:p-8 bg-gray-50/30">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span>📱</span> WhatsApp Business API Settings
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WA API Domain</label>
            <div className="relative">
              <Globe className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={waApiDomain}
                onChange={e => setWaApiDomain(e.target.value)}
                placeholder="e.g. https://crmapi.crmbot.in"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent focus:border-amber-300 transition-all placeholder:text-gray-300"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">If blank, falls back to .env value.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WA API Version</label>
            <div className="relative">
              <Cpu className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={waApiVersion}
                onChange={e => setWaApiVersion(e.target.value)}
                placeholder="e.g. v19.0"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent focus:border-amber-300 transition-all placeholder:text-gray-300"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">If blank, falls back to .env value.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WA Phone Number ID</label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={waPhoneNumberId}
                onChange={e => setWaPhoneNumberId(e.target.value)}
                placeholder="e.g. 730141010176205"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent focus:border-amber-300 transition-all placeholder:text-gray-300"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">If blank, falls back to .env value.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WA Access Token</label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={waAccessToken}
                onChange={e => setWaAccessToken(e.target.value)}
                placeholder="Enter Access Token"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent focus:border-amber-300 transition-all placeholder:text-gray-300"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">If blank, falls back to .env value.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WA Template ID</label>
            <div className="relative">
              <FileText className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={waTemplateId}
                onChange={e => setWaTemplateId(e.target.value)}
                placeholder="e.g. order_data"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent focus:border-amber-300 transition-all placeholder:text-gray-300"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">If blank, falls back to .env value.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WA Template Language</label>
            <div className="relative">
              <Languages className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={waTemplateLang}
                onChange={e => setWaTemplateLang(e.target.value)}
                placeholder="e.g. en"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 border border-transparent focus:border-amber-300 transition-all placeholder:text-gray-300"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">If blank, falls back to .env value.</p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WA Template JSON Payload</label>
            <div className="relative">
              <textarea
                id={`wa-template-json-textarea-${firm._id}`}
                rows={10}
                value={waTemplateJson}
                onChange={e => setWaTemplateJson(e.target.value)}
                placeholder='Enter custom WhatsApp template components JSON object...'
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-xs font-mono outline-none border border-transparent focus:ring-2 focus:ring-amber-500/20 resize-y font-medium text-gray-700"
              />
            </div>
            <p className="text-[10px] text-gray-500">If blank, defaults to standard template payload configuration.</p>
            
            {/* Template Variables Helper Buttons */}
            <div className="space-y-3 mt-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 max-h-60 overflow-y-auto">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                Insert Variable Placeholders:
              </span>
              {placeholderGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest block">
                    {group.title}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.placeholders.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => insertJsonPlaceholder(p.value)}
                        className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-lg text-[9px] font-bold text-gray-700 hover:text-amber-700 transition-all shadow-sm"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Informational Meta WhatsApp JSON Note */}
            <div className="mt-4 p-5 bg-amber-50/30 border border-amber-100/50 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs">📱</span>
                <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Sample template JSON Configuration Note
                </h5>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Configure your template components below. The variables (like <code>{`{customerName}`}</code>) will be replaced dynamically on the backend before sending the API request.
              </p>
              <pre className="text-[9px] font-mono bg-white border border-gray-100 text-gray-700 p-3 rounded-xl overflow-x-auto max-h-48">
{`"template": {
  "language": {
    "policy": "deterministic",
    "code": "en"
  },
  "name": "order_data",
  "components": [
    {
      "type": "body",
      "parameters": [
        {
          "type": "text",
          "text": "VARIABLE_TEXT" // e.g. {customerName}
        },
        {
          "type": "text",
          "text": "VARIABLE_TEXT" // e.g. {randomCode}
        },
        {
          "type": "text",
          "text": "VARIABLE_TEXT" // e.g. {templateBody}
        }
      ]
    }
  ]
}`}
              </pre>
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
