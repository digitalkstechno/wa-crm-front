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
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const Sidebar = ({ activeTab, collapsed, setCollapsed }: SidebarProps) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className={cn(
      'h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      {/* Logo + Toggle */}
      <div className={cn('p-4 flex items-center border-b border-gray-100', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight">WA CRM</h1>
              <p className="text-[10px] text-gray-400 font-medium">Reminder Suite</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="text-white w-5 h-5" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 mt-3 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.id === 'dashboard' ? '/' : `/${item.id}`}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
              collapsed ? 'justify-center' : '',
              activeTab === item.id
                ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon className={cn(
              'w-5 h-5 shrink-0 transition-colors',
              activeTab === item.id ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
            )} />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className={cn('p-3 border-t border-gray-100 space-y-2', collapsed && 'flex flex-col items-center')}>
        {collapsed ? (
          <>
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center" title={user?.fullName}>
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'User'}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-100 bg-red-50 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
