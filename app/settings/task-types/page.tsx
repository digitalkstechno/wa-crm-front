'use client';

import React from 'react';
import TaskTypeManagement from '@/components/TaskTypeManagement';

export default function TaskTypeSettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Task Types</h2>
        <p className="text-sm text-gray-500 mt-0.5">Define custom task types to categorize your workflow</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8">
        <TaskTypeManagement />
      </div>
    </div>
  );
}
