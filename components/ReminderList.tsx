"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Users,
  Hash,
  Check,
  ChevronRight,
  FileText,
  Repeat,
  Download 
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";

type ReminderStatus = "Scheduled" | "Pending" | "Sent" | "Failed";

interface Reminder {
  _id: string;
  customerName?: string;
  customer?: { _id: string; name: string; phone?: string };
  customers?: { _id: string; name: string; phone?: string }[];
  groups?: { _id: string; name: string }[];
  recipientType?: "new" | "customers" | "groups";
  title: string;
  reminderName?: string;
  scheduledAt: string;
  status: ReminderStatus;
  type: string;
  template?: { _id: string; name: string; body?: string } | string;
  newName?: string;
  newPhone?: string;
  assignedTo?: { _id: string; fullName: string } | string | null;
  repeat?: {
    enabled: boolean;
    frequency?: "day" | "week" | "month" | "year";
    interval?: number;
    days?: number[];
    monthDay?: number;
    startDate?: string;
    ends?: "never" | "on" | "after";
    endDate?: string;
    afterCount?: number;
  };
}

// --- Modal UI state and data fetching ---

const statusConfig: Record<
  ReminderStatus,
  { bg: string; text: string; label: string }
> = {
  Scheduled: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    label: "Scheduled",
  },
  Pending: { bg: "bg-blue-50", text: "text-blue-600", label: "Pending" },
  Sent: { bg: "bg-gray-100", text: "text-gray-600", label: "Sent" },
  Failed: { bg: "bg-red-50", text: "text-red-600", label: "Failed" },
};

type Tab = "upcoming" | "completed" | "failed";

const tabFilter: Record<Tab, (r: Reminder) => boolean> = {
  upcoming: (r) => r.status === "Scheduled" || r.status === "Pending",
  completed: (r) => r.status === "Sent",
  failed: (r) => r.status === "Failed",
};

type Template = {
  _id: string;
  name: string;
  body: string;
};

type Group = {
  _id: string;
  name: string;
  color: string;
  members?: { _id: string; name: string; phone: string }[];
};

type RecipientType = "new" | "customers" | "groups";

const formatPhone = (val: string) => {
  if (!val) return '+91 ';
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 10);
  if (digits.length === 0) return '+91 ';
  if (digits.length <= 5) return `+91 ${digits}`;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
};

