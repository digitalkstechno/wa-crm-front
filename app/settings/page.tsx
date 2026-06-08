'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Eye, EyeOff, Check, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
type Toast = { type: 'success' | 'error'; message: string } | null;

const formatPhone = (val: string) => {
  if (!val) return '+91 ';
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 10);
  if (digits.length === 0) return '+91 ';
  if (digits.length <= 5) return `+91 ${digits}`;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
};

export default function SettingsPage() {
  const { staff } = useAuth();

  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

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
    
    setProfile(p => ({ ...p, phone: formatted }));
  };

  useEffect(() => {
    apiFetch('/staff/me').then(res => {
      const d = res.data;
      setProfile({ fullName: d.fullName || '', email: d.email || '', phone: formatPhone(d.phone || '') });
    }).catch(() => {
      if (staff) {
        setProfile({ fullName: staff.fullName || '', email: staff.email || '', phone: staff.phone || '' });
      }
    });
  }, [staff]);

  const handleProfileSave = async () => {
    if (!profile.fullName.trim() || !profile.email.trim()) {
      showToast('error', 'Name and email are required');
      return;
    }
    
    if (profile.phone) {
      const digits = profile.phone.replace(/\D/g, '');
      const actualDigits = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
      if (actualDigits.length !== 10) {
        showToast('error', 'Phone number must be exactly 10 digits');
        return;
      }
    }
    
    setSavingProfile(true);
    try {
      await apiFetch('/staff/me', { method: 'PUT', body: JSON.stringify({ fullName: profile.fullName, email: profile.email, phone: profile.phone }) });
      showToast('success', 'Profile updated successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };


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
        <div className="p-8">
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
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 xxxxx xxxxx"
                    value={profile.phone}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300"
                />
              </div>

              <button
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
