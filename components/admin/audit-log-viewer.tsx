'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

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

  const filteredItems = useMemo(
    () => items.filter((item) => {
      const matchQuery = !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
      const matchAction = actionFilter === 'all' || item.actionType === actionFilter;
      return matchQuery && matchAction;
    }),
    [actionFilter, items, query]
  );

  const actionTypes = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.actionType)))], [items]);

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
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          โหลดข้อมูลใหม่
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาด้วย actor / action / entity / metadata" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
        <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm">
          {actionTypes.map((actionType) => <option key={actionType} value={actionType}>{actionType}</option>)}
        </select>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">กำลังโหลดข้อมูล...</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-4 space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.actorLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.occurredAt).toLocaleString('th-TH')} · {item.entityType} / {item.entityId}</p>
                </div>
                <Badge tone="slate">{item.actionType}</Badge>
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(item.metadata, null, 2)}</pre>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
