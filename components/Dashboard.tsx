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
//calender
import {
  Users,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

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
  Sent: "bg-emerald-50 text-emerald-600",
  Pending: "bg-blue-50 text-blue-600",
  Scheduled: "bg-blue-50 text-blue-600",
  Failed: "bg-red-50 text-red-600",
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  //calender
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarReminders, setCalendarReminders] = useState<
    Record<
      string,
      { title: string; status: string; customerName: string; time: string }[]
    >
  >({});

  const [selectedDayReminders, setSelectedDayReminders] = useState<{
    date: string;
    items: {
      title: string;
      status: string;
      customerName: string;
      time: string;
    }[];
  } | null>(null);

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

  //calender function
  const fetchCalendarReminders = async () => {
    try {
      const [upData, comData, failData] = await Promise.all([
        apiFetch(`/reminders?filterType=upcoming`),
        apiFetch(`/reminders?filterType=completed`),
        apiFetch(`/reminders?filterType=failed`),
      ]);

      const all = [
        ...(upData.data || []),
        ...(comData.data || []),
        ...(failData.data || []),
      ];

      const grouped: Record<
        string,
        { title: string; status: string; customerName: string; time: string }[]
      > = {};
      all.forEach((r: any) => {
        const d = new Date(r.scheduledAt);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          title: r.reminderName || r.title || "—",
          status: r.status,
          customerName:
            r.customers?.map((c: any) => c.name).join(", ") ||
            r.groups?.map((g: any) => g.name).join(", ") ||
            r.customer?.name ||
            r.newName ||
            "—",
          time: d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      });
      setCalendarReminders(grouped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = data
    ? [
        {
          label: "Total Customers",
          value: data.stats.totalCustomers.toLocaleString(),
          icon: Users,
          color: "bg-emerald-50 text-emerald-600",
        },
        {
          label: "Active Reminders",
          value: data.stats.activeReminders.toLocaleString(),
          icon: Clock,
          color: "bg-blue-50 text-blue-600",
        },
        {
          label: "Messages Sent Today",
          value: data.stats.sentToday.toLocaleString(),
          icon: Send,
          color: "bg-emerald-50 text-emerald-600",
        },
        {
          label: "Failed Today",
          value: data.stats.failedToday.toLocaleString(),
          icon: AlertCircle,
          color: "bg-red-50 text-red-600",
        },
      ]
    : [];

  const pieTotal = data?.pie.reduce((a, b) => a + b.value, 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400">
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
          className="flex items-center justify-center gap-2 p-2 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>

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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
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
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Reminder Status
          </h3>
          <p className="text-sm text-gray-500 mb-8">Current distribution</p>
          {loading ? (
            <div className="h-[200px] bg-gray-50 rounded-2xl animate-pulse" />
          ) : (
            <>
              <div className="h-[200px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.pie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {data?.pie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {pieTotal}%
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Tracked
                  </span>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {data?.pie.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          <button
            onClick={() => {
              setShowCalendar(true);
              fetchCalendarReminders();
            }}
            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-gray-50">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6">
                  <div className="h-4 bg-gray-100 rounded animate-pulse mb-3" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
              ))
            : data?.recentActivity.map((activity) => {
                const d = new Date(activity.scheduledAt);
                return (
                  <div key={activity._id} className="p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                          {activity.customerName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {activity.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.title}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusStyle[activity.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {activity.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {d.toLocaleDateString()}{" "}
                      {d.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
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
                      <tr
                        key={activity._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                              {activity.customerName
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {activity.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-gray-600">
                          {activity.title}
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-gray-500">
                          {d.toLocaleDateString()}{" "}
                          {d.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${statusStyle[activity.status] || "bg-gray-100 text-gray-500"}`}
                          >
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

      {/*  calender */}

      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl my-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-8 pt-7 pb-5 border-b border-gray-100 gap-4 sm:gap-0">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <button
                  onClick={() =>
                    setCalendarDate(
                      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-lg font-bold text-gray-900 sm:w-44 text-center">
                  {calendarDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={() =>
                    setCalendarDate(
                      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="hidden sm:block p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setShowCalendar(false)}
                className="sm:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Body */}
            <div className="px-4 md:px-6 py-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] md:text-[11px] font-bold text-gray-400 uppercase py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 border-l border-t border-gray-100">
                {(() => {
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  // Monday start: 0=Mon,...,6=Sun
                  const startOffset = (firstDay + 6) % 7;
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const today = new Date();
                  const cells = [];

                  // Empty cells
                  for (let i = 0; i < startOffset; i++) {
                    cells.push(
                      <div
                        key={`e${i}`}
                        className="border-r border-b border-gray-100 min-h-[100px] bg-gray-50/30"
                      />,
                    );
                  }

                  // Day cells
                  for (let day = 1; day <= daysInMonth; day++) {
                    const key = `${year}-${month + 1}-${day}`;
                    const dayReminders = calendarReminders[key] || [];
                    const isToday =
                      today.getDate() === day &&
                      today.getMonth() === month &&
                      today.getFullYear() === year;

                    cells.push(
                      <div
                        key={day}
                        className="border-r border-b border-gray-100 min-h-[100px] p-1.5 flex flex-col"
                      >
                        {/* Date number */}
                        <div className="flex justify-center mb-1">
                          <span
                            className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? "bg-emerald-500 text-white" : "text-gray-600"}`}
                          >
                            {day}
                          </span>
                        </div>

                        {/* Reminders — show max 2, then "+N more" */}
                        <div className="space-y-0.5 flex-1">
                          {dayReminders.slice(0, 2).map((r, i) => {
                            const bg =
                              r.status === "Sent"
                                ? "bg-emerald-500"
                                : r.status === "Failed"
                                  ? "bg-red-500"
                                  : "bg-blue-500";
                            return (
                              <div
                                key={i}
                                className={`${bg} text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md truncate leading-tight`}
                              >
                                {r.title}
                              </div>
                            );
                          })}
                          {dayReminders.length > 2 && (
                            <div className="text-[9px] font-bold text-gray-400 px-1">
                              +{dayReminders.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>,
                    );
                  }

                  return cells;
                })()}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-5 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span className="text-xs text-gray-500 font-medium">
                    Scheduled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-xs text-gray-500 font-medium">
                    Sent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-xs text-gray-500 font-medium">
                    Failed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
