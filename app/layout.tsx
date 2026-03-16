import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import SidebarWrapper from '@/components/SidebarWrapper';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'WA CRM - Reminder Suite',
  description: 'A powerful WhatsApp CRM for managing customers, reminders, and message templates.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased text-gray-900" suppressHydrationWarning>
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
