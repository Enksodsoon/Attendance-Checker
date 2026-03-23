import type { Route } from 'next';
import Link from 'next/link';
import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getAdminUsers } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

const roleTone = {
  student: 'slate',
  teacher: 'teal',
  admin: 'amber',
  super_admin: 'red'
} as const;

export default function AdminUsersPage() {
  const users = getAdminUsers();

  return (
    <AdminSectionShell
      eyebrow="Admin / user management"
      title="จัดการผู้ใช้"
      description="ตรวจสอบบทบาทและสถานะของโปรไฟล์ในระบบปัจจุบัน พร้อมทางลัดไปยังหน้าที่เกี่ยวข้องกับการตรวจสอบการใช้งานจริง."
    >
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Identity registry</p>
            <h2 className="text-2xl font-semibold text-slate-900">บัญชีผู้ใช้ในระบบ</h2>
          </div>
          <Link href={'/admin/audit-logs' as Route} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            ตรวจสอบ audit log
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4">ชื่อ</th>
                <th className="py-3 pr-4">อีเมล</th>
                <th className="py-3 pr-4">บทบาท</th>
                <th className="py-3 pr-4">สถานะ</th>
                <th className="py-3 pr-4">ใช้งานล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.profileId}>
                  <td className="py-3 pr-4 text-slate-900">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.profileId}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{user.email}</td>
                  <td className="py-3 pr-4"><Badge tone={roleTone[user.role]}>{user.role}</Badge></td>
                  <td className="py-3 pr-4 text-slate-700">{user.status}</td>
                  <td className="py-3 pr-4 text-slate-700">{new Date(user.lastActiveAt).toLocaleString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminSectionShell>
  );
}
