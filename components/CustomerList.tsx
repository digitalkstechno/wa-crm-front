'use client';

import React, { useState } from 'react';
import {
  Search, Plus, Filter, Download, MoreHorizontal, X, Users, ChevronDown, Check
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { initialGroups, type Group } from '@/lib/groups';

type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  group: string;
  notes: string;
  lastActive: string;
  avatar: string;
};

const TAGS = ['VIP', 'Lead', 'Inactive', 'New'];

const initialCustomers: Customer[] = [
  { id: 1, name: 'John Doe', phone: '+1 234 567 890', email: 'john@example.com', tags: ['VIP'], group: 'VIP Clients', notes: '', lastActive: '2023-12-01', avatar: 'JD' },
  { id: 2, name: 'Alice Smith', phone: '+1 987 654 321', email: 'alice@example.com', tags: ['Lead'], group: 'Leads', notes: '', lastActive: '2023-11-28', avatar: 'AS' },
  { id: 3, name: 'Robert Fox', phone: '+1 555 012 345', email: 'robert@example.com', tags: ['Lead'], group: 'Leads', notes: '', lastActive: 'Nov 25, 2023', avatar: 'RF' },
];

const emptyForm = { name: '', phone: '', email: '', tags: [] as string[], group: '', notes: '' };

const tagColors: Record<string, string> = {
  VIP: 'bg-emerald-50 text-emerald-600',
  Lead: 'bg-blue-50 text-blue-600',
  Inactive: 'bg-gray-100 text-gray-500',
  New: 'bg-purple-50 text-purple-600',
};

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [groups] = useState<Group[]>(initialGroups);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});
  const [search, setSearch] = useState('');
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    setCustomers(prev => [...prev, {
      id: Date.now(),
      ...form,
      lastActive: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      avatar: initials,
    }]);
    setForm(emptyForm);
    setErrors({});
    setIsDrawerOpen(false);
  };

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const openDrawer = () => {
    setForm(emptyForm);
    setErrors({});
    setIsDrawerOpen(true);
  };

  const selectedGroup = groups.find(g => g.name === form.group);

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
          <Link
            href="/customers/groups"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Users className="w-4 h-4" />
            Customer Groups
          </Link>
          <button
            onClick={openDrawer}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            Add New Customer
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <Filter className="w-4 h-4" /> Filter by Tag
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <Download className="w-4 h-4" /> Import CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <th className="px-8 py-4">Name</th>
              <th className="px-8 py-4">Phone Number</th>
              <th className="px-8 py-4">Group</th>
              <th className="px-8 py-4">Tags</th>
              <th className="px-8 py-4">Last Active</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(customer => (
              <tr key={customer.id} className="group hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100">
                      {customer.avatar}
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
                    <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                      {customer.group}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2 flex-wrap">
                    {customer.tags.map((tag, i) => (
                      <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tagColors[tag] ?? 'bg-gray-100 text-gray-500'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-gray-500">{customer.lastActive}</td>
                <td className="px-8 py-5 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center text-sm text-gray-400">No customers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-[70] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add New Customer</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Michael Chen"
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                    className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none transition-all border ${errors.name ? 'border-red-300 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500/20'}`}
                  />
                  {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={form.phone}
                      onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(er => ({ ...er, phone: '' })); }}
                      className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none transition-all border ${errors.phone ? 'border-red-300 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500/20'}`}
                    />
                    {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      placeholder="mike@example.com"
                      value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                      className={`w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none transition-all border ${errors.email ? 'border-red-300 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-emerald-500/20'}`}
                    />
                    {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                  </div>
                </div>

                {/* Customer Group */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Group</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setGroupDropdownOpen(o => !o)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none text-left flex items-center justify-between border border-transparent focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {selectedGroup ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedGroup.color }} />
                          <span className="font-medium text-gray-800">{selectedGroup.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Select a group...</span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {groupDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-lg z-10 overflow-hidden"
                        >
                          <button
                            onClick={() => { setForm(f => ({ ...f, group: '' })); setGroupDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-gray-50 transition-colors"
                          >
                            None
                          </button>
                          {groups.map(g => (
                            <button
                              key={g.id}
                              onClick={() => { setForm(f => ({ ...f, group: g.name })); setGroupDropdownOpen(false); }}
                              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <span className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                                <span className="font-medium">{g.name}</span>
                                <span className="text-xs text-gray-400">{g.count} customers</span>
                              </span>
                              {form.group === g.name && <Check className="w-4 h-4 text-emerald-500" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          form.tags.includes(tag)
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Add some context about this customer..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-8 py-6 border-t border-gray-100 flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                >
                  Save Customer
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                >
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
