import type { AuditLogInput } from '@/lib/types';
import { appendAuditLog } from '@/lib/services/app-data';

export async function writeAuditLog(input: AuditLogInput) {
  const entry = appendAuditLog(input);

  console.info('[audit]', {
    actorProfileId: input.actorProfileId ?? null,
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {}
  });

  return entry;
}
