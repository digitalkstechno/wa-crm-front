'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = pathname.replace('/', '') || 'dashboard';

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
