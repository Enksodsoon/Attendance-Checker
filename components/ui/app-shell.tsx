import type { ReactNode } from 'react';

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="min-h-screen bg-transparent text-slate-900">{children}</div>;
}
