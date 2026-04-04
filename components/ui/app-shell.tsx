import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth/session';
import { SessionControls } from '@/components/ui/session-controls';

const links: ReadonlyArray<{ href: Route; label: string }> = [
  { href: '/' as Route, label: 'หน้าหลัก' },
  { href: '/liff' as Route, label: 'นักศึกษา' },
  { href: '/teacher/sessions' as Route, label: 'อาจารย์' },
  { href: '/admin' as Route, label: 'ผู้ดูแลระบบ' }
];

export async function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const currentProfile = await getSessionProfile();

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={'/' as Route} className="text-sm font-semibold text-slate-900">Attendance Checker</Link>
            <nav className="flex flex-wrap gap-2 text-sm">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <SessionControls currentProfile={currentProfile} />
        </div>
      </header>
      {children}
    </div>
  );
}
