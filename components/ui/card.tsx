import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return <section className={cn('rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm', className)}>{children}</section>;
}
