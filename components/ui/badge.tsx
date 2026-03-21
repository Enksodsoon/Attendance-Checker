import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function Badge({ children, tone = 'slate' }: Readonly<{ children: ReactNode; tone?: 'slate' | 'teal' | 'amber' | 'red' }>) {
  const palette = {
    slate: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-100 text-teal-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700'
  };

  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', palette[tone])}>{children}</span>;
}
