'use client';

import React, { useState, useEffect } from 'react';
import { Users, Clock, Send, AlertCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { apiFetch } from '@/lib/api';

interface DashboardData {
  stats: {
    totalCustomers: number;
    activeReminders: number;
    sentToday: number;
    failedToday: number;
  };
  chart: { name: string; sent: number }[];
  pie: { name: string; value: number; color: string }[];
  recentActivity: {
    _id: string;
    title: string;
    status: string;
    scheduledAt: string;
    customerName: string;
  }[];
}

const statusStyle: Record<string, string> = {
  Sent: 'bg-emerald-50 text-emerald-600',
  Pending: 'bg-blue-50 text-blue-600',
  Scheduled: 'bg-blue-50 text-blue-600',
  Failed: 'bg-red-50 text-red-600',
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: 'Total Customers', value: data.stats.totalCustomers.toLocaleString(), icon: Users, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Active Reminders', value: data.stats.activeReminders.toLocaleString(), icon: Clock, color: 'bg-blue-50 text-blue-600' },
        { label: 'Messages Sent Today', value: data.stats.sentToday.toLocaleString(), icon: Send, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Failed Today', value: data.stats.failedToday.toLocaleString(), icon: AlertCircle, color: 'bg-red-50 text-red-600' },
      ]
    : [];

  const pieTotal = data?.pie.reduce((a, b) => a + b.value, 0) || 0;

  return (
    <div className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-pulse h-32" />
            ))
          : stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900">Messages Sent</h3>
            <p className="text-sm text-gray-500">Last 30 days activity</p>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full bg-gray-50 rounded-2xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chart || []}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Reminder Status</h3>
          <p className="text-sm text-gray-500 mb-8">Current distribution</p>
          {loading ? (
            <div className="h-[200px] bg-gray-50 rounded-2xl animate-pulse" />
          ) : (
            <>
              <div className="h-[200px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.pie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                      {data?.pie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{pieTotal}%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracked</span>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {data?.pie.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-4">Customer</th>
                <th className="px-8 py-4">Reminder Title</th>
                <th className="px-8 py-4">Scheduled Time</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-8 py-5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : data?.recentActivity.map((activity) => {
                    const d = new Date(activity.scheduledAt);
                    return (
                      <tr key={activity._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                              {activity.customerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{activity.customerName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-gray-600">{activity.title}</td>
                        <td className="px-8 py-5 text-sm font-medium text-gray-500">
                          {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusStyle[activity.status] || 'bg-gray-100 text-gray-500'}`}>
                            {activity.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
