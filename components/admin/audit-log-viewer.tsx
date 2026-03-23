'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { AdminAuditLogItem } from '@/lib/types';

interface AuditLogResponse {
  items: AdminAuditLogItem[];
}

export function AuditLogViewer() {
  const [items, setItems] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/audit-logs', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('โหลด audit log ไม่สำเร็จ');
        }

        const json = (await response.json()) as AuditLogResponse;
        if (!cancelled) {
          setItems(json.items);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Live data from /api/admin/audit-logs</p>
          <h2 className="text-2xl font-semibold text-slate-900">บันทึกการตรวจสอบล่าสุด</h2>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: "#ffffff" }}
        >
          โหลดข้อมูลใหม่
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">กำลังโหลดข้อมูล...</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4">เวลา</th>
                <th className="py-3 pr-4">ผู้กระทำ</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Entity</th>
                <th className="py-3 pr-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 text-slate-700">{new Date(item.occurredAt).toLocaleString('th-TH')}</td>
                  <td className="py-3 pr-4 text-slate-900">
                    <p className="font-medium">{item.actorLabel}</p>
                    <p className="text-xs text-slate-500">{item.actorProfileId}</p>
                  </td>
                  <td className="py-3 pr-4"><Badge tone="slate">{item.actionType}</Badge></td>
                  <td className="py-3 pr-4 text-slate-700">{item.entityType} / {item.entityId}</td>
                  <td className="py-3 pr-4 text-xs text-slate-600">
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-3">{JSON.stringify(item.metadata, null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}
