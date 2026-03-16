'use client';

import React from 'react';
import { 
  Users, 
  Clock, 
  Send, 
  AlertCircle,
  Search,
  Bell,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const data = [
  { name: '1 May', sent: 400 },
  { name: '8 May', sent: 300 },
  { name: '15 May', sent: 500 },
  { name: '22 May', sent: 450 },
  { name: '30 May', sent: 600 },
];

const pieData = [
  { name: 'Sent', value: 75, color: '#10b981' },
  { name: 'Pending', value: 20, color: '#3b82f6' },
  { name: 'Failed', value: 5, color: '#ef4444' },
];

const Dashboard = () => {
  const stats = [
    { label: 'Total Customers', value: '5,240', change: '+12%', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Reminders', value: '128', change: '+5%', icon: Clock, color: 'bg-blue-50 text-blue-600' },
    { label: 'Messages Sent Today', value: '842', change: '+18%', icon: Send, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Failed Messages', value: '12', change: '-2%', icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  ];

  const recentActivity = [
    { name: 'Sarah Jenkins', title: 'Subscription Renewal', time: 'Today, 10:30 AM', status: 'SENT', avatar: 'https://picsum.photos/seed/sarah/40/40' },
    { name: 'Marcus Chen', title: 'Appointment Conf.', time: 'Today, 02:15 PM', status: 'PENDING', avatar: 'https://picsum.photos/seed/marcus/40/40' },
    { name: 'David Miller', title: 'Invoice Reminder', time: 'Yesterday, 04:00 PM', status: 'FAILED', avatar: 'https://picsum.photos/seed/david/40/40' },
    { name: 'Elena Rodriguez', title: 'Welcome Message', time: 'Yesterday, 11:45 AM', status: 'SENT', avatar: 'https://picsum.photos/seed/elena/40/40' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search customers or reminders..." 
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-emerald-600 transition-all shadow-sm relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
            <img src="https://picsum.photos/seed/user/40/40" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Messages Sent</h3>
              <p className="text-sm text-gray-500">Last 30 days activity</p>
            </div>
            <select className="bg-gray-50 border-none text-xs font-bold text-gray-600 px-4 py-2 rounded-xl focus:ring-0 cursor-pointer">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Reminder Status</h3>
          <p className="text-sm text-gray-500 mb-8">Current distribution</p>
          
          <div className="h-[200px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">100%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracked</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-4">Customer Name</th>
                <th className="px-8 py-4">Reminder Title</th>
                <th className="px-8 py-4">Scheduled Time</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentActivity.map((activity, i) => (
                <tr key={i} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <img src={activity.avatar} alt={activity.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{activity.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-gray-600">{activity.title}</td>
                  <td className="px-8 py-5 text-sm font-medium text-gray-500">{activity.time}</td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                      activity.status === 'SENT' ? 'bg-emerald-50 text-emerald-600' :
                      activity.status === 'FAILED' ? 'bg-red-50 text-red-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="px-4 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
