'use client';

import React, { useState } from 'react';
import {
  Bell, Plus, Search, Filter, Calendar, Clock,
  User, MessageSquare, MoreVertical, CheckCircle2,
  AlertCircle, X, Phone, Users, Hash,
  Check, ChevronRight, FileText
} from 'lucide-react';

type ReminderStatus = 'Scheduled' | 'Pending' | 'Sent' | 'Failed';

interface Reminder {
  id: number;
  customer: string;
  avatar: string;
  title: string;
  date: string;
  time: string;
  status: ReminderStatus;
  type: string;
}

const allReminders: Reminder[] = [
  { id: 1, customer: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/40/40', title: 'Subscription Renewal', date: 'Today', time: '10:30 AM', status: 'Scheduled', type: 'WhatsApp' },
  { id: 2, customer: 'Marcus Chen', avatar: 'https://picsum.photos/seed/marcus/40/40', title: 'Appointment Conf.', date: 'Today', time: '02:15 PM', status: 'Pending', type: 'WhatsApp' },
  { id: 3, customer: 'David Miller', avatar: 'https://picsum.photos/seed/david/40/40', title: 'Invoice Reminder', date: 'Tomorrow', time: '09:00 AM', status: 'Scheduled', type: 'WhatsApp' },
  { id: 4, customer: 'Elena Rodriguez', avatar: 'https://picsum.photos/seed/elena/40/40', title: 'Welcome Message', date: 'Tomorrow', time: '11:45 AM', status: 'Scheduled', type: 'WhatsApp' },
  { id: 5, customer: 'James Wilson', avatar: 'https://picsum.photos/seed/james/40/40', title: 'Payment Follow-up', date: '28 May', time: '03:00 PM', status: 'Sent', type: 'WhatsApp' },
  { id: 6, customer: 'Priya Sharma', avatar: 'https://picsum.photos/seed/priya/40/40', title: 'Order Confirmation', date: '27 May', time: '10:00 AM', status: 'Sent', type: 'WhatsApp' },
  { id: 7, customer: 'Tom Baker', avatar: 'https://picsum.photos/seed/tom/40/40', title: 'Renewal Notice', date: '26 May', time: '09:30 AM', status: 'Failed', type: 'WhatsApp' },
  { id: 8, customer: 'Aisha Patel', avatar: 'https://picsum.photos/seed/aisha/40/40', title: 'Support Follow-up', date: '25 May', time: '04:00 PM', status: 'Failed', type: 'WhatsApp' },
];

const statusConfig: Record<ReminderStatus, { bg: string; text: string; label: string }> = {
  Scheduled: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Scheduled' },
  Pending:   { bg: 'bg-blue-50',    text: 'text-blue-600',    label: 'Pending'   },
  Sent:      { bg: 'bg-gray-100',   text: 'text-gray-600',    label: 'Sent'      },
  Failed:    { bg: 'bg-red-50',     text: 'text-red-600',     label: 'Failed'    },
};

type Tab = 'upcoming' | 'completed' | 'failed';

const tabFilter: Record<Tab, (r: Reminder) => boolean> = {
  upcoming:  (r) => r.status === 'Scheduled' || r.status === 'Pending',
  completed: (r) => r.status === 'Sent',
  failed:    (r) => r.status === 'Failed',
};

// --- Mock data for UI ---
const mockGroups = [
  { id: 'g1', name: 'VIP Clients', color: '#10b981', members: [
    { id: 'c1', name: 'Sarah Jenkins', phone: '+91 98765 43210' },
    { id: 'c2', name: 'Marcus Chen', phone: '+91 91234 56789' },
  ]},
  { id: 'g2', name: 'New Leads', color: '#3b82f6', members: [
    { id: 'c3', name: 'David Miller', phone: '+91 99887 76655' },
    { id: 'c4', name: 'Elena Rodriguez', phone: '+91 88776 65544' },
  ]},
  { id: 'g3', name: 'Premium', color: '#8b5cf6', members: [
    { id: 'c5', name: 'James Wilson', phone: '+91 77665 54433' },
  ]},
];

const mockTemplates = [
  { id: 't1', name: 'Subscription Renewal', body: 'Hi {{name}}, your subscription is due on {{date}}. Renew now to avoid interruption! 🔔' },
  { id: 't2', name: 'Appointment Reminder', body: 'Hello {{name}}! Just a reminder about your appointment on {{date}} at {{time}}. See you soon! 📅' },
  { id: 't3', name: 'Invoice Due', body: 'Dear {{name}}, your invoice #{{invoice}} of ₹{{amount}} is due on {{date}}. Please make the payment. 💳' },
  { id: 't4', name: 'Welcome Message', body: 'Welcome to our service, {{name}}! 🎉 We are excited to have you on board. Feel free to reach out anytime.' },
];

type RecipientType = 'new' | 'customers' | 'groups';

const ReminderList = () => {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(allReminders);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  // Modal wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recipientType, setRecipientType] = useState<RecipientType | null>(null);
  // New number
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  // Customers
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<{id:string;name:string;phone:string}[]>([]);
  // Groups
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  // Template
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');

  const resetModal = () => {
    setShowModal(false);
    setStep(1);
    setRecipientType(null);
    setNewName(''); setNewPhone('');
    setExpandedGroup(null);
    setSelectedCustomers([]);
    setSelectedGroups([]);
    setSelectedTemplate(null);
    setSchedDate(''); setSchedTime('');
  };

  const toggleCustomer = (c: {id:string;name:string;phone:string}) => {
    setSelectedCustomers(prev =>
      prev.find(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]
    );
  };

  const toggleGroup = (gid: string) => {
    setSelectedGroups(prev =>
      prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]
    );
  };

  const step1Valid = recipientType !== null;
  const step2Valid = (() => {
    if (recipientType === 'new') return newName.trim() !== '' && newPhone.trim() !== '';
    if (recipientType === 'customers') return selectedCustomers.length > 0;
    if (recipientType === 'groups') return selectedGroups.length > 0;
    return false;
  })();
  const step3Valid = selectedTemplate !== null && schedDate !== '' && schedTime !== '';

  const filtered = reminders
    .filter(tabFilter[activeTab])
    .filter(r =>
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase())
    );

  const stats = {
    sent: reminders.filter(r => r.status === 'Sent').length,
    pending: reminders.filter(r => r.status === 'Pending' || r.status === 'Scheduled').length,
    failed: reminders.filter(r => r.status === 'Failed').length,
  };

  const handleDelete = (id: number) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    setOpenMenu(null);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage and schedule your WhatsApp reminders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reminders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm w-56"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            Create Reminder
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-emerald-900">Sent Today</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-900">{stats.sent}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">+18% from yesterday</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-blue-900">Pending</h4>
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.pending}</p>
          <p className="text-xs text-blue-600 font-medium mt-1">Active queue</p>
        </div>
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h4 className="font-bold text-red-900">Failed</h4>
          </div>
          <p className="text-3xl font-bold text-red-900">{stats.failed}</p>
          <p className="text-xs text-red-600 font-medium mt-1">Requires attention</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 pt-6 pb-0 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-sm font-bold px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-emerald-600 border-emerald-500'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab.label}
                <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.key ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {reminders.filter(tabFilter[tab.key]).length}
                </span>
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-3">
            <Filter className="w-3 h-3" /> Filter
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <Bell className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No reminders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((reminder) => {
              const s = statusConfig[reminder.status];
              return (
                <div
                  key={reminder.id}
                  className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img src={reminder.avatar} alt={reminder.customer} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{reminder.title}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <User className="w-3 h-3" /> {reminder.customer}
                        </span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MessageSquare className="w-3 h-3" /> {reminder.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: date/time + status + menu */}
                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 justify-end">
                        <Calendar className="w-3 h-3 text-gray-400" /> {reminder.date}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-0.5">
                        <Clock className="w-3 h-3" /> {reminder.time}
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${s.bg} ${s.text} w-20 text-center`}>
                      {s.label}
                    </span>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === reminder.id ? null : reminder.id)}
                        className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === reminder.id && (
                        <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-10 w-36 py-1 text-sm">
                          <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium">Edit</button>
                          <button
                            onClick={() => handleDelete(reminder.id)}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Reminder</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === 1 && 'Step 1 of 3 — Choose recipient type'}
                  {step === 2 && 'Step 2 of 3 — Select recipients'}
                  {step === 3 && 'Step 3 of 3 — Template & schedule'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {[1,2,3].map(s => (
                    <div key={s} className={`rounded-full transition-all ${
                      s === step ? 'w-5 h-2 bg-emerald-500' :
                      s < step  ? 'w-2 h-2 bg-emerald-300' :
                                  'w-2 h-2 bg-gray-200'
                    }`} />
                  ))}
                </div>
                <button onClick={resetModal} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Step 1 — Recipient Type */}
            {step === 1 && (
              <div className="px-8 py-6 space-y-3">
                {([
                  { type: 'new' as RecipientType, icon: Phone, label: 'New Number', desc: 'Enter a name and phone number manually' },
                  { type: 'customers' as RecipientType, icon: Users, label: 'Customers', desc: 'Pick from existing customers by group' },
                  { type: 'groups' as RecipientType, icon: Hash, label: 'Groups', desc: 'Select entire groups — all members included' },
                ]).map(({ type, icon: Icon, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => setRecipientType(type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      recipientType === type
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${
                      recipientType === type ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${ recipientType === type ? 'text-emerald-700' : 'text-gray-800' }`}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    {recipientType === type && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Recipient Details */}
            {step === 2 && (
              <div className="px-8 py-6">

                {/* New Number */}
                {recipientType === 'new' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Name</label>
                      <input
                        type="text" placeholder="e.g. John Doe"
                        value={newName} onChange={e => setNewName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                      <input
                        type="tel" placeholder="e.g. +91 98765 43210"
                        value={newPhone} onChange={e => setNewPhone(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                )}

                {/* Customers — group accordion */}
                {recipientType === 'customers' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedCustomers.length > 0 && (
                      <p className="text-xs font-bold text-emerald-600 mb-3">{selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} selected</p>
                    )}
                    {mockGroups.map(group => (
                      <div key={group.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                            <span className="text-sm font-semibold text-gray-800">{group.name}</span>
                            <span className="text-xs text-gray-400">{group.members.length} members</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${ expandedGroup === group.id ? 'rotate-90' : '' }`} />
                        </button>
                        {expandedGroup === group.id && (
                          <div className="border-t border-gray-50 divide-y divide-gray-50">
                            {group.members.map(member => {
                              const isSelected = !!selectedCustomers.find(x => x.id === member.id);
                              return (
                                <button
                                  key={member.id}
                                  onClick={() => toggleCustomer(member)}
                                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                                    isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                                    }`}>
                                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{member.name}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">{member.phone}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Groups — multi select */}
                {recipientType === 'groups' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedGroups.length > 0 && (
                      <p className="text-xs font-bold text-emerald-600 mb-3">
                        {mockGroups.filter(g => selectedGroups.includes(g.id)).reduce((a, g) => a + g.members.length, 0)} members across {selectedGroups.length} group{selectedGroups.length > 1 ? 's' : ''}
                      </p>
                    )}
                    {mockGroups.map(group => {
                      const isSelected = selectedGroups.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                            isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${ isSelected ? 'text-emerald-700' : 'text-gray-800' }`}>{group.name}</p>
                            <p className="text-xs text-gray-400">{group.members.length} members</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Template & Schedule */}
            {step === 3 && (
              <div className="px-8 py-6 space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Message Template</label>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {mockTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                          selectedTemplate === t.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                          selectedTemplate === t.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${ selectedTemplate === t.id ? 'text-emerald-700' : 'text-gray-800' }`}>{t.name}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{t.body}</p>
                        </div>
                        {selectedTemplate === t.id && <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 px-8 pb-7">
              <button
                onClick={() => step === 1 ? resetModal() : setStep(s => (s - 1) as 1|2|3)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={() => {
                  if (step < 3) { setStep(s => (s + 1) as 1|2|3); return; }
                  // Final submit
                  const templateName = mockTemplates.find(t => t.id === selectedTemplate)?.name ?? 'Reminder';
                  const customerName =
                    recipientType === 'new' ? newName :
                    recipientType === 'customers' ? (selectedCustomers.length === 1 ? selectedCustomers[0].name : `${selectedCustomers.length} Customers`) :
                    selectedGroups.length === 1 ? (mockGroups.find(g => g.id === selectedGroups[0])?.name ?? 'Group') : `${selectedGroups.length} Groups`;
                  setReminders(prev => [{
                    id: Date.now(),
                    customer: customerName,
                    avatar: `https://picsum.photos/seed/${customerName}/40/40`,
                    title: templateName,
                    date: schedDate,
                    time: schedTime,
                    status: 'Scheduled',
                    type: 'WhatsApp',
                  }, ...prev]);
                  resetModal();
                }}
                disabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : !step3Valid}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === 3 ? 'Create Reminder' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderList;
