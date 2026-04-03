import { createSupabaseAdminClient } from '@/lib/supabase/server';

interface AuditInput {
  actorProfileId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditInput) {
  const admin = createSupabaseAdminClient();
  await admin.from('system_audit_logs').insert({
    actor_profile_id: input.actorProfileId,
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {}
  });
}
