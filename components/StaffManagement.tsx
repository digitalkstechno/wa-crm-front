'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Plus, Edit, Trash, X, Eye, EyeOff, Save, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

type Staff = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  roleType?: string;
  department?: string;
  status?: string;
  firmId?: string | any;
  createdAt: string;
};

type Firm = {
  _id: string;
  name: string;
};

export default function StaffManagement() {
  const { staff } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [firmList, setFirmList] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [formData, setFormData] = useState({ id: '', fullName: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStaffList = async () => {
    setLoading(true);
    try {
      const [staffRes, firmRes] = await Promise.all([
        apiFetch('/staff?limit=1000'),
        apiFetch('/firms').catch(() => ({ data: [] }))
      ]);
      if (staffRes.data) setStaffList(staffRes.data);
      if (firmRes.data) setFirmList(firmRes.data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;
    if (!inputVal.startsWith('+91 ')) {
      if (inputVal === '+91' || inputVal === '+9' || inputVal === '+' || inputVal === '') {
        inputVal = '+91 ';
      } else {
        const digits = inputVal.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length > 10) {
          inputVal = '+91 ' + digits.slice(2);
        } else {
          inputVal = '+91 ' + digits;
        }
      }
    }
    const suffix = inputVal.slice(4);
    let digits = suffix.replace(/\D/g, '');
    digits = digits.slice(0, 10);
    let formatted = '+91 ';
    if (digits.length > 0) {
      if (digits.length <= 5) {
        formatted = `+91 ${digits}`;
      } else {
        formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
      }
    }
    setFormData(p => ({ ...p, phone: formatted }));
  };

  const handleOpenModal = (mode: 'create' | 'edit', staff?: Staff) => {
    setModalMode(mode);
    if (mode === 'edit' && staff) {
      setFormData({
        id: staff._id,
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone || '+91 ',
        password: '',
      });
    } else {
      setFormData({ id: '', fullName: '', email: '', phone: '+91 ', password: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) {
      showToast('error', 'Name and email are required');
      return;
    }
    if (modalMode === 'create' && (!formData.password || formData.password.length < 6)) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      if (modalMode === 'create') {
        await apiFetch('/staff/create', { method: 'POST', body: JSON.stringify(payload) });
        showToast('success', 'Staff created successfully');
      } else {
        await apiFetch(`/staff/${formData.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('success', 'Staff updated successfully');
      }
      setShowModal(false);
      fetchStaffList();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await apiFetch(`/staff/${id}`, { method: 'DELETE' });
      showToast('success', 'Staff deleted successfully');
      fetchStaffList();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete staff');
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold mb-4 ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
          <p className="text-sm text-gray-500">Manage your staff and their access</p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading staff members...</div>
        ) : staffList.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No staff members found. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Firm</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffList.map((member) => {
                  const firmName = firmList.find(f => f._id === member.firmId)?.name || 'Unassigned';
                  return (
                    <tr key={member._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{member.fullName}</p>
                            {staff?._id === member._id && (
                              <span className="inline-block px-2 py-0.5 mt-1 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{member.email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{member.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{member.roleType || 'Member'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{firmName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{member.department || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {member.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal('edit', member)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member._id)}
                            disabled={staff?._id === member._id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{modalMode === 'create' ? 'Add New Staff' : 'Edit Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all"
                  placeholder="+91 xxxxx xxxxx"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {modalMode === 'create' ? 'Password' : 'New Password (Optional)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all"
                    placeholder={modalMode === 'create' ? "Min 6 characters" : "Leave blank to keep current"}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Staff</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
