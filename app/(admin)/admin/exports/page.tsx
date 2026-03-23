import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { Card } from '@/components/ui/card';
import { getAdminExports } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

export default function AdminExportsPage() {
  const exportsList = getAdminExports();

  return (
    <AdminSectionShell
      eyebrow="Admin / export center"
      title="ศูนย์รวมการส่งออกข้อมูล"
      description="รวมลิงก์ดาวน์โหลดและ payload inspection ที่ผู้ดูแลต้องใช้งานจริงในระบบปัจจุบัน เพื่อให้กดตรวจสอบผลลัพธ์ได้ทันที."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {exportsList.map((item) => (
          <Card key={item.id}>
            <h2 className="text-xl font-semibold text-slate-900">{item.label}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            <a href={item.href} className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: '#ffffff' }}>
              เปิดลิงก์นี้
            </a>
          </Card>
        ))}
      </div>
    </AdminSectionShell>
  );
}
