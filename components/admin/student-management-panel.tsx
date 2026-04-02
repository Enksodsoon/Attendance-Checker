'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { AdminStudentRecord } from '@/lib/types';

export function StudentManagementPanel() {
  const [items, setItems] = useState<AdminStudentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentCode: '',
    fullNameTh: '',
    facultyName: 'คณะวิศวกรรมศาสตร์',
    departmentName: 'วิศวกรรมซอฟต์แวร์',
    yearLevel: '1',
    email: '',
    status: 'active' as AdminStudentRecord['status']
  });

  function resetForm() {
    setEditingStudentId(null);
    setForm({ studentCode: '', fullNameTh: '', facultyName: 'คณะวิศวกรรมศาสตร์', departmentName: 'วิศวกรรมซอฟต์แวร์', yearLevel: '1', email: '', status: 'active' });
  }

  async function load() {
    const response = await fetch('/api/admin/students', { cache: 'no-store' });
    const json = (await response.json()) as { items: AdminStudentRecord[]; error?: string };
    if (!response.ok) throw new Error(json.error ?? 'โหลดทะเบียนนักศึกษาไม่สำเร็จ');
    setItems(json.items);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'โหลดทะเบียนนักศึกษาไม่สำเร็จ'));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/students', {
        method: editingStudentId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, studentId: editingStudentId, yearLevel: Number(form.yearLevel) })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'บันทึกนักศึกษาไม่สำเร็จ');
      resetForm();
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึกนักศึกษาไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(studentId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/students?studentId=${studentId}`, { method: 'DELETE' });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'ลบนักศึกษาไม่สำเร็จ');
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบนักศึกษาไม่สำเร็จ');
    }
  }

  function startEdit(item: AdminStudentRecord) {
    setEditingStudentId(item.studentId);
    setForm({
      studentCode: item.studentCode,
      fullNameTh: item.fullNameTh,
      facultyName: item.facultyName,
      departmentName: item.departmentName,
      yearLevel: String(item.yearLevel),
      email: item.email,
      status: item.status
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Create student</p>
          <h2 className="text-2xl font-semibold text-slate-900">เพิ่มนักศึกษาใหม่</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input value={form.studentCode} onChange={(event) => setForm((current) => ({ ...current, studentCode: event.target.value }))} placeholder="รหัสนักศึกษา" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.fullNameTh} onChange={(event) => setForm((current) => ({ ...current, fullNameTh: event.target.value }))} placeholder="ชื่อ-นามสกุล" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="อีเมล (ถ้ามี)" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.facultyName} onChange={(event) => setForm((current) => ({ ...current, facultyName: event.target.value }))} placeholder="คณะ" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.departmentName} onChange={(event) => setForm((current) => ({ ...current, departmentName: event.target.value }))} placeholder="ภาควิชา" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.yearLevel} onChange={(event) => setForm((current) => ({ ...current, yearLevel: event.target.value }))} placeholder="ชั้นปี" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminStudentRecord['status'] }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="suspended">suspended</option>
          </select>
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          {submitting ? 'กำลังบันทึก...' : editingStudentId ? 'อัปเดตนักศึกษา' : 'เพิ่มนักศึกษา'}
        </button>
        {editingStudentId ? (
          <button type="button" onClick={resetForm} className="ml-3 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            ยกเลิกการแก้ไข
          </button>
        ) : null}
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.studentId}>
            <h3 className="text-xl font-semibold text-slate-900">{item.studentCode} · {item.fullNameTh}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.facultyName} / {item.departmentName} · ชั้นปี {item.yearLevel}</p>
            <p className="mt-1 text-sm text-slate-500">LINE: {item.lineUserId ?? 'ยังไม่ได้ bind'} · ลงทะเบียน {item.enrolledSectionIds.length} ตอนเรียน</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => startEdit(item)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">แก้ไข</button>
              <button type="button" onClick={() => handleDelete(item.studentId)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">ลบ</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
