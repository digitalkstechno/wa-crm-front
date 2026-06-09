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
  ChevronDown,
  ChevronUp,
  CheckSquare,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const Sidebar = ({ activeTab, collapsed, setCollapsed }: SidebarProps) => {
  const { logout, staff } = useAuth();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [firmData, setFirmData] = React.useState<any>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    if (staff?.firmId) {
      // Assuming apiFetch handles auth implicitly
      const token = localStorage.getItem('wa_crm_token');
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/firms/${staff.firmId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(res => {
        if (res.data) setFirmData(res.data);
      }).catch(console.error);
    }
  }, [staff?.firmId]);


  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = staff?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className={cn(
      'h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      <div className={cn('p-4 flex items-center border-b border-gray-100', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            {firmData?.logo ? (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white border border-gray-100 shadow-sm">
                <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/v1/api', '')}${firmData.logo}`} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <MessageSquare className="text-white w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight truncate max-w-[130px]">{firmData?.name || 'WA CRM'}</h1>
              <p className="text-[10px] text-gray-400 font-medium">{firmData?.name ? 'Organization' : 'Reminder Suite'}</p>
            </div>
          </div>
        )}
        {collapsed && (
          firmData?.logo ? (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-gray-100 shadow-sm">
              <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/v1/api', '')}${firmData.logo}`} alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
              <MessageSquare className="text-white w-5 h-5" />
            </div>
          )
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
        {menuItems.map((item) => {


          return (
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
          );
        })}
      </nav>

      {/* Customer + Logout */}
      <div className={cn('p-3 border-t border-gray-100 space-y-2', collapsed && 'flex flex-col items-center')}>
        {collapsed ? (
          <>
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center" title={staff?.fullName}>
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
                <p className="text-sm font-semibold text-gray-900 truncate">{staff?.fullName || 'Staff'}</p>
                <p className="text-[10px] text-gray-400 truncate">{staff?.email || ''}</p>
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
