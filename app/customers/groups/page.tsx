'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Users, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS, type Group } from '@/lib/groups';
import { apiFetch } from '@/lib/api';

const emptyForm = { name: '', description: '', color: COLORS[0] };

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 9 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchGroups(search, 1); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchGroups = async (q = '', p = 1) => {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    params.set('page', String(p));
    params.set('limit', '9');
    const data = await apiFetch(`/customer-groups?${params.toString()}`);
    setGroups(data.data ?? []);
    if (data.pagination) setPagination(data.pagination);
  };

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchGroups(search, 1), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchGroups(search, p);
  };

  const openCreate = () => { setEditingGroup(null); setForm(emptyForm); setIsDrawerOpen(true); };

  const openEdit = (group: Group) => {
    setEditingGroup(group);
    setForm({ name: group.name, description: group.description, color: group.color });
    setIsDrawerOpen(true);
    setOpenMenuId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingGroup) {
      await apiFetch(`/customer-groups/${editingGroup._id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/customer-groups', { method: 'POST', body: JSON.stringify(form) });
    }
    setSaving(false);
    setIsDrawerOpen(false);
    fetchGroups(search, page);
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/customer-groups/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    const newPage = groups.length === 1 && page > 1 ? page - 1 : page;
    setPage(newPage);
    fetchGroups(search, newPage);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Groups</h2>
          <p className="text-sm text-gray-400">{pagination.totalRecords} groups total</p>
        </div>
        <Link href="/customers" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm w-64" />
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {groups.map(group => (
            <motion.div key={group._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: group.color + '20' }}>
                    <Users className="w-6 h-6" style={{ color: group.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
                  </div>
                </div>
                <button
                  onClick={e => handleMenuOpen(e, group._id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{group.count}</span>
                <span className="text-xs font-medium text-gray-400">customers</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((group.count / 100) * 100, 100)}%`, backgroundColor: group.color }} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {groups.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No groups found</p>
          </div>
        )}
      </div>

      {/* Fixed Dropdown Menu */}
      <AnimatePresence>
        {openMenuId && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
            className="bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] overflow-hidden w-36"
          >
            <button
              onClick={() => { const g = groups.find(g => g._id === openMenuId); if (g) openEdit(g); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => { setDeleteId(openMenuId); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            Showing <span className="font-semibold text-gray-700">{(pagination.currentPage - 1) * pagination.limit + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)}</span> of <span className="font-semibold text-gray-700">{pagination.totalRecords}</span> groups
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">←</button>
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
                  <button key={p} onClick={() => handlePageChange(p as number)}
                    className={`w-9 h-9 text-sm font-bold rounded-xl transition-all ${page === p ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>
                    {p}
                  </button>
                )
              )}
            <button onClick={() => handlePageChange(page + 1)} disabled={page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">→</button>
          </div>
        </div>
      )}

      {/* Create / Edit Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-[70] p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">{editingGroup ? 'Edit Group' : 'New Group'}</h3>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Group Name</label>
                  <input type="text" placeholder="e.g. Premium Clients" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <textarea rows={3} placeholder="Short description of this group..." value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Color</label>
                  <div className="flex gap-3">
                    {COLORS.map(color => (
                      <button key={color} onClick={() => setForm(f => ({ ...f, color }))} className="w-8 h-8 rounded-full transition-all"
                        style={{ backgroundColor: color, outline: form.color === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-gray-100 flex gap-4">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-70">
                  {saving ? 'Saving...' : editingGroup ? 'Save Changes' : 'Create Group'}
                </button>
                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Group?</h3>
              <p className="text-sm text-gray-400 mb-8">This action cannot be undone. The group will be permanently removed.</p>
              <div className="flex gap-4">
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all">Delete</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
