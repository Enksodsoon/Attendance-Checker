import type { TeacherRosterRow } from '@/lib/types';

export function toCsv(rows: TeacherRosterRow[]) {
  const header = ['student_code', 'full_name_th', 'status', 'checked_in_at', 'distance_m', 'accuracy_m', 'approval_status'];
  const body = rows.map((row) => [
    row.studentCode,
    row.fullNameTh,
    row.status,
    row.checkedInAt ?? '',
    row.distanceM ?? '',
    row.accuracyM ?? '',
    row.approvalStatus ?? ''
  ]);

  return [header, ...body]
    .map((columns) =>
      columns
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\n');
}
