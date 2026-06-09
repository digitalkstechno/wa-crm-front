import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function TeamModal({ mode, entity, parentOpts, managers, staffList = [], onClose, onSaved, showToast }: any) {
  const [formData, setFormData] = useState({
    teamName: '', teamCode: '', managerId: parentOpts?.managerId || '', teamLeadId: '', description: '', status: 'Active', firmId: parentOpts?.firmId || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && entity) {
      setFormData({
        teamName: entity.teamName || '',
        teamCode: entity.teamCode || '',
        managerId: entity.managerId || '',
        teamLeadId: entity.teamLeadId || '',
        description: entity.description || '',
        status: entity.status || 'Active',
        firmId: entity.firmId || parentOpts?.firmId || ''
      });
    }
  }, [mode, entity, parentOpts]);

  const handleSave = async () => {
    if (!formData.teamName) {
      showToast('error', 'Team name is required'); return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        await apiFetch('/teams/create', { method: 'POST', body: JSON.stringify(formData) });
      } else {
        await apiFetch(`/teams/${entity._id}`, { method: 'PUT', body: JSON.stringify(formData) });
      }
      showToast('success', `Team ${mode === 'create' ? 'created' : 'updated'} successfully`);
      onSaved();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{mode === 'create' ? 'Add Team' : 'Edit Team'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Name</label>
            <input type="text" value={formData.teamName} onChange={e => setFormData(p => ({ ...p, teamName: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" placeholder="e.g. Sales Team Alpha" />
          </div>
          {mode === 'edit' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Code</label>
              <input type="text" value={formData.teamCode} readOnly className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-sm outline-none text-gray-500 cursor-not-allowed border border-transparent" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manager</label>
            <select value={formData.managerId} onChange={e => setFormData(p => ({ ...p, managerId: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all">
              <option value="">No Manager</option>
              {managers.map((m: any) => (
                <option key={m._id} value={m._id}>{m.fullName}</option>
              ))}
            </select>
          </div>
          {mode === 'edit' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Leader</label>
              <select value={formData.teamLeadId} onChange={e => setFormData(p => ({ ...p, teamLeadId: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all">
                <option value="">No Team Leader</option>
                {staffList.filter((s: any) => s.teamId === entity?._id && s.roleType === 'Member').map((m: any) => (
                  <option key={m._id} value={m._id}>{m.fullName}</option>
                ))}
              </select>
            </div>
          )}
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
