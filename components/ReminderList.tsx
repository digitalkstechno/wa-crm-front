'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  User,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const reminders = [
  { id: 1, customer: 'Sarah Jenkins', title: 'Subscription Renewal', date: 'Today', time: '10:30 AM', status: 'Scheduled', type: 'WhatsApp' },
  { id: 2, customer: 'Marcus Chen', title: 'Appointment Conf.', date: 'Today', time: '02:15 PM', status: 'Pending', type: 'WhatsApp' },
  { id: 3, customer: 'David Miller', title: 'Invoice Reminder', date: 'Tomorrow', time: '09:00 AM', status: 'Scheduled', type: 'WhatsApp' },
  { id: 4, customer: 'Elena Rodriguez', title: 'Welcome Message', date: 'Tomorrow', time: '11:45 AM', status: 'Scheduled', type: 'WhatsApp' },
];

const ReminderList = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search reminders..." 
              className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200">
            <Plus className="w-4 h-4" />
            Create Reminder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-emerald-900">Sent Today</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-900">842</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">+18% from yesterday</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-blue-900">Pending</h4>
          </div>
          <p className="text-3xl font-bold text-blue-900">128</p>
          <p className="text-xs text-blue-600 font-medium mt-1">Active queue</p>
        </div>
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h4 className="font-bold text-red-900">Failed</h4>
          </div>
          <p className="text-3xl font-bold text-red-900">12</p>
          <p className="text-xs text-red-600 font-medium mt-1">Requires attention</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-sm font-bold text-emerald-600 border-b-2 border-emerald-600 pb-1">Upcoming</button>
            <button className="text-sm font-bold text-gray-400 hover:text-gray-600 pb-1">Completed</button>
            <button className="text-sm font-bold text-gray-400 hover:text-gray-600 pb-1">Failed</button>
          </div>
          <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900">
            <Filter className="w-3 h-3" /> Filter
          </button>
        </div>
        
        <div className="divide-y divide-gray-50">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{reminder.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <User className="w-3 h-3" /> {reminder.customer}
                    </div>
                    <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MessageSquare className="w-3 h-3" /> {reminder.type}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-900 justify-end">
                    <Calendar className="w-3 h-3 text-gray-400" /> {reminder.date}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-0.5">
                    <Clock className="w-3 h-3" /> {reminder.time}
                  </div>
                </div>
                
                <div className="w-32 text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    reminder.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {reminder.status}
                  </span>
                </div>

                <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReminderList;
