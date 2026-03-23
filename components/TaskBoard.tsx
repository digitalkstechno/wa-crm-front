'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, X, LayoutGrid, List, Calendar, Flag,
  MoreVertical, CheckCircle2,
} from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCenter, type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { apiFetch } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';

type TaskPriority = 'Low' | 'Medium' | 'High';

interface TaskStatus {
  _id: string;
  name: string;
  color: string;
  order: number;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<TaskPriority, { text: string; bg: string }> = {
  Low:    { text: 'text-gray-500',  bg: 'bg-gray-100' },
  Medium: { text: 'text-amber-600', bg: 'bg-amber-50' },
  High:   { text: 'text-red-600',   bg: 'bg-red-50' },
};

// Derive light bg/border from hex color
function hexToLight(hex: string) {
  return { bg: `${hex}18`, border: `${hex}40` };
}

// ── Draggable Card ──────────────────────────────────────────────────────────
function DraggableCard({ task, statusColor, onEdit, onDelete, openMenu, setOpenMenu }: {
  task: Task; statusColor: string;
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
  openMenu: string | null; setOpenMenu: (id: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined;

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm transition-shadow ${isDragging ? 'opacity-40 shadow-lg' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-2">
        <div {...listeners} {...attributes} className="flex-1 cursor-grab active:cursor-grabbing">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
          {task.description && (
            <div className="task-desc text-xs text-gray-500 mt-1.5 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: task.description }} />
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].text}`}>
              <Flag className="w-2.5 h-2.5 inline mr-0.5" />{task.priority}
            </span>
            {task.dueDate && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />{new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="relative shrink-0" onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => setOpenMenu(openMenu === task._id ? null : task._id)}
            className="p-1 text-gray-300 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          {openMenu === task._id && (
            <div className="absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-lg z-30 w-32 py-1 text-sm">
              <button onClick={() => onEdit(task)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium">Edit</button>
              <button onClick={() => onDelete(task._id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 font-medium">Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Droppable Column ────────────────────────────────────────────────────────
function DroppableColumn({ status, tasks, isOver, onEdit, onDelete, openMenu, setOpenMenu }: {
  status: TaskStatus; tasks: Task[]; isOver: boolean;
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
  openMenu: string | null; setOpenMenu: (id: string | null) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status.name });
  const { bg, border } = hexToLight(status.color);

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ backgroundColor: bg, borderColor: border }}>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
        <span className="text-xs font-bold text-gray-700">{status.name}</span>
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white text-gray-500">{tasks.length}</span>
      </div>
      <div ref={setNodeRef}
        className={`flex flex-col gap-3 min-h-[120px] rounded-2xl p-2 transition-all ${isOver ? 'border-2 border-dashed' : 'border-2 border-transparent'}`}
        style={isOver ? { borderColor: status.color, backgroundColor: bg } : undefined}
      >
        {tasks.length === 0 && !isOver && (
          <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 text-center text-xs text-gray-300 font-medium">Drop here</div>
        )}
        {tasks.map(t => (
          <DraggableCard key={t._id} task={t} statusColor={status.color}
            onEdit={onEdit} onDelete={onDelete} openMenu={openMenu} setOpenMenu={setOpenMenu} />
        ))}
      </div>
    </div>
  );
}

// ── Overlay Card ────────────────────────────────────────────────────────────
function OverlayCard({ task }: { task: Task }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl w-64 rotate-2 opacity-95">
      <p className="text-sm font-semibold text-gray-900">{task.title}</p>
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].text}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: '', priority: 'Medium' as TaskPriority, dueDate: '' });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [taskRes, statusRes] = await Promise.all([apiFetch('/tasks'), apiFetch('/task-statuses')]);
      const fetchedStatuses: TaskStatus[] = statusRes.data || [];
      setStatuses(fetchedStatuses);
      setTasks(taskRes.data || []);
      if (taskRes.stats) setStats(taskRes.stats);
      // Set default form status to first status
      if (fetchedStatuses.length > 0) {
        setForm(f => ({ ...f, status: f.status || fetchedStatuses[0].name }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', status: statuses[0]?.name || '', priority: 'Medium', dueDate: '' });
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditingTask(t);
    setForm({ title: t.title, description: t.description || '', status: t.status, priority: t.priority, dueDate: t.dueDate ? t.dueDate.split('T')[0] : '' });
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    try {
      const payload = { ...form, dueDate: form.dueDate || undefined };
      if (editingTask) {
        await apiFetch(`/tasks/${editingTask._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t._id !== id));
      setOpenMenu(null);
    } catch (e) { console.error(e); }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t._id === event.active.id);
    if (task) setActiveTask(task);
    setOpenMenu(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    if (overId && statuses.find(s => s.name === overId)) setOverColumn(overId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);
    if (!over) return;
    const newStatus = over.id as string;
    if (!statuses.find(s => s.name === newStatus)) return;
    const task = tasks.find(t => t._id === active.id);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    setStats(prev => ({ ...prev, [oldStatus]: Math.max(0, (prev[oldStatus] || 0) - 1), [newStatus]: (prev[newStatus] || 0) + 1 }));

    try {
      await apiFetch(`/tasks/${task._id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    } catch {
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: oldStatus } : t));
      setStats(prev => ({ ...prev, [newStatus]: Math.max(0, (prev[newStatus] || 0) - 1), [oldStatus]: (prev[oldStatus] || 0) + 1 }));
    }
  };

  return (
    <div className="space-y-6" onClick={() => openMenu && setOpenMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-500 mt-0.5">Drag & drop tasks between columns to update status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 overflow-x-auto pb-1">
        {statuses.map(s => {
          const { bg, border } = hexToLight(s.color);
          return (
            <div key={s._id} className="rounded-2xl p-4 border shrink-0 min-w-[130px]" style={{ backgroundColor: bg, borderColor: border }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-bold text-gray-700">{s.name}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats[s.name] || 0}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(statuses.length, 4)}, minmax(0, 1fr))` }}>
            {statuses.map(status => (
              <DroppableColumn key={status._id} status={status}
                tasks={tasks.filter(t => t.status === status.name)}
                isOver={overColumn === status.name}
                onEdit={openEdit} onDelete={handleDelete}
                openMenu={openMenu} setOpenMenu={setOpenMenu} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeTask ? <OverlayCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <CheckCircle2 className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No tasks yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tasks.map(task => {
                const statusObj = statuses.find(s => s.name === task.status);
                const pc = PRIORITY_CONFIG[task.priority];
                return (
                  <div key={task._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusObj?.color || '#6b7280' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                        {task.description && (
                          <div className="task-desc text-xs text-gray-500 truncate mt-0.5"
                            dangerouslySetInnerHTML={{ __html: task.description }} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${pc.bg} ${pc.text}`}>{task.priority}</span>
                      {statusObj && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${statusObj.color}18`, color: statusObj.color }}>
                          {statusObj.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <div className="relative">
                        <button onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === task._id ? null : task._id); }}
                          className="p-2 text-gray-300 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu === task._id && (
                          <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-32 py-1 text-sm">
                            <button onClick={() => openEdit(task)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 font-medium">Edit</button>
                            <button onClick={() => handleDelete(task._id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 font-medium">Delete</button>
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
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Title *</label>
                <input type="text" placeholder="Task title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <RichTextEditor value={form.description} onChange={html => setForm(f => ({ ...f, description: html }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    {statuses.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    {(['Low', 'Medium', 'High'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-8 pb-7">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={!form.title.trim()}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
