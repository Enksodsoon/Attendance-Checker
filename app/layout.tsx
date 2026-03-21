import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppShell } from '@/components/ui/app-shell';

export const metadata: Metadata = {
  title: 'Attendance Checker MVP',
  description: 'LINE LIFF + Supabase attendance system MVP for universities.'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
