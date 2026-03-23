import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export function AdminSectionShell({
  eyebrow,
  title,
  description,
  children
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}>) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <Link href={'/admin' as Route} className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            กลับหน้า Admin home
          </Link>
        </div>
      </Card>
      {children}
    </main>
  );
}
