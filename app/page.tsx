
  {
    title: 'นักศึกษาใน LINE LIFF',
    href: '/liff',
    description: 'เช็กชื่อผ่าน QR + GPS + ช่วงเวลา พร้อม fallback ขออนุมัติด้วยตนเอง'
  },
  {
    title: 'แดชบอร์ดอาจารย์',
    href: '/teacher/sessions/demo-session',
    description: 'ดูสถานะรายชื่อแบบสด แสดง QR และส่งออก CSV'
  },
  {
    title: 'แดชบอร์ดผู้ดูแลระบบ',
    href: '/admin',
    description: 'จัดการโครงสร้างรายวิชา ห้องเรียน ผู้ใช้ และบันทึกการตรวจสอบ'
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
          MVP พร้อมต่อยอด
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          ระบบเช็กชื่อมหาวิทยาลัยผ่าน LINE LIFF + Supabase
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          โครงสร้างนี้เน้นความเสถียร แยกชั้นบริการชัดเจน และใช้ attendance engine เดียวใน MVP: GPS + QR + time window.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>
            <p className="mt-4 text-sm font-medium text-teal-700">เปิดดูหน้าจอหลัก →</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
