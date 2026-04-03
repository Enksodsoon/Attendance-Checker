import type { StudentDashboardData, TeacherMonitorData } from '@/lib/types';
import { encodeQrPayload } from '@/lib/utils/qr';

export const demoStudentDashboard: StudentDashboardData = {
  student: {
    profileId: 'profile-student-1',
    studentId: 'student-1',
    studentCode: '6512345678',
    fullNameTh: 'สมชาย ใจดี',
    lineUserId: 'Udemo-line-001',
    role: 'student'
  },
  activeSessions: [
    {
      sessionId: 'demo-session',
      courseCode: 'CS101',
      courseNameTh: 'การพัฒนาซอฟต์แวร์เชิงระบบ',
      sectionCode: 'A',
      teacherName: 'ผศ.ดร.สุภาวดี แสงไทย',
      status: 'open',
      verificationMode: 'gps_qr_timewindow',
      attendanceMode: 'check_in_only',
      allowManualApproval: true,
      room: {
        roomId: 'room-101',
        roomName: 'อาคารวิทยบริการ ห้อง B520',
        latitude: 13.736717,
        longitude: 100.523186,
        defaultRadiusM: 100,
        gpsPolicy: 'allow_manual_approval'
      },
      window: {
        scheduledStartAt: '2026-03-21T09:00:00+07:00',
        scheduledEndAt: '2026-03-21T12:00:00+07:00',
        attendanceOpenAt: '2026-03-21T08:45:00+07:00',
        lateAfterAt: '2026-03-21T09:10:00+07:00',
        attendanceCloseAt: '2026-03-21T09:20:00+07:00'
      }
    }
  ],
  summary: {
    totalPresent: 21,
    totalLate: 2,
    totalPending: 1,
    totalAbsent: 0
  },
  recentHistory: [
    {
      recordId: 'record-1',
      sessionId: 'session-prev-1',
      dateLabel: '20 มี.ค. 2026',
      courseLabel: 'CS101 / ตอน A',
      status: 'present',
      checkedInAt: '2026-03-20T09:02:00+07:00'
    },
    {
      recordId: 'record-2',
      sessionId: 'session-prev-2',
      dateLabel: '18 มี.ค. 2026',
      courseLabel: 'CS101 / ตอน A',
      status: 'late',
      checkedInAt: '2026-03-18T09:12:00+07:00'
    }
  ]
};

export const demoTeacherMonitor: TeacherMonitorData = {
  session: demoStudentDashboard.activeSessions[0],
  qrPayload: encodeQrPayload({
    sessionId: 'demo-session',
    token: 'demo-token-20260321'
  }),
  metrics: {
    present: 21,
    late: 2,
    pendingApproval: 1,
    absent: 5
  },
  roster: [
    {
      studentId: 'student-1',
      studentCode: '6512345678',
      fullNameTh: 'สมชาย ใจดี',
      status: 'present',
      checkedInAt: '09:02',
      distanceM: 18,
      accuracyM: 12
    },
    {
      studentId: 'student-2',
      studentCode: '6512345680',
      fullNameTh: 'สุดา พรหมมา',
      status: 'late',
      checkedInAt: '09:15',
      distanceM: 22,
      accuracyM: 18
    },
    {
      studentId: 'student-3',
      studentCode: '6512345691',
      fullNameTh: 'อรทัย ยอดดี',
      status: 'pending_approval',
      approvalStatus: 'pending',
      accuracyM: 185
    }
  ]
};
