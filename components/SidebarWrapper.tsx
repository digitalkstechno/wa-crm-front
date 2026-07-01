'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from './AuthProvider';
import { Menu, MessageSquare } from 'lucide-react';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!loading && !isLoggedIn && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoginPage, loading, router]);

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) return null;
  if (isLoginPage) return <>{children}</>;
  if (!isLoggedIn) return null;

  const activeTab = pathname.replace('/', '').split('/')[0] || 'dashboard';

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <MessageSquare className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-gray-900 text-sm">WP CRM</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -mr-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={() => {}} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <div className={`${collapsed ? 'md:pl-[72px]' : 'md:pl-64'} pt-16 md:pt-0 min-h-screen transition-all duration-300`}>
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </div>
    </main>
  );
}
