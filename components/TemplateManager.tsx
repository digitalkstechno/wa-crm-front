'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Smartphone,
  CheckCircle2,
  Clock,
  Send,
  X,
  Zap,
  Phone,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const templates = [
  { id: 1, name: 'Appointment_Reminder_v1', language: 'English (US)', category: 'Reminder', status: 'Approved' },
  { id: 2, name: 'Flash_Sale_Promo', language: 'Spanish', category: 'Marketing', status: 'Approved' },
];

const TemplateManager = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Message Templates</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search templates..." 
              className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Existing Templates</h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total: 24</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-4">Template Name</th>
                <th className="px-8 py-4">Language</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.map((template) => (
                <tr key={template.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6 font-semibold text-gray-900 text-sm">{template.name}</td>
                  <td className="px-8 py-6 text-sm text-gray-500">{template.language}</td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold">{template.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Create Template</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Template Name</label>
                <input 
                  type="text" 
                  placeholder="New_Client_Welcome"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20">
                  <option>Utility / Reminder</option>
                  <option>Marketing</option>
                  <option>Authentication</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message Body</label>
                <div className="flex gap-2">
                  <button className="text-[10px] font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md">{"{{name}}"}</button>
                  <button className="text-[10px] font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md">{"{{date}}"}</button>
                  <button className="text-[10px] font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md">{"{{time}}"}</button>
                </div>
              </div>
              <textarea 
                rows={6}
                placeholder="Hello {{name}}! 👋 Thank you for choosing us..."
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interactive Buttons</label>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl group">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 flex-1">Confirm Appointment</span>
                  <button className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl group">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 flex-1">Call Support</span>
                  <button className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <button className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Add Another Button
              </button>
            </div>

            <div className="pt-6 flex items-center justify-end gap-4">
              <button className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Discard</button>
              <button className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                Submit for Approval
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Smartphone className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900">Live Preview</h3>
          </div>

          <div className="relative mx-auto w-full max-w-[280px] aspect-[9/18.5] bg-gray-900 rounded-[3rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-b-2xl z-10"></div>
            
            <div className="h-full bg-[#e5ddd5] flex flex-col">
              <div className="bg-[#075e54] p-4 pt-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">Business Hub</p>
                  <p className="text-[8px] text-white/60">online</p>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[90%]">
                  <p className="text-[11px] text-gray-800 leading-relaxed">
                    Hello Alex! 👋<br/><br/>
                    Thank you for choosing us. This is a reminder for your upcoming session on Dec 12, 2023 at 10:00 AM.<br/><br/>
                    If you need to reschedule, please let us know at least 24 hours in advance.<br/><br/>
                    Best regards,<br/>
                    Business Team
                  </p>
                  <p className="text-[8px] text-gray-400 text-right mt-1">9:41 AM</p>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="bg-white py-2 rounded-xl text-center shadow-sm">
                  <span className="text-[10px] font-bold text-blue-500">Confirm Appointment</span>
                </div>
                <div className="bg-white py-2 rounded-xl text-center shadow-sm">
                  <span className="text-[10px] font-bold text-blue-500">Call Support</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
            Message appearance may vary slightly depending on the user&apos;s device and operating system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
