'use client';

import React from 'react';
import TaskStatusManagement from '@/components/TaskStatusManagement';

export default function TaskStatusSettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Task Statuses</h2>
        <p className="text-sm text-gray-500 mt-0.5">Define and manage the columns for your Task Kanban board</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8">
        <TaskStatusManagement />
      </div>
    </div>
  );
}
