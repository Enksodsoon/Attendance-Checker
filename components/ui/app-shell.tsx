import type { ReactNode } from 'react';
import Link from 'next/link';

const links = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/liff', label: 'นักศึกษา' },
  { href: '/teacher/sessions', label: 'อาจารย์' },
  { href: '/admin', label: 'ผู้ดูแลระบบ' }
];

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="text-sm font-semibold text-slate-900">Attendance Checker</Link>
          <nav className="flex flex-wrap gap-2 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
