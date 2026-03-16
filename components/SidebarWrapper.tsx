'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from './AuthProvider';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoggedIn && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (!isLoggedIn) return null;

  const activeTab = pathname.replace('/', '').split('/')[0] || 'dashboard';

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <Sidebar activeTab={activeTab} setActiveTab={() => {}} />
      <div className="pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-8 lg:p-12">
          {children}
        </div>
      </div>
    </main>
  );
}
