'use client';

import React from 'react';
import StaffHierarchyView from '@/components/StaffHierarchy/StaffHierarchyView';

export default function StaffHierarchyPage() {
  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Hierarchy</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage organization structure, managers, teams, and members</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8">
        <StaffHierarchyView />
      </div>
    </div>
  );
}
