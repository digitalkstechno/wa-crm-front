'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Columns, List, Calendar, User, X, Clock, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';

interface TaskStatus { _id: string; name: string; color: string; order: number; }
interface TaskType { _id: string; name: string; color: string; }
interface Staff { _id: string; fullName: string; email: string; }
interface CustomerCustomer { _id: string; name: string; email: string; phone: string; }

interface Task {
  _id: string;
  taskId?: string;
  title: string;
  description: string;
  type?: TaskType;
  status: TaskStatus;
  
  customer?: CustomerCustomer;
  
  assignedTo: Staff | null;
  assignedRM?: Staff | null;
  priority?: string;
  
  sendCustomerReminder?: boolean;
  customerTemplate?: { _id: string; name: string; body: string } | null;
  sendStaffReminder?: boolean;
  staffTemplate?: { _id: string; name: string; body: string } | null;
  
  taskDate?: string | null;
  dueDate: string | null;
  dueTime?: string;
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const getTodayLocal = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function TasksPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customersList, setCustomersList] = useState<CustomerCustomer[]>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const initialForm = {
    title: '', description: '', type: '', status: '',
    customer: '',
    assignedTo: '', priority: 'Medium',
    taskDate: getTodayLocal(), dueDate: '', dueTime: '',
    sendCustomerReminder: false,
    customerTemplate: '',
    sendStaffReminder: false,
    staffTemplate: ''
  };
  
  const [form, setForm] = useState<any>(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [taskRes, statusRes, typeRes, staffRes, customerRes, templateRes] = await Promise.all([
        apiFetch('/tasks'),
        apiFetch('/task-status'),
        apiFetch('/task-type'),
        apiFetch('/staff'),
        apiFetch('/customers'),
        apiFetch('/templates?limit=100')
      ]);
      setTasks(taskRes.data || []);
      setStatuses(statusRes.data || []);
      setTaskTypes(typeRes.data || []);
      setStaff(staffRes.data || []);
      setCustomersList(customerRes.data || []);
      setTemplatesList(templateRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.status || !form.taskDate || !form.dueDate) {
      return alert('Please fill in all required fields (*)');
    }
    
    try {
      if (editingTask) {
        await apiFetch(`/tasks/${editingTask._id}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to save task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const openAddModal = (statusId?: string) => {
    setEditingTask(null);
    setForm({ 
      ...initialForm,
      status: statusId || (statuses.length > 0 ? statuses[0]._id : ''), 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description || '',
      type: t.type?._id || '',
      status: t.status?._id || '',
      
      customer: t.customer?._id || '',
      
      assignedTo: t.assignedTo ? t.assignedTo._id : '',
      priority: t.priority || 'Medium',
      
      taskDate: t.taskDate ? new Date(t.taskDate).toISOString().split('T')[0] : '',
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      dueTime: t.dueTime || '',
      sendCustomerReminder: t.sendCustomerReminder || false,
      customerTemplate: t.customerTemplate ? (typeof t.customerTemplate === 'object' ? (t.customerTemplate as any)._id : t.customerTemplate) : '',
      sendStaffReminder: t.sendStaffReminder || false,
      staffTemplate: t.staffTemplate ? (typeof t.staffTemplate === 'object' ? (t.staffTemplate as any)._id : t.staffTemplate) : '',
    });
    setIsModalOpen(true);
  };

  // Drag and drop for Kanban
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const previousTasks = [...tasks];
    setTasks(tasks.map(t => {
      if (t._id === taskId) {
        const newStatus = statuses.find(s => s._id === statusId);
        return { ...t, status: newStatus || t.status };
      }
      return t;
    }));
    setDraggedTaskId(null);

    try {
      await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statusId })
      });
    } catch (err) {
      setTasks(previousTasks);
      alert('Failed to update task status');
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'No date';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch(priority) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading Tasks...</div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your team's workflow and assignments</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <button
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${view === 'kanban' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              title="Kanban View"
            >
              <Columns className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${view === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {statuses.length === 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">No Task Statuses Defined</p>
            <p className="text-xs mt-0.5">Please go to Settings &gt; Task Statuses to create statuses before adding tasks.</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'kanban' ? (
          <div className="h-full flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {statuses.map(status => {
              const columnTasks = tasks.filter(t => t.status?._id === status._id);
              return (
                <div
                  key={status._id}
                  className="flex-shrink-0 w-80 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 h-full"
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, status._id)}
                >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: status.color }} />
                      <h3 className="font-bold text-gray-900 text-sm">{status.name}</h3>
                      <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                    </div>
                    <button onClick={() => openAddModal(status._id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                    {columnTasks.map(task => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task._id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                        className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:border-emerald-200 hover:shadow-md transition-all group ${draggedTaskId === task._id ? 'opacity-50 scale-95' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-gray-400">{task.taskId || 'NEW'}</span>
                          <div className="flex items-center gap-1.5">
                            {task.type && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider" style={{ borderColor: task.type.color, color: task.type.color, backgroundColor: `${task.type.color}10` }}>
                                {task.type.name}
                              </span>
                            )}
                            {task.priority && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">{task.title}</h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => openEditModal(task)} className="p-1 text-gray-400 hover:text-emerald-600 rounded">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteTask(task._id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {task.customer && (
                          <div className="flex flex-col gap-0.5 mb-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-700">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="font-semibold truncate">{task.customer.name}</span>
                            </div>
                            {task.customer.phone && (
                              <div className="pl-4 text-[10px] text-gray-500">
                                {task.customer.phone}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          {task.assignedTo ? (
                            <div className="flex items-center gap-1.5" title={task.assignedTo.fullName}>
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {task.assignedTo.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-medium text-gray-600 truncate max-w-[80px]">{task.assignedTo.fullName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3" />
                              </div>
                              <span className="text-[10px] font-medium text-gray-400">Unassigned</span>
                            </div>
                          )}
                          
                          {task.dueDate && (
                            <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md shrink-0 ${new Date(task.dueDate) < new Date() ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                              <Clock className="w-3 h-3" />
                              {formatDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Task ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Title & Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Assignee</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">No tasks found.</td>
                    </tr>
                  ) : (
                    tasks.map(task => (
                      <tr key={task._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-gray-500">{task.taskId || 'NEW'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 text-sm max-w-xs truncate">{task.title}</p>
                          {task.customer && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                              {task.customer.name} {task.customer.phone ? `- ${task.customer.phone}` : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.type && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border" style={{ borderColor: task.type.color, color: task.type.color, backgroundColor: `${task.type.color}10` }}>
                              {task.type.name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.status && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border" style={{ backgroundColor: `${task.status.color}15`, color: task.status.color, borderColor: `${task.status.color}30` }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.status.color }} />
                              {task.status.name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.priority && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                {task.assignedTo.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{task.assignedTo.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${task.dueDate && new Date(task.dueDate) < new Date() ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                            {formatDate(task.dueDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(task)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTask(task._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal (Huge Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Column 1 */}
                <div className="space-y-6">
                  {/* Section: Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Information</h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Title *</label>
                      <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 border border-transparent transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                      <RichTextEditor value={form.description} onChange={val => setForm({ ...form, description: val })} placeholder="Enter task details/description..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Type</label>
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 border border-transparent transition-all appearance-none">
                        <option value="">Select a Task Type</option>
                        {taskTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Section: Customer Info */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Customer Information</h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Name</label>
                      <select value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all appearance-none">
                        <option value="">No Customer Linked</option>
                        {customersList.map(u => <option key={u._id} value={u._id}>{u.name} {u.phone ? `- ${u.phone}` : `(${u.email})`}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  {/* Section: Task Assignment */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Task Assignment</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign To</label>
                        <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all appearance-none">
                          <option value="">Unassigned</option>
                          {staff.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all appearance-none">
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status *</label>
                      <select required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all appearance-none">
                        <option value="" disabled>Select status</option>
                        {statuses.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Section: Date & Time */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Date & Time</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Date *</label>
                        <input required type="date" value={form.taskDate} onChange={e => setForm({ ...form, taskDate: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date *</label>
                        <input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Time</label>
                      <input type="time" value={form.dueTime} onChange={e => setForm({ ...form, dueTime: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all" />
                    </div>
                  </div>

                  {/* Section: WhatsApp Notifications */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">WhatsApp Notifications</h4>
                    <div className="space-y-4">
                      {/* Customer Reminder Checkbox & Select */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.sendCustomerReminder}
                            onChange={e => setForm({ ...form, sendCustomerReminder: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-500 border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">Customer Reminder</span>
                        </label>
                        {form.sendCustomerReminder && (
                          <div className="pl-6 space-y-1.5 animate-in fade-in duration-200">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Customer Template</label>
                            <select
                              value={form.customerTemplate}
                              onChange={e => setForm({ ...form, customerTemplate: e.target.value })}
                              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all appearance-none"
                            >
                              <option value="">Select a template</option>
                              {templatesList.map(tmpl => (
                                <option key={tmpl._id} value={tmpl._id}>{tmpl.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Staff Reminder Checkbox & Select */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.sendStaffReminder}
                            onChange={e => setForm({ ...form, sendStaffReminder: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-500 border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">Staff Reminder</span>
                        </label>
                        {form.sendStaffReminder && (
                          <div className="pl-6 space-y-1.5 animate-in fade-in duration-200">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Staff Template</label>
                            <select
                              value={form.staffTemplate}
                              onChange={e => setForm({ ...form, staffTemplate: e.target.value })}
                              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-300 transition-all appearance-none"
                            >
                              <option value="">Select a template</option>
                              {templatesList.map(tmpl => (
                                <option key={tmpl._id} value={tmpl._id}>{tmpl.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="pt-8 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="py-3 px-8 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
