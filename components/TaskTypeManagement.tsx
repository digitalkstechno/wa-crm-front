'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface TaskType {
  _id: string;
  name: string;
  color: string;
}

export default function TaskTypeManagement() {
  const [types, setTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', color: '#3b82f6' });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await apiFetch('/task-type');
      setTypes(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch task types');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await apiFetch(`/task-type/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiFetch('/task-type', {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setForm({ name: '', color: '#3b82f6' });
      fetchTypes();
    } catch (err: any) {
      setError(err.message || 'Failed to save type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task type?')) return;
    try {
      await apiFetch(`/task-type/${id}`, { method: 'DELETE' });
      fetchTypes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete type');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Task Types</h3>
        {!isAdding && !editingId && (
          <button
            onClick={() => { setForm({ name: '', color: '#3b82f6' }); setIsAdding(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Type
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

      <div className="space-y-3">
        {types.map((type) => (
          <div key={type._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            {editingId === type._id ? (
              <div className="flex-1 flex items-center gap-4">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500"
                  placeholder="Type Name"
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
                <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: type.color }} />
                <span className="flex-1 font-semibold text-gray-900">{type.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setForm({ name: type.name, color: type.color }); setEditingId(type._id); setIsAdding(false); }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
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
          <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500"
              placeholder="New Type Name"
              autoFocus
            />
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            />
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!loading && types.length === 0 && !isAdding && (
          <p className="text-center text-sm text-gray-500 py-8">No task types found. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}
