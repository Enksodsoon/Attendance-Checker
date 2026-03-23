import { Card } from '@/components/ui/card';

export function StatCard({ label, value, helper }: Readonly<{ label: string; value: string; helper?: string }>) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </Card>
  );
}
