'use client';

import React, { useState } from 'react';
import {
  Search, Plus, MoreHorizontal, Smartphone, CheckCircle2,
  Clock, X, Zap, Phone, MessageSquare, Pencil, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Button = { label: string; type: 'reply' | 'phone' };

type Template = {
  id: number;
  name: string;
  language: string;
  category: string;
  status: 'Approved' | 'Pending';
  body: string;
  buttons: Button[];
};

const initialTemplates: Template[] = [
  {
    id: 1, name: 'Appointment_Reminder_v1', language: 'English (US)', category: 'Reminder', status: 'Approved',
    body: 'Hello {{name}}! 👋\n\nThis is a reminder for your appointment on {{date}} at {{time}}.\n\nPlease confirm or contact us to reschedule.',
    buttons: [{ label: 'Confirm Appointment', type: 'reply' }, { label: 'Call Support', type: 'phone' }],
  },
  {
    id: 2, name: 'Flash_Sale_Promo', language: 'Spanish', category: 'Marketing', status: 'Pending',
    body: '¡Hola {{name}}! 🎉\n\nTenemos una oferta especial para ti. ¡No te la pierdas!',
    buttons: [{ label: 'Ver Oferta', type: 'reply' }],
  },
];

const emptyForm = { name: '', category: 'Reminder', language: 'English (US)', body: '', buttons: [] as Button[], btnInput: '' };

const VARIABLES = ['{{name}}', '{{date}}', '{{time}}', '{{amount}}'];
const CATEGORIES = ['Reminder', 'Marketing', 'Authentication', 'Utility'];
const LANGUAGES = ['English (US)', 'Spanish', 'Hindi', 'French', 'Arabic'];

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [previewId, setPreviewId] = useState<number | null>(initialTemplates[0].id);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const previewTemplate = previewId ? templates.find(t => t.id === previewId) : null;

  const openCreate = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setIsDrawerOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditingTemplate(t);
    setForm({ name: t.name, category: t.category, language: t.language, body: t.body, buttons: t.buttons, btnInput: '' });
    setIsDrawerOpen(true);
    setOpenMenuId(null);
  };

  const insertVariable = (v: string) => setForm(f => ({ ...f, body: f.body + v }));

  const addButton = () => {
    const label = form.btnInput.trim();
    if (!label || form.buttons.length >= 3) return;
    setForm(f => ({ ...f, buttons: [...f.buttons, { label, type: 'reply' }], btnInput: '' }));
  };

  const removeButton = (i: number) => setForm(f => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    if (!form.name.trim() || !form.body.trim()) return;
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...form } : t));
    } else {
      const newT: Template = { id: Date.now(), name: form.name, category: form.category, language: form.language, body: form.body, buttons: form.buttons, status: 'Pending' };
      setTemplates(prev => [...prev, newT]);
      setPreviewId(newT.id);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: number) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (previewId === id) setPreviewId(templates.find(t => t.id !== id)?.id ?? null);
    setDeleteId(null);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Message Templates</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm w-64" />
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200">
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Templates Table */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-visible">
          <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">All Templates</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{templates.length} total</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-3">Name</th>
                <th className="px-8 py-3">Message</th>
                <th className="px-8 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-16 text-center text-sm text-gray-400">No templates found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}
                  onClick={() => setPreviewId(t.id)}
                  className={`cursor-pointer transition-colors ${previewId === t.id ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-8 py-4 w-48">
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm text-gray-500 truncate max-w-xs">{t.body}</p>
                  </td>
                  <td className="px-8 py-4 text-right relative">
                    <button onClick={e => { e.stopPropagation(); handleMenuOpen(e, t.id); }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Preview */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-bold text-gray-900">Live Preview</h3>
          </div>

          {previewTemplate ? (
            <>
              <div className="relative mx-auto w-full max-w-[240px] aspect-[9/18] bg-gray-900 rounded-[2.5rem] border-[5px] border-gray-800 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-800 rounded-b-xl z-10" />
                <div className="h-full bg-[#e5ddd5] flex flex-col">
                  <div className="bg-[#075e54] px-3 py-2 pt-6 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white leading-none">Business</p>
                      <p className="text-[8px] text-white/60">online</p>
                    </div>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto">
                    <div className="bg-white rounded-2xl rounded-tl-none p-2.5 shadow-sm">
                      <p className="text-[10px] text-gray-800 leading-relaxed whitespace-pre-wrap">{previewTemplate.body}</p>
                      <p className="text-[8px] text-gray-400 text-right mt-1">9:41 AM</p>
                    </div>
                  </div>
                  {previewTemplate.buttons.length > 0 && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {previewTemplate.buttons.map((btn, i) => (
                        <div key={i} className="bg-white py-1.5 rounded-xl text-center shadow-sm flex items-center justify-center gap-1.5">
                          {btn.type === 'phone' ? <Phone className="w-3 h-3 text-blue-500" /> : null}
                          <span className="text-[9px] font-bold text-blue-500">{btn.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                Appearance may vary by device
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <Smartphone className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Select a template to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Dropdown Menu */}
      <AnimatePresence>
        {openMenuId !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
            className="bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] overflow-hidden w-36"
          >
            <button onClick={() => { const t = templates.find(t => t.id === openMenuId); if (t) openEdit(t); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => { setDeleteId(openMenuId); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-[70] flex flex-col">

              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Template Name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="e.g. Welcome_Message" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-transparent focus:ring-2 focus:ring-emerald-500/20" />
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message Body <span className="text-red-400">*</span></label>
                  <textarea rows={8} placeholder="Hello! 👋 ..." value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none border border-transparent focus:ring-2 focus:ring-emerald-500/20 resize-none" />
                  <p className="text-[10px] text-gray-400">{form.body.length} characters</p>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-100 flex gap-4">
                <button onClick={handleSave}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                  {editingTemplate ? 'Save Changes' : 'Submit for Approval'}
                </button>
                <button onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] shadow-2xl z-[70] p-8 w-[380px]">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Template?</h3>
              <p className="text-sm text-gray-400 mb-8">This action cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all">Delete</button>
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
