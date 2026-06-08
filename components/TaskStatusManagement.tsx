'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface TaskStatus {
  _id: string;
  name: string;
  color: string;
  order: number;
}

export default function TaskStatusManagement() {
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', color: '#e2e8f0' });

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await apiFetch('/task-status');
      setStatuses(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await apiFetch(`/task-status/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiFetch('/task-status', {
          method: 'POST',
          body: JSON.stringify({ ...form, order: statuses.length })
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setForm({ name: '', color: '#e2e8f0' });
      fetchStatuses();
    } catch (err: any) {
      setError(err.message || 'Failed to save status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this status?')) return;
    try {
      await apiFetch(`/task-status/${id}`, { method: 'DELETE' });
      fetchStatuses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete status');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === statuses.length - 1) return;

    const newStatuses = [...statuses];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newStatuses[index];
    newStatuses[index] = newStatuses[swapIndex];
    newStatuses[swapIndex] = temp;

    // Update orders based on new index
    const updates = newStatuses.map((s, i) => ({ id: s._id, order: i }));

    // Optimistic update
    setStatuses(newStatuses);

    try {
      await apiFetch('/task-status/reorder', {
        method: 'PUT',
        body: JSON.stringify({ statuses: updates })
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reorder statuses');
      fetchStatuses(); // revert
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Task Statuses</h3>
        {!isAdding && !editingId && (
          <button
            onClick={() => { setForm({ name: '', color: '#e2e8f0' }); setIsAdding(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Status
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

      <div className="space-y-3">
        {statuses.map((status, index) => (
          <div key={status._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            {editingId === status._id ? (
              <div className="flex-1 flex items-center gap-4">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500"
                  placeholder="Status Name"
                  autoFocus
                />
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <div className="flex items-center gap-2">
                  <button onClick={handleSave} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleMove(index, 'down')} disabled={index === statuses.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: status.color }} />
                <span className="flex-1 font-semibold text-gray-900">{status.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setForm({ name: status.name, color: status.color }); setEditingId(status._id); setIsAdding(false); }}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(status._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500"
              placeholder="New Status Name"
              autoFocus
            />
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            />
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!loading && statuses.length === 0 && !isAdding && (
          <p className="text-center text-sm text-gray-500 py-8">No task statuses found. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
