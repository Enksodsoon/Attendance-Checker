import { Card } from '@/components/ui/card';

const items = [
  'user management',
  'course/section management',
  'room/geofence management',
  'session oversight',
  'audit log viewer',
  'export center'
];

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <p className="text-sm text-slate-500">Admin home</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">แผงควบคุมผู้ดูแลระบบ</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
