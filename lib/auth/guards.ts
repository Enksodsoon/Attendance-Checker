import type { AppRole } from '@/lib/types';

const rolePriority: Record<AppRole, number> = {
  student: 1,
  teacher: 2,
  admin: 3,
  super_admin: 4
};

export function canManageSection(actorRole: AppRole, isAssignedTeacher: boolean) {
  if (rolePriority[actorRole] >= rolePriority.admin) {
    return true;
  }

  return actorRole === 'teacher' && isAssignedTeacher;
}

export function canViewStudentSelf(actorRole: AppRole, actorProfileId: string, targetProfileId: string) {
  if (rolePriority[actorRole] >= rolePriority.admin) {
    return true;
  }

  return actorRole === 'student' && actorProfileId === targetProfileId;
}
