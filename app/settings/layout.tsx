'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, CheckSquare, Users, User, Share2, Layers } from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine active main tab
  const isTaskSection = pathname.includes('/task-status') || pathname.includes('/task-types');
  const activeMainTab = isTaskSection ? 'task' : 'staff';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Main Tabs */}
        <div className="flex border-b border-gray-100 px-4 pt-4 bg-gray-50/50">
          <Link 
            href="/settings" 
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all ${activeMainTab === 'staff' ? 'border-emerald-500 text-emerald-600 bg-white rounded-t-xl' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-t-xl'}`}
          >
            <Users className="w-4 h-4" />
            Staff Management
          </Link>
          <Link 
            href="/settings/task-status" 
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all ${activeMainTab === 'task' ? 'border-indigo-500 text-indigo-600 bg-white rounded-t-xl' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-t-xl'}`}
          >
            <CheckSquare className="w-4 h-4" />
            Task Management
          </Link>
        </div>

        {/* Sub Tabs */}
        <div className="bg-white px-6 py-4 flex gap-3 shadow-sm relative z-10">
          {activeMainTab === 'staff' && (
            <>
              <Link 
                href="/settings" 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${pathname === '/settings' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'}`}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link 
                href="/settings/staff" 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${pathname === '/settings/staff' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'}`}
              >
                <Users className="w-4 h-4" />
                Staff Directory
              </Link>
              <Link 
                href="/settings/staff-hierarchy" 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${pathname === '/settings/staff-hierarchy' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'}`}
              >
                <Share2 className="w-4 h-4" />
                Staff Hierarchy
              </Link>
            </>
          )}
          {activeMainTab === 'task' && (
            <>
              <Link 
                href="/settings/task-status" 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${pathname === '/settings/task-status' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'}`}
              >
                <Layers className="w-4 h-4" />
                Task Statuses
              </Link>
              <Link 
                href="/settings/task-types" 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${pathname === '/settings/task-types' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'}`}
              >
                <CheckSquare className="w-4 h-4" />
                Task Types
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
