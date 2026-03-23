'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Save, Eye, EyeOff, Check, Layers, Plus, Pencil, Trash2, GripVertical, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

type Tab = 'profile' | 'password' | 'task-statuses';
type Toast = { type: 'success' | 'error'; message: string } | null;

interface TaskStatus {
  _id: string;
  name: string;
  color: string;
  order: number;
}

const PRESET_COLORS = [
  '#6b7280', '#3b82f6', '#10b981', '#ef4444',
  '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#06b6d4',
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Task statuses state
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [statusForm, setStatusForm] = useState({ name: '', color: '#6b7280' });
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Drag state for reorder
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    apiFetch('/staff/me').then(res => {
      const d = res.data;
      setProfile({ fullName: d.fullName || '', email: d.email || '', phone: d.phone || '' });
    }).catch(() => {
      if (user) setProfile({ fullName: user.fullName || '', email: user.email || '', phone: '' });
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'task-statuses') fetchStatuses();
  }, [activeTab]);

  const fetchStatuses = async () => {
    try {
      const res = await apiFetch('/task-statuses');
      setStatuses(res.data || []);
    } catch (e) { console.error(e); }
  };

  const handleProfileSave = async () => {
    if (!profile.fullName.trim() || !profile.email.trim()) { showToast('error', 'Name and email are required'); return; }
    setSavingProfile(true);
    try {
      await apiFetch('/staff/me', { method: 'PUT', body: JSON.stringify({ fullName: profile.fullName, email: profile.email, phone: profile.phone }) });
      showToast('success', 'Profile updated successfully');
    } catch (err: any) { showToast('error', err.message || 'Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) { showToast('error', 'All password fields are required'); return; }
    if (passwords.newPass !== passwords.confirm) { showToast('error', 'New passwords do not match'); return; }
    if (passwords.newPass.length < 6) { showToast('error', 'Password must be at least 6 characters'); return; }
    setSavingPassword(true);
    try {
      await apiFetch('/staff/me', { method: 'PUT', body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }) });
      showToast('success', 'Password changed successfully');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err: any) { showToast('error', err.message || 'Failed to change password'); }
    finally { setSavingPassword(false); }
  };

  const openCreateStatus = () => { setEditingStatus(null); setStatusForm({ name: '', color: '#6b7280' }); setShowStatusForm(true); };
  const openEditStatus = (s: TaskStatus) => { setEditingStatus(s); setStatusForm({ name: s.name, color: s.color }); setShowStatusForm(true); };

  const handleStatusSave = async () => {
    if (!statusForm.name.trim()) return;
    setSavingStatus(true);
    try {
      if (editingStatus) {
        const res = await apiFetch(`/task-statuses/${editingStatus._id}`, { method: 'PUT', body: JSON.stringify(statusForm) });
        setStatuses(prev => prev.map(s => s._id === editingStatus._id ? res.data : s));
      } else {
        const res = await apiFetch('/task-statuses', { method: 'POST', body: JSON.stringify(statusForm) });
        setStatuses(prev => [...prev, res.data]);
      }
      setShowStatusForm(false);
      showToast('success', editingStatus ? 'Status updated' : 'Status created');
    } catch (err: any) { showToast('error', err.message || 'Failed to save status'); }
    finally { setSavingStatus(false); }
  };

  const handleStatusDelete = async (id: string) => {
    try {
      await apiFetch(`/task-statuses/${id}`, { method: 'DELETE' });
      setStatuses(prev => prev.filter(s => s._id !== id));
      showToast('success', 'Status deleted');
    } catch (err: any) { showToast('error', err.message || 'Failed to delete'); }
  };

  // Drag to reorder
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const reordered = [...statuses];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, order: i }));
    setStatuses(updated);
    dragItem.current = null;
    dragOver.current = null;
    try {
      await apiFetch('/task-statuses/reorder', { method: 'PUT', body: JSON.stringify({ statuses: updated.map(s => ({ _id: s._id, order: s.order })) }) });
    } catch (e) { fetchStatuses(); }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Change Password', icon: Lock },
    { key: 'task-statuses', label: 'Task Statuses', icon: Layers },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and app configuration</p>
      </div>

      {toast && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key ? 'text-emerald-600 border-emerald-500' : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                  {profile.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{profile.fullName || 'Your Name'}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input type="text" value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300" />
              </div>
              <button onClick={handleProfileSave} disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-5 max-w-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password"
                    className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300" />
                  <button onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={passwords.newPass}
                    onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300" />
                  <button onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                <div className="relative">
                  <input type="password" value={passwords.confirm}
                    onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password"
                    className={`w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 border ${
                      passwords.confirm && passwords.newPass !== passwords.confirm
                        ? 'border-red-300 bg-red-50 focus:ring-red-500/20'
                        : passwords.confirm && passwords.newPass === passwords.confirm
                        ? 'border-emerald-300 focus:ring-emerald-500/20'
                        : 'border-transparent focus:ring-emerald-500/20 focus:border-emerald-300'
                    }`} />
                  {passwords.confirm && passwords.newPass === passwords.confirm && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
                {passwords.confirm && passwords.newPass !== passwords.confirm && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
              <button onClick={handlePasswordSave} disabled={savingPassword}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-50">
                <Lock className="w-4 h-4" />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}

          {/* Task Statuses Tab */}
          {activeTab === 'task-statuses' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Task Statuses</p>
                  <p className="text-xs text-gray-400 mt-0.5">Drag to reorder. These will appear as Kanban columns.</p>
                </div>
                <button onClick={openCreateStatus}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all">
                  <Plus className="w-4 h-4" /> Add Status
                </button>
              </div>

              {/* Status list */}
              <div className="space-y-2">
                {statuses.map((s, index) => (
                  <div
                    key={s._id}
                    draggable
                    onDragStart={() => { dragItem.current = index; }}
                    onDragEnter={() => { dragOver.current = index; }}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all cursor-default group"
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing shrink-0" />
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-semibold text-gray-800 flex-1">{s.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditStatus(s)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleStatusDelete(s._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {statuses.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">No statuses yet. Add one above.</div>
                )}
              </div>

              {/* Inline form */}
              {showStatusForm && (
                <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">{editingStatus ? 'Edit Status' : 'New Status'}</p>
                    <button onClick={() => setShowStatusForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Status Name</label>
                    <input type="text" placeholder="e.g. Review, Blocked..." value={statusForm.name}
                      onChange={e => setStatusForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Color</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => setStatusForm(f => ({ ...f, color: c }))}
                          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${statusForm.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                          style={{ backgroundColor: c }} />
                      ))}
                      <input type="color" value={statusForm.color} onChange={e => setStatusForm(f => ({ ...f, color: e.target.value }))}
                        className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent" title="Custom color" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowStatusForm(false)}
                      className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleStatusSave} disabled={!statusForm.name.trim() || savingStatus}
                      className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40">
                      {savingStatus ? 'Saving...' : editingStatus ? 'Save Changes' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
