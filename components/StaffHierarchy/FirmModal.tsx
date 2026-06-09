import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function FirmModal({ mode, entity, onClose, onSaved, showToast }: any) {
  const [formData, setFormData] = useState({
    name: '', code: '', status: 'Active'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && entity) {
      setFormData({
        name: entity.name || '',
        code: entity.code || '',
        status: entity.status || 'Active'
      });
    } else {
      setFormData({ name: '', code: '', status: 'Active' });
    }
  }, [mode, entity]);

  const handleSave = async () => {
    if (!formData.name) {
      showToast('error', 'Firm name is required'); return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        await apiFetch('/firms/create', { method: 'POST', body: JSON.stringify(formData) });
      } else {
        await apiFetch(`/firms/${entity._id}`, { method: 'PUT', body: JSON.stringify(formData) });
      }
      showToast('success', `Firm ${mode === 'create' ? 'created' : 'updated'} successfully`);
      onSaved();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save firm');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{mode === 'create' ? 'Add Firm' : 'Edit Firm'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Firm Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder="Enter firm name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Firm Code (Optional)</label>
            <input type="text" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder="e.g. F-001" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
