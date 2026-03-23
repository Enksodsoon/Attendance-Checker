'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { AdminUserRecord, AppRole } from '@/lib/types';

export function UserManagementPanel() {
  const [items, setItems] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'teacher' as AppRole });

  async function load() {
    setLoading(true);
    const response = await fetch('/api/admin/users', { cache: 'no-store' });
    const json = (await response.json()) as { items: AdminUserRecord[] };
    setItems(json.items);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
      setLoading(false);
    });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        throw new Error(json.error ?? 'บันทึกผู้ใช้ไม่สำเร็จ');
      }
      setForm({ name: '', email: '', role: 'teacher' });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึกผู้ใช้ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  const roleTone = { student: 'slate', teacher: 'teal', admin: 'amber', super_admin: 'red' } as const;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Create user</p>
          <h2 className="text-2xl font-semibold text-slate-900">เพิ่มผู้ใช้ใหม่</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="ชื่อผู้ใช้" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="email@university.ac.th" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AppRole }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option value="student">student</option>
            <option value="teacher">teacher</option>
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </select>
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: '#ffffff' }}>
          {submitting ? 'กำลังบันทึก...' : 'เพิ่มผู้ใช้'}
        </button>
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <Card>
        <p className="text-sm text-slate-500">Live user list</p>
        <h2 className="text-2xl font-semibold text-slate-900">บัญชีผู้ใช้ในระบบ</h2>
        {loading ? <p className="mt-4 text-sm text-slate-500">กำลังโหลดข้อมูล...</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500"><th className="py-3 pr-4">ชื่อ</th><th className="py-3 pr-4">อีเมล</th><th className="py-3 pr-4">บทบาท</th><th className="py-3 pr-4">สถานะ</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.profileId}>
                  <td className="py-3 pr-4 text-slate-900">{item.name}</td>
                  <td className="py-3 pr-4 text-slate-700">{item.email}</td>
                  <td className="py-3 pr-4"><Badge tone={roleTone[item.role]}>{item.role}</Badge></td>
                  <td className="py-3 pr-4 text-slate-700">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
