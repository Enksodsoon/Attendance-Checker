'use client';

import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { AttendanceDecision, CheckInPayload, SessionSummary } from '@/lib/types';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; latitude: number; longitude: number; accuracy: number };

type CheckInResponse = {
  decision: AttendanceDecision;
  attemptId: string;
};

const decisionMessageMap: Record<AttendanceDecision['reasonCode'], string> = {
  ok_present: 'เช็กชื่อสำเร็จและนับเป็นมาเรียน',
  ok_late: 'เช็กชื่อสำเร็จและนับเป็นเข้าสาย',
  session_not_open: 'คาบนี้ยังไม่เปิดหรือไม่พบข้อมูลคาบเรียน',
  not_enrolled: 'คุณไม่ได้ลงทะเบียนในรายวิชานี้',
  outside_time_window: 'เกินเวลาหรือยังไม่ถึงเวลาเช็กชื่อ',
  duplicate_check_in: 'คุณเช็กชื่อสำเร็จไปแล้วก่อนหน้านี้',
  invalid_qr: 'QR token ไม่ถูกต้องหรือหมดอายุ',
  gps_missing: 'ยังไม่มีข้อมูลตำแหน่งเพียงพอ',
  gps_accuracy_poor: 'GPS ยังไม่แม่นยำพอ ระบบจึงเปิดทางให้ส่งคำร้อง manual approval ต่อได้',
  outside_geofence: 'ตำแหน่งอยู่นอกพื้นที่ที่อนุญาต'
};

export function CheckInForm({
  session,
  initialQrToken
}: Readonly<{
  session: SessionSummary;
  initialQrToken: string;
}>) {
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });
  const [qrToken, setQrToken] = useState(initialQrToken);
  const [manualReason, setManualReason] = useState('GPS ในอาคารไม่เสถียร แต่เช็กชื่อจากห้องเรียนจริง');
  const [decision, setDecision] = useState<AttendanceDecision | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (geoState.status === 'ready') {
      return `ตำแหน่งพร้อมแล้ว · accuracy ${Math.round(geoState.accuracy)} ม.`;
    }

    if (geoState.status === 'error') {
      return geoState.message;
    }

    if (geoState.status === 'loading') {
      return 'กำลังร้องขอพิกัดจากอุปกรณ์...';
    }

    return 'กรุณาอนุญาต GPS ก่อนสแกน QR';
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
    setErrorMessage(null);
    setManualStatus(null);

    try {
      const payload: CheckInPayload = {
        sessionId: session.sessionId,
        qrToken,
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

      const json = (await response.json()) as CheckInResponse & { error?: string };
      if (!response.ok || !json.decision) {
        throw new Error(json.error ?? 'ส่งข้อมูลเช็กชื่อไม่สำเร็จ');
      }

      setDecision(json.decision);
      setAttemptId(json.attemptId);
      if (json.decision.verificationResult === 'accepted') {
        setManualStatus('เช็กชื่อสำเร็จแล้ว รายการนี้จะปรากฏในหน้า history และ live monitor ทันที');
      }
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : 'ส่งข้อมูลเช็กชื่อไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManualApproval() {
    if (!attemptId) {
      setManualStatus('ยังไม่มี attendance attempt สำหรับส่งคำร้อง');
      return;
    }

    setManualSubmitting(true);
    setManualStatus(null);

    try {
      const response = await fetch('/api/student/manual-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          attendanceAttemptId: attemptId,
          reasonText: manualReason || 'ขอให้อาจารย์ตรวจสอบเนื่องจาก GPS ไม่เสถียรในอาคาร'
        })
      });

      const payload = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'ส่งคำร้องไม่สำเร็จ');
      }

      setManualStatus('ส่งคำร้อง manual approval สำเร็จแล้ว รายการนี้จะไปอยู่ในหน้า admin/teacher queue');
    } catch (manualError) {
      setManualStatus(manualError instanceof Error ? manualError.message : 'ส่งคำร้องไม่สำเร็จ');
    } finally {
      setManualSubmitting(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Session detail / eligibility</p>
        <h2 className="text-2xl font-semibold text-slate-900">{session.courseCode} · {session.courseNameTh}</h2>
        <p className="mt-2 text-sm text-slate-600">
          ห้อง {session.room.roomName} · ปิดเช็กชื่อ{' '}
          {new Date(session.window.attendanceCloseAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-medium">Permission screen</p>
        <p className="mt-1">{helperText}</p>
        <button onClick={requestLocation} className="mt-3 inline-flex min-w-44 items-center justify-center rounded-full bg-teal-600 px-4 py-2 font-medium text-white">
          ขอสิทธิ์ตำแหน่ง
        </button>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        QR token ที่สแกนได้
        <input
          value={qrToken}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQrToken(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="วาง token หรือ payload ที่สแกนได้"
        />
      </label>

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
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
        style={{ color: '#ffffff' }}
      >
        {submitting ? 'กำลังตรวจสอบ...' : 'ส่งข้อมูลเช็กชื่อ'}
      </button>

      {errorMessage ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}

      {decision ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Live validation result</p>
          <p className="mt-2">ผลลัพธ์: {decision.status}</p>
          <p>{decisionMessageMap[decision.reasonCode]}</p>
          <p>verificationResult: {decision.verificationResult}</p>
          {decision.distanceFromCenterM !== undefined ? <p>ระยะจากห้อง: {decision.distanceFromCenterM.toFixed(1)} เมตร</p> : null}
          {decision.finalAccuracyM !== undefined ? <p>accuracy: {decision.finalAccuracyM.toFixed(1)} เมตร</p> : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/liff" className="rounded-full bg-emerald-700 px-4 py-2 font-medium text-white">
              กลับหน้า Home
            </Link>
            <Link href="/liff/history" className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700">
              ดูประวัติการเช็กชื่อ
            </Link>
            {decision.requiresManualApproval ? (
              <button
                onClick={handleManualApproval}
                disabled={manualSubmitting}
                className="rounded-full bg-amber-500 px-4 py-2 font-medium text-white disabled:opacity-60"
              >
                {manualSubmitting ? 'กำลังส่งคำร้อง...' : 'ส่งคำร้อง Manual Approval'}
              </button>
            ) : null}
          </div>

          {manualStatus ? <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-800">{manualStatus}</p> : null}
        </div>
      ) : null}
    </Card>
  );
}
