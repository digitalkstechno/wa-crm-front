'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  FileText, 
  Settings, 
  MessageSquare,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const { logout, user } = useAuth();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <MessageSquare className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">WA CRM</h1>
          <p className="text-xs text-gray-500 font-medium">Reminder Suite</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.id === 'dashboard' ? '/' : `/${item.id}`}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-emerald-50 text-emerald-600 shadow-sm" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
            )} />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'User'}</p>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{user?.email || ''}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
