"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Cell,
} from "recharts";
import {
  Users,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckSquare,
  User,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

interface DashboardData {
  stats: {
    totalCustomers: number;
    totalTasks: number;
    pendingTasks: number;
    activeReminders: number;
    sentToday: number;
    failedToday: number;
  };
  chart: { name: string; sent: number }[];
  pie: {
    reminders: { name: string; value: number; color: string }[];
    tasks: { name: string; value: number; color: string }[];
  };
  recentActivity: {
    _id: string;
    taskId?: string;
    title: string;
    status: string;
    statusColor: string;
    priority: string;
    dueDate: string;
    customerName: string;
    assignee: string;
  }[];
}

const getPriorityColor = (priority: string | undefined) => {
  switch(priority) {
    case 'Urgent': return 'bg-red-50 text-red-700 border-red-200';
    case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Low': return 'bg-gray-50 text-gray-700 border-gray-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiFetch("/dashboard");
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = data
    ? [
        {
          label: "Total Customers",
          value: data.stats.totalCustomers.toLocaleString(),
          icon: Users,
          color: "bg-purple-50 text-purple-600",
        },
        {
          label: "Total Tasks",
          value: data.stats.totalTasks.toLocaleString(),
          icon: FileText,
          color: "bg-blue-50 text-blue-600",
        },
        {
          label: "Pending Tasks",
          value: data.stats.pendingTasks.toLocaleString(),
          icon: Clock,
          color: "bg-orange-50 text-orange-600",
        },
        {
          label: "Active Reminders",
          value: data.stats.activeReminders.toLocaleString(),
          icon: Send,
          color: "bg-emerald-50 text-emerald-600",
        },
      ]
    : [];

  const reminderPieTotal = data?.pie.reminders.reduce((a, b) => a + b.value, 0) || 0;
  const taskPieTotal = data?.pie.tasks.reduce((a, b) => a + b.value, 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your CRM activity</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated:{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-pulse h-32"
              />
            ))
          : stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </h3>
              </div>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Reminders Sent */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900">Messages Sent</h3>
            <p className="text-sm text-gray-500">Last 30 days activity</p>
          </div>
          <div className="h-[250px] w-full">
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  <Area type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Task Breakdown</h3>
          <p className="text-sm text-gray-500 mb-8">Tasks by Status</p>
          {loading ? (
            <div className="h-[200px] bg-gray-50 rounded-2xl animate-pulse" />
          ) : (
            <>
              <div className="h-[200px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.pie.tasks}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {data?.pie.tasks.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{taskPieTotal}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasks</span>
                </div>
              </div>
              <div className="mt-8 space-y-4 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {data?.pie.tasks.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-gray-600 truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Reminder Pie Chart */}
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
                    <Pie
                      data={data?.pie.reminders}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {data?.pie.reminders.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{reminderPieTotal}%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracked</span>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {data?.pie.reminders.map((item, i) => (
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

      {/* Recent Activity (Tasks) */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Tasks</h3>
            <p className="text-sm text-gray-500 mt-0.5">Most recently created or updated tasks</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-4">Task ID</th>
                <th className="px-8 py-4">Title & Customer</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Priority</th>
                <th className="px-8 py-4">Due Date</th>
                <th className="px-8 py-4">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-8 py-5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : data?.recentActivity.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-10 text-center text-sm text-gray-500">
                        No recent tasks found.
                      </td>
                    </tr>
                ) : data?.recentActivity.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <span className="text-xs font-bold text-gray-500">{task.taskId || 'NEW'}</span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-semibold text-gray-900 text-sm max-w-[200px] truncate">{task.title}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{task.customerName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border" style={{ backgroundColor: `${task.statusColor}15`, color: task.statusColor, borderColor: `${task.statusColor}30` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.statusColor }} />
                          {task.status}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-medium text-gray-600">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-[10px] font-bold">
                            {task.assignee.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">{task.assignee}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
