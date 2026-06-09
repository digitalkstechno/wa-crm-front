import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function ManagerModal({ mode, entity, parentOpts, admins = [], onClose, onSaved, showToast }: any) {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', department: '', status: 'Active', firmId: parentOpts?.firmId || '', parentId: parentOpts?.parentId || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && entity) {
      setFormData({
        fullName: entity.fullName || '',
        email: entity.email || '',
        phone: entity.phone || '+91 ',
        password: '',
        department: entity.department || '',
        status: entity.status || 'Active',
        firmId: entity.firmId || parentOpts?.firmId || '',
        parentId: entity.parentId || parentOpts?.parentId || ''
      });
    } else {
      setFormData({ fullName: '', email: '', phone: '+91 ', password: '', department: '', status: 'Active', firmId: parentOpts?.firmId || '', parentId: parentOpts?.parentId || '' });
    }
  }, [mode, entity, parentOpts]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (digits.startsWith('91')) {
      digits = digits.substring(2);
    }
    digits = digits.substring(0, 10);
    
    let formatted = '+91 ';
    if (digits.length > 5) {
      formatted += digits.substring(0, 5) + ' ' + digits.substring(5);
    } else if (digits.length > 0) {
      formatted += digits;
    }
    
    setFormData(p => ({ ...p, phone: formatted }));
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) {
      showToast('error', 'Name and email are required'); return;
    }
    setSaving(true);
    try {
      const payload: any = { ...formData, roleType: 'Manager' };
      if (!payload.password) delete payload.password;

      if (mode === 'create') {
        await apiFetch('/staff/create', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/staff/${entity._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      showToast('success', `Manager ${mode === 'create' ? 'created' : 'updated'} successfully`);
      onSaved();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save manager');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{mode === 'create' ? 'Add Manager' : 'Edit Manager'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
            <input type="text" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder="Enter full name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder="name@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
            <input type="tel" value={formData.phone} onChange={handlePhoneChange} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder="+91 xxxxx xxxxx" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</label>
            <input type="text" value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder="e.g. Sales" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin</label>
            <select value={formData.parentId} onChange={e => setFormData(p => ({ ...p, parentId: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all">
              <option value="">No Admin</option>
              {admins.map((a: any) => (
                <option key={a._id} value={a._id}>{a.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mode === 'create' ? 'Password' : 'New Password (Optional)'}</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder={mode === 'create' ? "Min 6 characters" : "Leave blank to keep current"} />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}
