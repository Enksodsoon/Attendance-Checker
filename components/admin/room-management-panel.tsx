'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { AdminRoomRecord } from '@/lib/types';

export function RoomManagementPanel() {
  const [items, setItems] = useState<AdminRoomRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [form, setForm] = useState({ roomId: '', roomName: '', latitude: '13.7367', longitude: '100.5231', radiusM: '120', gpsPolicy: 'allow_manual_approval' as AdminRoomRecord['gpsPolicy'] });

  function resetForm() {
    setEditingRoomId(null);
    setForm({ roomId: '', roomName: '', latitude: '13.7367', longitude: '100.5231', radiusM: '120', gpsPolicy: 'allow_manual_approval' });
  }

  async function load() {
    const response = await fetch('/api/admin/rooms', { cache: 'no-store' });
    const json = (await response.json()) as { items: AdminRoomRecord[]; error?: string };
    if (!response.ok) throw new Error(json.error ?? 'โหลดห้องเรียนไม่สำเร็จ');
    setItems(json.items);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'โหลดห้องเรียนไม่สำเร็จ'));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/rooms', {
        method: editingRoomId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          roomId: editingRoomId ?? form.roomId,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radiusM: Number(form.radiusM)
        })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'บันทึกห้องเรียนไม่สำเร็จ');
      resetForm();
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึกห้องเรียนไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(roomId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/rooms?roomId=${roomId}`, { method: 'DELETE' });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'ลบห้องเรียนไม่สำเร็จ');
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบห้องเรียนไม่สำเร็จ');
    }
  }

  function startEdit(item: AdminRoomRecord) {
    setEditingRoomId(item.roomId);
    setForm({
      roomId: item.roomId,
      roomName: item.roomName,
      latitude: String(item.latitude),
      longitude: String(item.longitude),
      radiusM: String(item.radiusM),
      gpsPolicy: item.gpsPolicy
    });
  }

  const tone = { strict: 'red', allow_manual_approval: 'amber' } as const;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div><p className="text-sm text-slate-500">Create room</p><h2 className="text-2xl font-semibold text-slate-900">เพิ่มห้องเรียนและ geofence</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          <input value={form.roomId} onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))} placeholder="ROOM-ID" disabled={Boolean(editingRoomId)} className="rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-100 disabled:text-slate-500" />
          <input value={form.roomName} onChange={(event) => setForm((current) => ({ ...current, roomName: event.target.value }))} placeholder="ชื่อห้องเรียน" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} placeholder="Latitude" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} placeholder="Longitude" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.radiusM} onChange={(event) => setForm((current) => ({ ...current, radiusM: event.target.value }))} placeholder="Radius" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <select value={form.gpsPolicy} onChange={(event) => setForm((current) => ({ ...current, gpsPolicy: event.target.value as AdminRoomRecord['gpsPolicy'] }))} className="rounded-2xl border border-slate-300 px-4 py-3"><option value="allow_manual_approval">allow_manual_approval</option><option value="strict">strict</option></select>
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">{submitting ? 'กำลังบันทึก...' : editingRoomId ? 'อัปเดตห้องเรียน' : 'เพิ่มห้องเรียน'}</button>
        {editingRoomId ? (
          <button type="button" onClick={resetForm} className="ml-3 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">ยกเลิกการแก้ไข</button>
        ) : null}
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.roomId}>
            <h3 className="text-xl font-semibold text-slate-900">{item.roomName}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.roomId} · radius {item.radiusM} เมตร</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={tone[item.gpsPolicy]}>{item.gpsPolicy}</Badge>
              <span className="text-xs text-slate-500">active session: {item.activeSessionId ?? 'ไม่มี'}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => startEdit(item)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">แก้ไข</button>
              <button type="button" onClick={() => handleDelete(item.roomId)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">ลบ</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
