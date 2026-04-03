import { redirect } from 'next/navigation';
import { BindForm } from '@/components/student/bind-form';
import { requireSessionProfile } from '@/lib/auth/session';
import { getStudentIdentityByProfile } from '@/lib/services/db/student-attendance';

export const dynamic = 'force-dynamic';

export default async function LiffBindPage() {
  const profile = await requireSessionProfile(['student']);
  const student = await getStudentIdentityByProfile(profile.profileId);

  if (!student) {
    redirect('/liff');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-6 md:px-6">
      <BindForm student={student} />
    </main>
  );
}
