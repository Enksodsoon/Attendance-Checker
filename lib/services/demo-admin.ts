import type { AdminAuditLogItem, AdminCourseSection, AdminExportItem, AdminRoomRecord, AdminUserRecord, ManualApprovalQueueItem } from '@/lib/types';

export const demoAdminUsers: AdminUserRecord[] = [
  {
    profileId: 'profile-admin-1',
    name: 'วารุณี ผู้ดูแลระบบ',
    email: 'admin@example.edu',
    role: 'super_admin',
    status: 'active',
    lastActiveAt: '2026-03-23T09:15:00+07:00'
  },
  {
    profileId: 'profile-teacher-1',
    name: 'ผศ.ดร.สุภาวดี แสงไทย',
    email: 'supawadee@example.edu',
    role: 'teacher',
    status: 'active',
    lastActiveAt: '2026-03-23T08:55:00+07:00'
  },
  {
    profileId: 'profile-student-1',
    name: 'สมชาย ใจดี',
    email: '6512345678@example.edu',
    role: 'student',
    status: 'active',
    lastActiveAt: '2026-03-23T08:41:00+07:00'
  },
  {
    profileId: 'profile-student-3',
    name: 'อรทัย ยอดดี',
    email: '6512345691@example.edu',
    role: 'student',
    status: 'inactive',
    lastActiveAt: '2026-03-20T14:05:00+07:00'
  }
];

export const demoAdminCourses: AdminCourseSection[] = [
  {
    sectionId: 'section-cs101-a',
    courseCode: 'CS101',
    courseNameTh: 'การพัฒนาซอฟต์แวร์เชิงระบบ',
    sectionCode: 'A',
    semesterLabel: 'ภาคการศึกษาที่ 2/2568',
    teacherName: 'ผศ.ดร.สุภาวดี แสงไทย',
    roomName: 'อาคารวิทยบริการ ห้อง B520',
    activeSessionId: 'demo-session',
    enrolledCount: 29
  },
  {
    sectionId: 'section-cs204-b',
    courseCode: 'CS204',
    courseNameTh: 'สถาปัตยกรรมซอฟต์แวร์',
    sectionCode: 'B',
    semesterLabel: 'ภาคการศึกษาที่ 2/2568',
    teacherName: 'อ.ธีรพงศ์ กุลวงศ์',
    roomName: 'อาคารเฉลิมพระเกียรติ ห้อง C402',
    enrolledCount: 42
  }
];

export const demoAdminRooms: AdminRoomRecord[] = [
  {
    roomId: 'room-101',
    roomName: 'อาคารวิทยบริการ ห้อง B520',
    latitude: 13.736717,
    longitude: 100.523186,
    radiusM: 100,
    gpsPolicy: 'allow_manual_approval',
    activeSessionId: 'demo-session'
  },
  {
    roomId: 'room-202',
    roomName: 'อาคารเฉลิมพระเกียรติ ห้อง C402',
    latitude: 13.7372,
    longitude: 100.5221,
    radiusM: 80,
    gpsPolicy: 'strict'
  }
];

export const demoManualApprovalQueue: ManualApprovalQueueItem[] = [
  {
    attemptId: 'attempt-demo-1',
    sessionId: 'demo-session',
    studentCode: '6512345691',
    fullNameTh: 'อรทัย ยอดดี',
    reasonText: 'GPS ในอาคารคลาดเคลื่อนมาก แต่สแกน QR จากหน้าห้องเรียนได้ตรงเวลา',
    requestedAt: '2026-03-23T09:03:00+07:00',
    status: 'pending'
  }
];

export const demoAdminAuditLogs: AdminAuditLogItem[] = [
  {
    id: 'audit-1',
    occurredAt: '2026-03-23T09:05:00+07:00',
    actorProfileId: 'profile-admin-1',
    actorLabel: 'วารุณี ผู้ดูแลระบบ',
    actionType: 'attendance.override',
    entityType: 'attendance_record',
    entityId: 'record-1',
    metadata: {
      old_status: 'late',
      new_status: 'excused'
    }
  },
  {
    id: 'audit-2',
    occurredAt: '2026-03-23T09:07:00+07:00',
    actorProfileId: 'profile-student-1',
    actorLabel: 'สมชาย ใจดี',
    actionType: 'attendance.check_in_submitted',
    entityType: 'class_session',
    entityId: 'demo-session',
    metadata: {
      verificationResult: 'accepted'
    }
  },
  {
    id: 'audit-3',
    occurredAt: '2026-03-23T09:09:00+07:00',
    actorProfileId: 'profile-teacher-1',
    actorLabel: 'ผศ.ดร.สุภาวดี แสงไทย',
    actionType: 'attendance.export_csv',
    entityType: 'class_session',
    entityId: 'demo-session',
    metadata: {
      rowCount: 3
    }
  }
];

export const demoAdminExports: AdminExportItem[] = [
  {
    id: 'export-attendance-csv',
    label: 'ดาวน์โหลดรายชื่อเช็กชื่อ (CSV)',
    description: 'ส่งออกข้อมูลรายชื่อจากคาบเรียนตัวอย่างเพื่อให้แอดมินตรวจทานได้ทันที',
    href: '/api/teacher/sessions/demo-session/export'
  },
  {
    id: 'export-audit-json',
    label: 'ดาวน์โหลด audit log (JSON)',
    description: 'ตรวจสอบการใช้งานของผู้ดูแล อาจารย์ และนักศึกษาในข้อมูลตัวอย่าง',
    href: '/api/admin/audit-logs'
  },
  {
    id: 'export-monitor-json',
    label: 'เปิด session monitor payload',
    description: 'ตรวจสอบ payload ที่หน้า live monitor ใช้แสดงผลจริง',
    href: '/api/teacher/sessions/demo-session/monitor'
  }
];
