'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreHorizontal, X, Users, ChevronDown, Check, Trash2, Pencil, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { type Group } from '@/lib/groups';
import { apiFetch } from '@/lib/api';

type Customer = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  group: { _id: string; name: string; color: string } | null;
  notes: string;
  createdAt: string;
};

const emptyForm = { name: '', phone: '', email: '', tags: [] as string[], group: '', notes: '', tagInput: '' };

const tagColors: Record<string, string> = {
  VIP: 'bg-emerald-50 text-emerald-600',
  Lead: 'bg-blue-50 text-blue-600',
  Inactive: 'bg-gray-100 text-gray-500',
  New: 'bg-purple-50 text-purple-600',
};

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});
  const [search, setSearch] = useState('');
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportGroupId, setExportGroupId] = useState('');
  const [exporting, setExporting] = useState(false);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });

  useEffect(() => {
    fetchCustomers(search, 1);
    fetchGroups();
  }, []);

  const fetchCustomers = async (q = '', p = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    params.set('page', String(p));
    params.set('limit', '10');
    const data = await apiFetch(`/customers?${params.toString()}`);
    setCustomers(data.data ?? []);
    if (data.pagination) setPagination(data.pagination);
    setLoading(false);
  };

  const fetchGroups = async () => {
    const data = await apiFetch('/customer-groups');
    setGroups(data.data ?? []);
  };

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchCustomers(search, 1), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCustomers(search, p);
  };

  const addTag = (val: string) => {
    const tag = val.trim();
    if (tag && !form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag], tagInput: '' }));
    else setForm(f => ({ ...f, tagInput: '' }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(form.tagInput); }
    else if (e.key === 'Backspace' && !form.tagInput && form.tags.length > 0)
      setForm(f => ({ ...f, tags: f.tags.slice(0, -1) }));
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const validate = () => {
    const e: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { name: form.name, phone: form.phone, email: form.email, tags: form.tags, group: form.group || null, notes: form.notes };
    if (editingCustomer) {
      await apiFetch(`/customers/${editingCustomer._id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiFetch('/customers', { method: 'POST', body: JSON.stringify(payload) });
    }
    setSaving(false);
    setIsDrawerOpen(false);
    setForm(emptyForm);
    setErrors({});
    setEditingCustomer(null);
    fetchCustomers(search, page);
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    const newPage = customers.length === 1 && page > 1 ? page - 1 : page;
    setPage(newPage);
    fetchCustomers(search, newPage);
  };

  const openCreate = () => { setEditingCustomer(null); setForm(emptyForm); setErrors({}); setIsDrawerOpen(true); };


  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportGroupId) params.set('groupId', exportGroupId);
      
      // Use window.location.origin to get the base URL if needed, 
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1/api';
      const token = localStorage.getItem('wa_crm_token');
      
      const response = await fetch(`${baseUrl}/customers/export-excel?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export excel');
    } finally {
      setExporting(false);
    }
  };


  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.trim().split('\n').slice(1);
    const toImport = lines.map(line => {
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
      return { name: cols[0] || '', phone: cols[1] || '', email: cols[2] || '', tags: cols[3] ? cols[3].split(';') : [], notes: cols[5] || '' };
    }).filter(c => c.name && c.phone);
    for (const c of toImport) {
      try { await apiFetch('/customers', { method: 'POST', body: JSON.stringify(c) }); } catch {}
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchCustomers(search, 1);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, tags: c.tags, group: c.group?._id ?? '', notes: c.notes, tagInput: '' });
    setErrors({});
    setIsDrawerOpen(true);
    setOpenMenuId(null);
  };

  const selectedGroup = groups.find(g => g._id === form.group);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            />
          </div>
          <Link href="/customers/groups" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Users className="w-4 h-4" /> Customer Groups
          </Link>
          <button onClick={() => setExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>

          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
            <Upload className="w-4 h-4" /> {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200">
            <Plus className="w-4 h-4" /> Add New Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-visible">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <th className="px-8 py-4">Name</th>
              <th className="px-8 py-4">Phone Number</th>
              <th className="px-8 py-4">Group</th>
              <th className="px-8 py-4">Tags</th>
              <th className="px-8 py-4">Added On</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-8 py-16 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-8 py-16 text-center text-sm text-gray-400">No customers found</td></tr>
            ) : customers.map((customer) => (
              <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100">
                      {customer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-gray-600">{customer.phone}</td>
                <td className="px-8 py-5">
                  {customer.group ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-lg w-fit">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: customer.group.color }} />
                      {customer.group.name}
                    </span>
                  ) : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2 flex-wrap">
                    {customer.tags.map((tag, i) => (
                      <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tagColors[tag] ?? 'bg-gray-100 text-gray-500'}`}>{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-gray-500">
                  {new Date(customer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-8 py-5 text-right">
                  <button
                    onClick={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 144 });
                      setOpenMenuId(openMenuId === customer._id ? null : customer._id);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            Showing <span className="font-semibold text-gray-700">{(pagination.currentPage - 1) * pagination.limit + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)}</span> of <span className="font-semibold text-gray-700">{pagination.totalRecords}</span> customers
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              ←
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    className={`w-9 h-9 text-sm font-bold rounded-xl transition-all ${
                      page === p
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                        : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-[70] flex flex-col">
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="e.g. Michael Chen" value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                    className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none transition-all border ${errors.name ? 'border-red-300 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500/20'}`} />
                  {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone <span className="text-red-400">*</span></label>
                    <input type="tel" placeholder="+1 234 567 890" value={form.phone}
                      onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(er => ({ ...er, phone: '' })); }}
                      className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none transition-all border ${errors.phone ? 'border-red-300 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500/20'}`} />
                    {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input type="email" placeholder="mike@example.com" value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                      className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none transition-all border ${errors.email ? 'border-red-300 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500/20'}`} />
                    {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Group</label>
                  <div className="relative">
                    <button type="button" onClick={() => setGroupDropdownOpen(o => !o)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none text-left flex items-center justify-between border border-transparent">
                      {selectedGroup ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedGroup.color }} />
                          <span className="font-medium text-gray-800">{selectedGroup.name}</span>
                        </span>
                      ) : <span className="text-gray-400">Select a group...</span>}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {groupDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-lg z-10 overflow-hidden">
                          <button onClick={() => { setForm(f => ({ ...f, group: '' })); setGroupDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-gray-50 transition-colors">None</button>
                          {groups.map(g => (
                            <button key={g._id} onClick={() => { setForm(f => ({ ...f, group: g._id })); setGroupDropdownOpen(false); }}
                              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <span className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                                <span className="font-medium">{g.name}</span>
                                <span className="text-xs text-gray-400">{g.count} customers</span>
                              </span>
                              {form.group === g._id && <Check className="w-4 h-4 text-emerald-500" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tags</label>
                  <div className="flex flex-wrap gap-2 px-3 py-2.5 bg-gray-50 rounded-2xl min-h-[48px] items-center">
                    {form.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <input type="text" placeholder={form.tags.length === 0 ? 'Type a tag and press Enter...' : 'Add more...'}
                      value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                      onKeyDown={handleTagKeyDown} onBlur={() => form.tagInput.trim() && addTag(form.tagInput)}
                      className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400" />
                  </div>
                  <p className="text-[10px] text-gray-400">Press Enter or comma to add a tag</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Notes</label>
                  <textarea rows={3} placeholder="Add some context about this customer..." value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-100 flex gap-4">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-70">
                  {saving ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Save Customer'}
                </button>
                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating action menu */}
      <AnimatePresence>
        {openMenuId && (() => {
          const customer = customers.find(c => c._id === openMenuId);
          if (!customer) return null;
          return (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
              className="bg-white border border-gray-100 rounded-2xl shadow-xl z-[200] overflow-hidden w-36"
            >
              <button onClick={() => openEdit(customer)} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => { setDeleteId(customer._id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] shadow-2xl z-[70] p-8 w-[380px]">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Customer?</h3>
              <p className="text-sm text-gray-400 mb-8">This action cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all">Delete</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Export Modal */}
      <AnimatePresence>
        {exportModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExportModalOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] shadow-2xl z-[70] p-8 w-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Export Customers</h3>
                <button onClick={() => setExportModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Group to Export</label>
                  <select 
                    value={exportGroupId} 
                    onChange={(e) => setExportGroupId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-transparent focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">All Customers</option>
                    {groups.map(g => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-400">The exported Excel file will contain a dropdown menu in the "Group" column for easy editing.</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleExportExcel} 
                  disabled={exporting}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-70"
                >
                  {exporting ? 'Exporting...' : 'Download Excel'}
                </button>
                <button onClick={() => setExportModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};


export default CustomerList;
