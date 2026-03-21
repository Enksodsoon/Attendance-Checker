import type { AuditLogInput } from '@/lib/types';

export async function writeAuditLog(input: AuditLogInput) {
  console.info('[audit]', {
    actorProfileId: input.actorProfileId ?? null,
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {}
  });

  return input;
}
