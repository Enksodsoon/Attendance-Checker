'use client';

import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

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
  sessions,
  initialQrToken
}: Readonly<{
  session: SessionSummary;
  sessions: SessionSummary[];
  initialQrToken: string;
}>) {
  const router = useRouter();
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' });
  const [qrToken, setQrToken] = useState(initialQrToken);
  const [manualReason, setManualReason] = useState('GPS ในอาคารไม่เสถียร แต่เช็กชื่อจากห้องเรียนจริง');
  const [decision, setDecision] = useState<AttendanceDecision | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'starting' | 'active' | 'unsupported' | 'error'>('idle');
  const [scannerMessage, setScannerMessage] = useState<string>('เปิดกล้องเพื่อสแกน QR จริง');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setQrToken(initialQrToken);
  }, [initialQrToken, session.sessionId]);

  useEffect(() => () => stopScanner(), []);

  const helperText = useMemo(() => {
    if (geoState.status === 'ready') {
      return `พร้อมใช้งาน · accuracy ${Math.round(geoState.accuracy)} ม.`;
    }
    if (geoState.status === 'error') {
      return geoState.message;
    }
    if (geoState.status === 'loading') {
      return 'กำลังร้องขอพิกัดจากอุปกรณ์...';
    }
    return 'กรุณาอนุญาต GPS ก่อนกดเช็กชื่อด้วย GPS';
  }, [geoState]);

  function stopScanner() {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerStatus('idle');
  }

  async function startScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerStatus('unsupported');
      setScannerMessage('อุปกรณ์นี้ไม่รองรับการเปิดกล้อง');
      return;
    }
    if (!window.BarcodeDetector) {
      setScannerStatus('unsupported');
      setScannerMessage('เบราว์เซอร์นี้ยังไม่รองรับ BarcodeDetector ให้วาง token ด้านล่างแทน');
      return;
    }

    try {
      setScannerStatus('starting');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      setScannerStatus('active');
      setScannerMessage('กำลังสแกน QR จากกล้อง...');
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          return;
        }

        const barcodes = await detector.detect(videoRef.current);
        const rawValue = barcodes[0]?.rawValue;
        if (rawValue) {
          setQrToken(rawValue);
          setScannerMessage('พบ QR แล้ว และกรอก token ให้เรียบร้อย');
          stopScanner();
        }
      }, 700);
    } catch (scanError) {
      setScannerStatus('error');
      setScannerMessage(scanError instanceof Error ? scanError.message : 'เปิดกล้องไม่สำเร็จ');
      stopScanner();
    }
  }

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

  async function submitCheckIn(method: 'qr' | 'gps') {
    setSubmitting(true);
    setErrorMessage(null);
    setManualStatus(null);

    try {
      const payload: CheckInPayload = {
        sessionId: session.sessionId,
        qrToken: method === 'gps' ? '' : qrToken,
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
      router.refresh();
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

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'ส่งคำร้องไม่สำเร็จ');
      }

      setManualStatus('ส่งคำร้อง manual approval สำเร็จแล้ว');
      router.refresh();
    } catch (manualError) {
      setManualStatus(manualError instanceof Error ? manualError.message : 'ส่งคำร้องไม่สำเร็จ');
    } finally {
      setManualSubmitting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm text-slate-500">บันทึกเวลาเข้าเรียนด้วย QR หรือ GPS</p>
        <h2 className="text-2xl font-bold text-indigo-700">{session.courseCode} · {session.courseNameTh}</h2>
        <p className="text-sm text-slate-600">ตอน {session.sectionCode} · ห้อง {session.room.roomName}</p>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        เลือกคาบเรียน
        <select
          value={session.sessionId}
          onChange={(event) => router.push(`/liff/check-in?sessionId=${event.target.value}`)}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
        >
          {sessions.map((item) => (
            <option key={item.sessionId} value={item.sessionId}>
              {item.courseCode} / ตอน {item.sectionCode} · {item.status}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
        <p className="font-semibold">ข้อมูลการเข้าถึงตำแหน่ง</p>
        <p className="mt-1">{helperText}</p>
        <button onClick={requestLocation} className="mt-3 rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white">
          อนุญาตตำแหน่ง
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-900">สแกน QR</p>
          <div className="space-x-2">
            <button type="button" onClick={startScanner} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">เปิดกล้อง</button>
            <button type="button" onClick={stopScanner} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium">ปิด</button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">{scannerStatus} · {scannerMessage}</p>
        <video ref={videoRef} className="mt-2 aspect-video w-full rounded-2xl bg-slate-900 object-cover" muted playsInline />
      </div>

      <label className="block text-sm font-medium text-slate-700">
        QR token
        <input
          value={qrToken}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQrToken(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="วาง token ที่ได้จาก QR"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => submitCheckIn('qr')}
          disabled={submitting}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-lg font-semibold text-white disabled:opacity-60"
        >
          เช็กชื่อด้วย QR
        </button>
        <button
          onClick={() => submitCheckIn('gps')}
          disabled={submitting || geoState.status !== 'ready'}
          className="rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-3 text-lg font-semibold text-rose-600 disabled:opacity-60"
        >
          เช็กชื่อด้วย GPS
        </button>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        เหตุผลขอ manual approval (ถ้ามี)
        <textarea
          value={manualReason}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setManualReason(event.target.value)}
          className="mt-2 min-h-20 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="เช่น GPS ในอาคารคลาดเคลื่อนมาก"
        />
      </label>

      {errorMessage ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}

      {decision ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-900">ผลการตรวจสอบ</p>
          <p className="mt-1">สถานะ: {decision.status}</p>
          <p>{decisionMessageMap[decision.reasonCode]}</p>
          <p>ผลระบบ: {decision.verificationResult}</p>
          {decision.distanceFromCenterM !== undefined ? <p>ระยะจากห้อง: {decision.distanceFromCenterM.toFixed(1)} เมตร</p> : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/liff" className="rounded-xl bg-indigo-600 px-3 py-2 font-medium text-white">กลับหน้าหลัก</Link>
            <Link href="/liff/history" className="rounded-xl border border-slate-300 px-3 py-2 font-medium">ดูประวัติ</Link>
            {decision.requiresManualApproval ? (
              <button onClick={handleManualApproval} disabled={manualSubmitting} className="rounded-xl bg-amber-500 px-3 py-2 font-medium text-white disabled:opacity-60">
                {manualSubmitting ? 'กำลังส่ง...' : 'ส่งคำร้องอาจารย์'}
              </button>
            ) : null}
          </div>
          {manualStatus ? <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-700">{manualStatus}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
