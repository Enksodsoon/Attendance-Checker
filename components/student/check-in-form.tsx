'use client';

import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { AttendanceDecision, CheckInPayload, SessionSummary } from '@/lib/types';

type CheckInMethod = 'qr' | 'gps';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; latitude: number; longitude: number; accuracy: number };

export function CheckInForm({
  session,
  initialMethod = 'qr'
}: Readonly<{
  session: SessionSummary;
  initialMethod?: CheckInMethod;
}>) {
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });
  const [method, setMethod] = useState<CheckInMethod>(initialMethod);
  const [qrToken, setQrToken] = useState('demo-token-20260321');
  const [manualReason, setManualReason] = useState('');
  const [decision, setDecision] = useState<AttendanceDecision | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const helperText = useMemo(() => {
    if (geoState.status === 'ready') {
      return `ตำแหน่งพร้อมแล้ว · ความแม่นยำ ${Math.round(geoState.accuracy)} เมตร`;
    }

    if (geoState.status === 'error') {
      return geoState.message;
    }

    if (geoState.status === 'loading') {
      return 'กำลังร้องขอพิกัดจากอุปกรณ์...';
    }

    return 'กรุณาอนุญาต GPS ก่อนเช็กชื่อ';
  }, [geoState]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoState({ status: 'error', message: 'อุปกรณ์นี้ไม่รองรับ Geolocation API' });
      return;
    }

    setGeoState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          status: 'ready',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        setGeoState({ status: 'error', message: `ไม่สามารถดึงพิกัดได้: ${error.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload: CheckInPayload = {
        sessionId: session.sessionId,
        qrToken: method === 'qr' ? qrToken : undefined,
        checkInMethod: method,
        latitude: geoState.status === 'ready' ? geoState.latitude : undefined,
        longitude: geoState.status === 'ready' ? geoState.longitude : undefined,
        gpsAccuracyM: geoState.status === 'ready' ? geoState.accuracy : undefined,
        deviceUserAgent: navigator.userAgent,
        manualReason: manualReason || undefined
      };

      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = (await response.json()) as { decision: AttendanceDecision };
      setDecision(json.decision);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">เช็กชื่อเข้าเรียน</p>
        <h2 className="text-2xl font-semibold text-slate-900">{session.courseCode} · {session.courseNameTh}</h2>
        <p className="mt-2 text-sm text-slate-600">ห้อง {session.room.roomName} · ปิดเช็กชื่อ {new Date(session.window.attendanceCloseAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMethod('qr')}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${method === 'qr' ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
        >
          เช็กอินด้วย QR
        </button>
        <button
          onClick={() => setMethod('gps')}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${method === 'gps' ? 'border-rose-400 bg-rose-500 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
        >
          เช็กอินด้วย GPS
        </button>
      </div>

      <div className="rounded-2xl bg-sky-50 p-4 text-sm text-slate-700">
        <p className="font-medium text-sky-900">ข้อมูลการเข้าถึงตำแหน่ง</p>
        <p className="mt-1">{helperText}</p>
        <button onClick={requestLocation} className="mt-3 rounded-full bg-sky-600 px-4 py-2 font-medium text-white">
          ขอสิทธิ์ตำแหน่ง
        </button>
      </div>

      {method === 'qr' ? (
        <label className="block text-sm font-medium text-slate-700">
          QR token ที่สแกนได้
          <input
            value={qrToken}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setQrToken(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="วาง token หรือ payload ที่สแกนได้"
          />
        </label>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          โหมด GPS จะตรวจสอบว่าคุณอยู่ในรัศมีห้องเรียนและช่วงเวลาเช็กชื่อโดยไม่ต้องกรอก QR
        </div>
      )}

      <label className="block text-sm font-medium text-slate-700">
        เหตุผลขอ manual approval (ถ้ามี)
        <textarea
          value={manualReason}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setManualReason(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="เช่น GPS ในอาคารคลาดเคลื่อนมาก"
        />
      </label>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'กำลังตรวจสอบ...' : `ส่งข้อมูลเช็กชื่อ (${method.toUpperCase()})`}
      </button>

      {decision ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">ผลการตรวจสอบ</p>
          <p className="mt-2">ผลลัพธ์: {decision.status}</p>
          <p>verificationResult: {decision.verificationResult}</p>
          <p>reasonCode: {decision.reasonCode}</p>
          {decision.distanceFromCenterM !== undefined ? <p>ระยะจากห้อง: {decision.distanceFromCenterM.toFixed(1)} เมตร</p> : null}
          {decision.finalAccuracyM !== undefined ? <p>accuracy: {decision.finalAccuracyM.toFixed(1)} เมตร</p> : null}
        </div>
      ) : null}
    </Card>
  );
}