const ReminderList = () => {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const [showModal, setShowModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingReminder, setViewingReminder] = useState<Reminder | null>(null);

  // Modal wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recipientType, setRecipientType] = useState<RecipientType | null>(
    null,
  );
  // New number
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("+91 ");

  const handleNewPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;
    
    if (!inputVal.startsWith('+91 ')) {
      if (inputVal === '+91' || inputVal === '+9' || inputVal === '+' || inputVal === '') {
        inputVal = '+91 ';
      } else {
        const digits = inputVal.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length > 10) {
          inputVal = '+91 ' + digits.slice(2);
        } else {
          inputVal = '+91 ' + digits;
        }
      }
    }

    const suffix = inputVal.slice(4);
    let digits = suffix.replace(/\D/g, '');
    digits = digits.slice(0, 10);
    
    let formatted = '+91 ';
    if (digits.length > 0) {
      if (digits.length <= 5) {
        formatted = `+91 ${digits}`;
      } else {
        formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
      }
    }
    
    setNewPhone(formatted);
  };
  // Customers
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState<Record<string, string>>(
    {},
  );
  const [selectedCustomers, setSelectedCustomers] = useState<
    { id: string; name: string; phone: string }[]
  >([]);
  // Groups
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  // Template
  const [reminderName, setReminderName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  // Repeat
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFreq, setRepeatFreq] = useState<
    "day" | "week" | "month" | "year"
  >("week");
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatMonthDay, setRepeatMonthDay] = useState(1);
  const [repeatStartDate, setRepeatStartDate] = useState("");
  const [repeatEnds, setRepeatEnds] = useState<"never" | "on" | "after">(
    "never",
  );
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [repeatAfterCount, setRepeatAfterCount] = useState(1);

  const [assignedTo, setAssignedTo] = useState<string>("");
  const [staffList, setStaffList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState({ sent: 0, pending: 0, failed: 0 });
  const [filterDate, setFilterDate] = useState<"today" | "week" | "month" | "">(
    "",
  );
  //search
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [reminderSearchQuery, setReminderSearchQuery] = useState("");
  //filter
  const [filterType, setFilterType] = useState<"customer" | "reminder" | "">(
    "",
  );
  const [filterValue, setFilterValue] = useState("");

  const [showInlineTemplateForm, setShowInlineTemplateForm] = useState(false);
  const [inlineTemplateName, setInlineTemplateName] = useState("");
  const [inlineTemplateBody, setInlineTemplateBody] = useState("");
  const [savingInlineTemplate, setSavingInlineTemplate] = useState(false);

  const fetchReminders = async (tab?: Tab) => {
    try {
      setLoading(true);
      const filterTab = tab || activeTab;
      const data = await apiFetch(`/reminders?filterType=${filterTab}`);

      const allReminders: Reminder[] = data.data || [];
      const clientFiltered = allReminders.filter(tabFilter[filterTab]);
      setReminders(clientFiltered);

      const [upData, comData, failData] = await Promise.all([
        apiFetch(`/reminders?filterType=upcoming`),
        apiFetch(`/reminders?filterType=completed`),
        apiFetch(`/reminders?filterType=failed`),
      ]);

      setStats({
        pending: (upData.data || []).filter(
          (r: Reminder) => r.status === "Scheduled" || r.status === "Pending",
        ).length,
        sent: (comData.data || []).filter((r: Reminder) => r.status === "Sent")
          .length,
        failed: (failData.data || []).filter(
          (r: Reminder) => r.status === "Failed",
        ).length,
      });
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [gData, tData, sData] = await Promise.all([
        apiFetch("/customer-groups/all"),
        apiFetch("/templates"),
        apiFetch("/staff"),
      ]);
      setGroups(gData.data || []);
      setTemplates(tData.data || []);
      setStaffList(sData.data || []);
    } catch (err) {
      console.error("Failed to fetch dependencies:", err);
    }
  };

  // Fetch reminders when tab changes
  useEffect(() => {
    fetchReminders();
  }, [activeTab]);

  // Fetch dependencies only once on mount
  useEffect(() => {
    fetchDependencies();
  }, []);

  const resetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setStep(1);
    setRecipientType(null);
    setNewName("");
    setNewPhone("+91 ");
    setCustomerSearch({});
    setExpandedGroup(null);
    setSelectedCustomers([]);
    setSelectedGroups([]);
    setReminderName("");
    setSelectedTemplate(null);
    setSchedDate("");
    setSchedTime("");
    setRepeatEnabled(false);
    setRepeatFreq("week");
    setRepeatInterval(1);
    setRepeatDays([]);
    setRepeatMonthDay(1);
    setRepeatStartDate("");
    setRepeatEnds("never");
    setRepeatEndDate("");
    setRepeatAfterCount(1);
    setShowInlineTemplateForm(false);
    setInlineTemplateName("");
    setInlineTemplateBody("");
    setAssignedTo("");
  };

  const toggleCustomer = (c: { id: string; name: string; phone: string }) => {
    setSelectedCustomers((prev) =>
      prev.find((x) => x.id === c.id)
        ? prev.filter((x) => x.id !== c.id)
        : [...prev, c],
    );
  };

  const toggleGroup = (gid: string) => {
    setSelectedGroups((prev) =>
      prev.includes(gid) ? prev.filter((x) => x !== gid) : [...prev, gid],
    );
  };

  const step1Valid = recipientType !== null;
  const step2Valid = (() => {
    if (recipientType === "new") {
      const digits = newPhone.replace(/\D/g, '');
      const actualDigits = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
      return newName.trim() !== "" && newPhone.trim() !== "" && actualDigits.length === 10;
    }
    if (recipientType === "customers") return selectedCustomers.length > 0;
    if (recipientType === "groups") return selectedGroups.length > 0;
    return false;
  })();
  const step3Valid = schedDate !== "" && schedTime !== "";

  const allCustomerNames = Array.from(
    new Set(
      reminders
        .map((r) => {
          if (r.recipientType === "customers" && r.customers?.length)
            return r.customers.map((c) => c.name).join(", ");
          if (r.recipientType === "groups" && r.groups?.length)
            return r.groups.map((g) => g.name).join(", ");
          return r.customer?.name || r.newName || "";
        })
        .filter(Boolean),
    ),
  );

  const allReminderNames = Array.from(
    new Set(reminders.map((r) => r.reminderName || r.title).filter(Boolean)),
  );

  const filtered = reminders.filter((r) => {
    const matchesCustomer = (() => {
      if (!customerSearchQuery) return true;
      const cname = (() => {
        if (r.recipientType === "customers" && r.customers?.length)
          return r.customers.map((c) => c.name).join(", ");
        if (r.recipientType === "groups" && r.groups?.length)
          return r.groups.map((g) => g.name).join(", ");
        return r.customer?.name || r.newName || "";
      })();
      return cname.toLowerCase().includes(customerSearchQuery.toLowerCase());
    })();

    const matchesReminder = (() => {
      if (!reminderSearchQuery) return true;
      const rname = r.reminderName || r.title || "";
      return rname.toLowerCase().includes(reminderSearchQuery.toLowerCase());
    })();

    return matchesCustomer && matchesReminder;
  });

  const handleEdit = async (reminder: Reminder) => {
    setOpenMenu(null);
    try {
      // Fetch full reminder details
      const res = await apiFetch(`/reminders/${reminder._id}`);
      const r = res.data;

      setEditingId(r._id);
      setRecipientType(r.recipientType || "new");
      setNewName(r.newName || "");
      setNewPhone(formatPhone(r.newPhone || ""));
      setSelectedCustomers(
        r.customers?.map((c: any) => ({
          id: c._id,
          name: c.name,
          phone: c.phone || "",
        })) || [],
      );
      setSelectedGroups(r.groups?.map((g: any) => g._id) || []);
      setReminderName(r.reminderName || "");

      const tplId =
        typeof r.template === "object" ? r.template?._id : r.template;
      setSelectedTemplate(tplId || null);

      const assignId = typeof r.assignedTo === "object" ? r.assignedTo?._id : r.assignedTo;
      setAssignedTo(assignId || "");

      const d = new Date(r.scheduledAt);
      setSchedDate(d.toISOString().split("T")[0]);
      setSchedTime(d.toTimeString().slice(0, 5));

      if (r.repeat) {
        setRepeatEnabled(r.repeat.enabled || false);
        setRepeatFreq(r.repeat.frequency || "week");
        setRepeatInterval(r.repeat.interval || 1);
        setRepeatDays(r.repeat.days || []);
        setRepeatMonthDay(r.repeat.monthDay || 1);
        setRepeatStartDate(
          r.repeat.startDate
            ? new Date(r.repeat.startDate).toISOString().split("T")[0]
            : "",
        );
        setRepeatEnds(r.repeat.ends || "never");
        setRepeatEndDate(
          r.repeat.endDate
            ? new Date(r.repeat.endDate).toISOString().split("T")[0]
            : "",
        );
        setRepeatAfterCount(r.repeat.afterCount || 1);
      }

      setStep(1);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to load reminder for editing:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/reminders/${id}`, { method: "DELETE" });
      setReminders((prev) => prev.filter((r) => r._id !== id));
      setOpenMenu(null);
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await apiFetch(`/reminders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Scheduled" }),
      });
      setOpenMenu(null);
      fetchReminders();
    } catch (err) {
      console.error("Failed to retry reminder:", err);
    }
  };

  const handleClone = async (reminder: Reminder) => {
    try {
      setOpenMenu(null);

      const res = await apiFetch(`/reminders/${reminder._id}`);
      const full = res.data;

      const originalDate = new Date(full.scheduledAt);
      const now = new Date();

      const newScheduledAt =
        originalDate <= now
          ? new Date(
              now.getFullYear() + 1,
              originalDate.getMonth(),
              originalDate.getDate(),
              originalDate.getHours(),
              originalDate.getMinutes(),
            )
          : originalDate;

      const payload = {
        title: full.title,
        reminderName: `${full.reminderName || full.title} (Copy)`,
        recipientType: full.recipientType,
        template:
          typeof full.template === "object"
            ? full.template?._id
            : full.template,
        scheduledAt: newScheduledAt,
        status: "Scheduled",
        newName: full.newName,
        newPhone: full.newPhone,

        customers: full.customers?.map((c: any) => c._id || c) || [],
        groups: full.groups?.map((g: any) => g._id || g) || [],
        repeat: full.repeat,
      };

      await apiFetch("/reminders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setActiveTab("upcoming");
      await fetchReminders("upcoming");
    } catch (err) {
      console.error("Failed to clone reminder:", err);
    }
  };

 const handleExportExcel = async () => {
  try {
    const [upData, comData, failData] = await Promise.all([
      apiFetch(`/reminders?filterType=upcoming`),
      apiFetch(`/reminders?filterType=completed`),
      apiFetch(`/reminders?filterType=failed`),
    ]);

    const formatRows = (data: Reminder[]) =>
      data.map((r) => {
        const customerName = (() => {
          if (r.recipientType === "customers" && r.customers?.length)
            return r.customers.map((c) => c.name).join(", ");
          if (r.recipientType === "groups" && r.groups?.length)
            return r.groups.map((g) => g.name).join(", ");
          return r.customer?.name || r.newName || "—";
        })();

        const phone = (() => {
          if (r.recipientType === "new") return r.newPhone || "—";
          if (r.recipientType === "customers" && r.customers?.length === 1)
            return r.customers[0].phone || "—";
          return "—";
        })();

        const d = new Date(r.scheduledAt);

        return {
          "Reminder Name": r.reminderName || r.title || "—",
          "Customer": customerName,
          "Phone": phone,
          "Template": typeof r.template === "object" ? r.template?.name || "—" : "—",
          "Scheduled Date": d.toLocaleDateString(),
          "Scheduled Time": d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          "Status": r.status,
          "Type": r.type || "—",
          "Repeat": r.repeat?.enabled
            ? `Every ${r.repeat.interval} ${r.repeat.frequency}(s)`
            : "No",
        };
      });

    const colWidths = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();

    // Sheet 1 — Upcoming
    const upRows = formatRows(
      (upData.data || []).filter(
        (r: Reminder) => r.status === "Scheduled" || r.status === "Pending"
      )
    );
    const upSheet = XLSX.utils.json_to_sheet(
      upRows.length ? upRows : [{ "Reminder Name": "No data" }]
    );
    upSheet["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(workbook, upSheet, "Upcoming");

    // Sheet 2 — Completed
    const comRows = formatRows(
      (comData.data || []).filter((r: Reminder) => r.status === "Sent")
    );
    const comSheet = XLSX.utils.json_to_sheet(
      comRows.length ? comRows : [{ "Reminder Name": "No data" }]
    );
    comSheet["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(workbook, comSheet, "Completed");

    // Sheet 3 — Failed
    const failRows = formatRows(
      (failData.data || []).filter((r: Reminder) => r.status === "Failed")
    );
    const failSheet = XLSX.utils.json_to_sheet(
      failRows.length ? failRows : [{ "Reminder Name": "No data" }]
    );
    failSheet["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(workbook, failSheet, "Failed");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `reminders-report-${today}.xlsx`);

  } catch (err) {
    console.error("Failed to export:", err);
  }
};
  const tabCount: Record<Tab, number> = {
    upcoming: stats.pending,
    completed: stats.sent,
    failed: stats.failed,
  };

  const now = new Date();
  const minDate = now.toISOString().split("T")[0];
  const minTime =
    schedDate === minDate
      ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      : "00:00";

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
    { key: "failed", label: "Failed" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
        </div>


        <div className="flex items-center gap-3">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
         Excel
        </button>
          {/* Customer Search Box */}
          <div className="flex items-center bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-emerald-500 text-white text-xs font-bold ml-1 px-3 py-2.5 whitespace-nowrap">
              Customer
            </div>
            <div className="relative border-l border-gray-100">
              <input
                type="text"
                placeholder="Search customer"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="pl-4 py-2.5 text-sm focus:outline-none w-36"
              />
            </div>
          </div>

          {/* Reminder Search Box */}
          <div className="flex items-center bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-emerald-500 text-white text-xs font-bold ml-1 px-3 py-2.5 whitespace-nowrap">
              Reminder
            </div>
            <div className="relative border-l border-gray-100">
              <input
                type="text"
                placeholder="Search reminder"
                value={reminderSearchQuery}
                onChange={(e) => setReminderSearchQuery(e.target.value)}
                className="pl-4 pr-4 py-2.5 text-sm focus:outline-none w-36"
              />
            </div>
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
          <p className="text-xs text-emerald-600 font-medium mt-1">
            +18% from yesterday
          </p>
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
          <p className="text-xs text-red-600 font-medium mt-1">
            Requires attention
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-visible">
        <div className="px-8 pt-6 pb-0 border-b border-gray-100 flex items-centerpx-8 pt-6 pb-0 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-sm font-bold px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "text-emerald-600 border-emerald-500"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    activeTab === tab.key
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {tabCount[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <Bell className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No reminders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((reminder) => {
              const s = statusConfig[reminder.status] || statusConfig.Scheduled;
              const customerName = (() => {
                if (
                  reminder.recipientType === "customers" &&
                  reminder.customers &&
                  reminder.customers.length > 0
                ) {
                  const names = reminder.customers.map((c) => c.name);
                  return names.length <= 2
                    ? names.join(", ")
                    : `${names[0]}, ${names[1]} +${names.length - 2}`;
                }
                if (
                  reminder.recipientType === "groups" &&
                  reminder.groups &&
                  reminder.groups.length > 0
                ) {
                  const names = reminder.groups.map((g) => g.name);
                  return names.length <= 2
                    ? names.join(", ")
                    : `${names[0]}, ${names[1]} +${names.length - 2}`;
                }
                return (
                  reminder.customer?.name || reminder.newName || reminder.title
                );
              })();
              const dateObj = new Date(reminder.scheduledAt);
              return (
                <div
                  key={reminder._id}
                  className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100 shrink-0">
                      {customerName
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {reminder.reminderName || reminder.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <User className="w-3 h-3" /> {customerName}
                        </span>
                        {reminder.recipientType === "new" &&
                          reminder.newPhone && (
                            <>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Phone className="w-3 h-3" />{" "}
                                {reminder.newPhone}
                              </span>
                            </>
                          )}
                        {reminder.recipientType === "customers" &&
                          reminder.customers &&
                          reminder.customers.length === 1 &&
                          reminder.customers[0].phone && (
                            <>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Phone className="w-3 h-3" />{" "}
                                {reminder.customers[0].phone}
                              </span>
                            </>
                          )}
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MessageSquare className="w-3 h-3" /> {reminder.type}
                        </span>
                        {typeof reminder.template === "object" &&
                          reminder.template?.name && (
                            <>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <FileText className="w-3 h-3" />{" "}
                                {reminder.template.name}
                              </span>
                            </>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Right: date/time + status + menu */}
                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-800 justify-end">
                        <Calendar className="w-3 h-3 text-gray-400" />{" "}
                        {dateObj.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-0.5">
                        <Clock className="w-3 h-3" />{" "}
                        {dateObj.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${s.bg} ${s.text} w-20 text-center`}
                    >
                      {s.label}
                    </span>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === reminder._id ? null : reminder._id,
                          )
                        }
                        className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === reminder._id && (
                        <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-10 w-36 py-1 text-sm">
                          <button
                            onClick={async () => {
                              setOpenMenu(null);
                              try {
                                const res = await apiFetch(
                                  `/reminders/${reminder._id}`,
                                );
                                setViewingReminder(res.data);
                              } catch {
                                setViewingReminder(reminder);
                              }
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(reminder)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleClone(reminder)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium"
                          >
                            Clone
                          </button>
                          {reminder.status === "Failed" && (
                            <button
                              onClick={() => handleRetry(reminder._id)}
                              className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-600 font-medium"
                            >
                              Retry
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(reminder._id)}
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
                <h3 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Reminder" : "Create Reminder"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === 1 && "Step 1 of 3 — Choose recipient type"}
                  {step === 2 && "Step 2 of 3 — Select recipients"}
                  {step === 3 && "Step 3 of 3 — Template & schedule"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`rounded-full transition-all ${
                        s === step
                          ? "w-5 h-2 bg-emerald-500"
                          : s < step
                            ? "w-2 h-2 bg-emerald-300"
                            : "w-2 h-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={resetModal}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Step 1 — Recipient Type */}
            {step === 1 && (
              <div className="px-8 py-6 space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Reminder Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Follow-up Reminder"
                    value={reminderName}
                    onChange={(e) => setReminderName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
                {[
                  {
                    type: "new" as RecipientType,
                    icon: Phone,
                    label: "New Number",
                    desc: "Enter a name and phone number manually",
                  },
                  {
                    type: "customers" as RecipientType,
                    icon: Users,
                    label: "Customers",
                    desc: "Pick from existing customers by group",
                  },
                  {
                    type: "groups" as RecipientType,
                    icon: Hash,
                    label: "Groups",
                    desc: "Select entire groups — all members included",
                  },
                ].map(({ type, icon: Icon, label, desc }) => (
                  <button
                    key={type}
                    onClick={() => setRecipientType(type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      recipientType === type
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl ${
                        recipientType === type
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-bold ${recipientType === type ? "text-emerald-700" : "text-gray-800"}`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    {recipientType === type && (
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Recipient Details */}
            {step === 2 && (
              <div className="px-8 py-6">
                {/* New Number */}
                {recipientType === "new" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 xxxxx xxxxx"
                        value={newPhone}
                        onChange={handleNewPhoneChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                )}

                {recipientType === "customers" && (
                  <div className="space-y-2">
                    {selectedCustomers.length > 0 && (
                      <p className="text-xs font-bold text-emerald-600 mb-3">
                        {selectedCustomers.length} customer
                        {selectedCustomers.length > 1 ? "s" : ""} selected
                      </p>
                    )}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {groups.map((group) => {
                        const groupSearch = (
                          customerSearch[group._id] || ""
                        ).toLowerCase();
                        const filteredMembers = groupSearch
                          ? group.members?.filter(
                              (m) =>
                                m.name.toLowerCase().includes(groupSearch) ||
                                m.phone.toLowerCase().includes(groupSearch),
                            )
                          : group.members;
                        return (
                          <div
                            key={group._id}
                            className="border border-gray-100 rounded-2xl overflow-hidden"
                          >
                            <button
                              onClick={() =>
                                setExpandedGroup(
                                  expandedGroup === group._id
                                    ? null
                                    : group._id,
                                )
                              }
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: group.color }}
                                />
                                <span className="text-sm font-semibold text-gray-800">
                                  {group.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {group.members?.length || 0} members
                                </span>
                              </div>
                              <ChevronRight
                                className={`w-4 h-4 text-gray-400 transition-transform ${expandedGroup === group._id ? "rotate-90" : ""}`}
                              />
                            </button>
                            {expandedGroup === group._id && (
                              <div className="border-t border-gray-50">
                                {/* Search inside group */}
                                <div className="relative px-3 py-2 bg-gray-50/50">
                                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                  <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={customerSearch[group._id] || ""}
                                    onChange={(e) =>
                                      setCustomerSearch((prev) => ({
                                        ...prev,
                                        [group._id]: e.target.value,
                                      }))
                                    }
                                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                                  />
                                </div>
                                <div className="divide-y divide-gray-50">
                                  {filteredMembers &&
                                  filteredMembers.length > 0 ? (
                                    filteredMembers.map((member) => {
                                      const isSelected =
                                        !!selectedCustomers.find(
                                          (x) => x.id === member._id,
                                        );
                                      return (
                                        <button
                                          key={member._id}
                                          onClick={() =>
                                            toggleCustomer({
                                              id: member._id,
                                              name: member.name,
                                              phone: member.phone,
                                            })
                                          }
                                          className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                                            isSelected
                                              ? "bg-emerald-50"
                                              : "hover:bg-gray-50"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div
                                              className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected
                                                  ? "bg-emerald-500 border-emerald-500"
                                                  : "border-gray-300"
                                              }`}
                                            >
                                              {isSelected && (
                                                <Check className="w-2.5 h-2.5 text-white" />
                                              )}
                                            </div>
                                            <span className="text-sm text-gray-700 font-medium">
                                              {member.name}
                                            </span>
                                          </div>
                                          <span className="text-xs text-gray-400">
                                            {member.phone}
                                          </span>
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <p className="text-xs text-gray-400 text-center py-3 italic">
                                      No customers found
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Groups — multi select */}
                {recipientType === "groups" && (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {selectedGroups.length > 0 && (
                      <p className="text-xs font-bold text-emerald-600 mb-1">
                        {groups
                          .filter((g) => selectedGroups.includes(g._id))
                          .reduce(
                            (a, g) => a + (g.members?.length || 0),
                            0,
                          )}{" "}
                        members across {selectedGroups.length} group
                        {selectedGroups.length > 1 ? "s" : ""}
                      </p>
                    )}
                    {groups.map((group) => {
                      const isSelected = selectedGroups.includes(group._id);
                      const isExpanded = expandedGroup === group._id;
                      return (
                        <div
                          key={group._id}
                          className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-gray-200"
                        >
                          {/* Group Header */}
                          <div
                            className={`flex items-center justify-between p-3.5 transition-colors ${isSelected ? "bg-emerald-50/50" : ""}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <button
                                onClick={() => toggleGroup(group._id)}
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>
                              <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => toggleGroup(group._id)}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: group.color }}
                                />
                                <div>
                                  <p
                                    className={`text-sm font-bold ${isSelected ? "text-emerald-700" : "text-gray-800"}`}
                                  >
                                    {group.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                    {group.members?.length || 0} members
                                  </p>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                setExpandedGroup(isExpanded ? null : group._id)
                              }
                              className={`p-2 rounded-xl transition-all ${isExpanded ? "bg-gray-100 text-gray-600 rotate-90" : "text-gray-400 hover:bg-gray-50"}`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Member List (Accordion) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-gray-50 bg-gray-50/30 overflow-hidden"
                              >
                                <div className="p-3 space-y-2">
                                  {group.members && group.members.length > 0 ? (
                                    group.members.map((member) => (
                                      <div
                                        key={member._id}
                                        className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-50 shadow-xs"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                                            {member.name
                                              .split(" ")
                                              .map((w) => w[0])
                                              .join("")
                                              .toUpperCase()
                                              .slice(0, 2)}
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold text-gray-700">
                                              {member.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                              {member.phone}
                                            </p>
                                          </div>
                                        </div>
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-emerald-400" : "bg-gray-200 opacity-50"}`}
                                        />
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-400 text-center py-2 italic font-medium">
                                      No members in this group
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Template & Schedule */}
            {step === 3 && (
              <div className="px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Template */}
                {/* Template */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Message Template
                    </label>
                    <button
                      onClick={() => setShowInlineTemplateForm((p) => !p)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New
                    </button>
                  </div>

                  {/* Inline Create Form */}
                  {showInlineTemplateForm && (
                    <div className="mb-3 p-4 border-2 border-emerald-200 bg-emerald-50/30 rounded-2xl space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                          Template Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Welcome Message"
                          value={inlineTemplateName}
                          onChange={(e) =>
                            setInlineTemplateName(e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                          Message Body
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Hello! 👋 ..."
                          value={inlineTemplateBody}
                          onChange={(e) =>
                            setInlineTemplateBody(e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (
                              !inlineTemplateName.trim() ||
                              !inlineTemplateBody.trim()
                            )
                              return;
                            setSavingInlineTemplate(true);
                            try {
                              const data = await apiFetch("/templates", {
                                method: "POST",
                                body: JSON.stringify({
                                  name: inlineTemplateName.trim(),
                                  body: inlineTemplateBody.trim(),
                                }),
                              });
                              // નવું template list માં ઉમેરો અને auto-select કરો
                              const newTemplate = data.data;
                              setTemplates((prev) => [newTemplate, ...prev]);
                              setSelectedTemplate(newTemplate._id);
                              // Form reset
                              setInlineTemplateName("");
                              setInlineTemplateBody("");
                              setShowInlineTemplateForm(false);
                            } catch (err) {
                              console.error("Failed to create template:", err);
                            } finally {
                              setSavingInlineTemplate(false);
                            }
                          }}
                          disabled={
                            savingInlineTemplate ||
                            !inlineTemplateName.trim() ||
                            !inlineTemplateBody.trim()
                          }
                          className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {savingInlineTemplate ? "Saving..." : "Add Template"}
                        </button>
                        <button
                          onClick={() => {
                            setShowInlineTemplateForm(false);
                            setInlineTemplateName("");
                            setInlineTemplateBody("");
                          }}
                          className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Template List */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {templates.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => setSelectedTemplate(t._id)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${
                          selectedTemplate === t._id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${selectedTemplate === t._id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold ${selectedTemplate === t._id ? "text-emerald-700" : "text-gray-800"}`}
                          >
                            {t.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {t.body}
                          </p>
                        </div>
                        {selectedTemplate === t._id && (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>



                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={schedDate}
                        onChange={(e) => {
                          setSchedDate(e.target.value);
                          setSchedTime("");
                        }}
                        min={minDate}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="time"
                        value={schedTime}
                        onChange={(e) => setSchedTime(e.target.value)}
                        min={minTime}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Repeat Toggle */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setRepeatEnabled((p) => !p)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${repeatEnabled ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Repeat className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        Repeat
                      </span>
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full transition-colors relative ${repeatEnabled ? "bg-emerald-500" : "bg-gray-200"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${repeatEnabled ? "left-5" : "left-0.5"}`}
                      />
                    </div>
                  </button>

                  {repeatEnabled && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                      {/* Frequency pills */}
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                          Frequency
                        </label>
                        <div className="flex gap-2">
                          {(["day", "week", "month", "year"] as const).map(
                            (f) => (
                              <button
                                key={f}
                                onClick={() => {
                                  setRepeatFreq(f);
                                  setRepeatDays([]);
                                }}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                                  repeatFreq === f
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                              >
                                {f}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Every N */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
                          Every
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={repeatInterval}
                          onChange={(e) =>
                            setRepeatInterval(
                              Math.max(1, Number(e.target.value)),
                            )
                          }
                          className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <span className="text-sm text-gray-500">
                          {repeatFreq}
                          {repeatInterval > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Week — day picker */}
                      {repeatFreq === "week" && (
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            On days
                          </label>
                          <div className="flex gap-1.5">
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                              <button
                                key={i}
                                onClick={() =>
                                  setRepeatDays((prev) =>
                                    prev.includes(i)
                                      ? prev.filter((x) => x !== i)
                                      : [...prev, i],
                                  )
                                }
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                  repeatDays.includes(i)
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Month — day of month */}
                      {repeatFreq === "month" && (
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
                            On day
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={repeatMonthDay}
                            onChange={(e) =>
                              setRepeatMonthDay(
                                Math.min(
                                  31,
                                  Math.max(1, Number(e.target.value)),
                                ),
                              )
                            }
                            className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <span className="text-sm text-gray-500">
                            of each month
                          </span>
                        </div>
                      )}

                      {/* Start date */}
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                          Starts on
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="date"
                            value={repeatStartDate}
                            onChange={(e) => setRepeatStartDate(e.target.value)}
                            min={schedDate || minDate}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      {/* Ends */}
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                          Ends
                        </label>
                        <div className="space-y-2">
                          {(["never", "on", "after"] as const).map((opt) => (
                            <label
                              key={opt}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <div
                                onClick={() => setRepeatEnds(opt)}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  repeatEnds === opt
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {repeatEnds === opt && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-700 capitalize w-12">
                                {opt}
                              </span>
                              {opt === "on" && repeatEnds === "on" && (
                                <div className="relative flex-1">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                  <input
                                    type="date"
                                    value={repeatEndDate}
                                    onChange={(e) =>
                                      setRepeatEndDate(e.target.value)
                                    }
                                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                              )}
                              {opt === "after" && repeatEnds === "after" && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={999}
                                    value={repeatAfterCount}
                                    onChange={(e) =>
                                      setRepeatAfterCount(
                                        Math.max(1, Number(e.target.value)),
                                      )
                                    }
                                    className="w-16 px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                  <span className="text-sm text-gray-500">
                                    occurrences
                                  </span>
                                </div>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 px-8 pb-7">
              <button
                onClick={() =>
                  step === 1
                    ? resetModal()
                    : setStep((s) => (s - 1) as 1 | 2 | 3)
                }
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>
              <button
                onClick={() => {
                  if (step < 3) {
                    setStep((s) => (s + 1) as 1 | 2 | 3);
                    return;
                  }
                  // Final submit
                  const handleFinalSubmit = async () => {
                    try {
                      const payload = {
                        title:
                          templates.find((t) => t._id === selectedTemplate)
                            ?.name || "Reminder",
                        reminderName,
                        recipientType,
                        template: selectedTemplate,
                        scheduledAt: new Date(`${schedDate}T${schedTime}`),
                        newName,
                        newPhone,
                        customers: selectedCustomers.map((c) => c.id),
                        groups: selectedGroups,
                        assignedTo: assignedTo || null,
                        repeat: {
                          enabled: repeatEnabled,
                          frequency: repeatFreq,
                          interval: repeatInterval,
                          days: repeatDays,
                          monthDay: repeatMonthDay,
                          startDate: repeatStartDate
                            ? new Date(repeatStartDate)
                            : undefined,
                          ends: repeatEnds,
                          endDate: repeatEndDate
                            ? new Date(repeatEndDate)
                            : undefined,
                          afterCount: repeatAfterCount,
                        },
                      };

                      if (editingId) {
                        await apiFetch(`/reminders/${editingId}`, {
                          method: "PUT",
                          body: JSON.stringify(payload),
                        });
                      } else {
                        await apiFetch("/reminders", {
                          method: "POST",
                          body: JSON.stringify(payload),
                        });
                      }
                      fetchReminders();
                      resetModal();
                    } catch (err) {
                      console.error("Failed to save reminder:", err);
                    }
                  };
                  handleFinalSubmit();
                }}
                disabled={
                  step === 1
                    ? !step1Valid
                    : step === 2
                      ? !step2Valid
                      : !step3Valid
                }
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === 3
                  ? editingId
                    ? "Save Changes"
                    : "Create Reminder"
                  : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Reminder Modal */}
      {viewingReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Reminder Details
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Full information for this reminder
                </p>
              </div>
              <button
                onClick={() => setViewingReminder(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Recipient Info */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Recipients
                </label>
                {viewingReminder.recipientType === "customers" &&
                viewingReminder.customers &&
                viewingReminder.customers.length > 0 ? (
                  viewingReminder.customers.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100">
                          {c.name
                            .split(" ")
                            .map((w: string) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {c.name}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        <Phone className="w-3 h-3" />
                        {c.phone || "N/A"}
                      </span>
                    </div>
                  ))
                ) : viewingReminder.recipientType === "groups" &&
                  viewingReminder.groups ? (
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-gray-900">
                      {viewingReminder.groups.map((g) => g.name).join(", ")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100">
                        {(
                          viewingReminder.customer?.name ||
                          viewingReminder.newName ||
                          "?"
                        )
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {viewingReminder.customer?.name ||
                          viewingReminder.newName ||
                          "N/A"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      <Phone className="w-3 h-3" />
                      {viewingReminder.customer?.phone ||
                        viewingReminder.newPhone ||
                        "N/A"}
                    </span>
                  </div>
                )}
              </div>

              {/* Message / Template */}
              <div className="border border-gray-100 rounded-2xl p-5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                  Message Content
                </label>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {typeof viewingReminder.template === "object"
                        ? viewingReminder.template.name
                        : "Custom Message"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {typeof viewingReminder.template === "object"
                        ? viewingReminder.template.body
                        : viewingReminder.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-2">
              <button
                onClick={() => setViewingReminder(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderList;
