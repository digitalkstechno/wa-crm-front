'use client';

import React from 'react';
import StaffManagement from '@/components/StaffManagement';

export default function StaffSettingsPage() {
  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage staff members and their roles</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8">
        <StaffManagement />
      </div>
    </div>
  );
}
