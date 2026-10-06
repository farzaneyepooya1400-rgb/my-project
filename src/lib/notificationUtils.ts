import { AppNotification, NotificationType, AppUser, Student } from '../types';
import { toPersianDigits } from './persianUtils';

export interface NotificationMeta {
  title: string;
  badgeLabel: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  darkBgColor: string;
  iconName: 'grade' | 'meeting' | 'vp_message' | 'attendance' | 'general';
}

export const NOTIFICATION_METAS: Record<NotificationType, NotificationMeta> = {
  grade: {
    title: 'ثبت نمره جدید',
    badgeLabel: 'نمره و کارنامه',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    bgColor: 'from-emerald-500/10 to-teal-500/5',
    darkBgColor: 'dark:from-emerald-950/40 dark:to-teal-950/20',
    iconName: 'grade',
  },
  meeting: {
    title: 'یادآور جلسه',
    badgeLabel: 'جلسه و رویداد',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    bgColor: 'from-amber-500/10 to-orange-500/5',
    darkBgColor: 'dark:from-amber-950/40 dark:to-orange-950/20',
    iconName: 'meeting',
  },
  vp_message: {
    title: 'پیام معاونت مدرسه',
    badgeLabel: 'پیام معاونت',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    borderColor: 'border-indigo-500/40',
    bgColor: 'from-indigo-500/10 to-purple-500/5',
    darkBgColor: 'dark:from-indigo-950/40 dark:to-purple-950/20',
    iconName: 'vp_message',
  },
  attendance: {
    title: 'حضور، غیاب و انضباطی',
    badgeLabel: 'انضباط و حضور',
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    borderColor: 'border-rose-500/40',
    bgColor: 'from-rose-500/10 to-pink-500/5',
    darkBgColor: 'dark:from-rose-950/40 dark:to-pink-950/20',
    iconName: 'attendance',
  },
  general: {
    title: 'اطلاعیه عمومی',
    badgeLabel: 'اطلاعیه مدرسه',
    badgeColor: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    borderColor: 'border-sky-500/40',
    bgColor: 'from-sky-500/10 to-cyan-500/5',
    darkBgColor: 'dark:from-sky-950/40 dark:to-cyan-950/20',
    iconName: 'general',
  },
};

/**
 * Format relative Persian time
 */
export function formatRelativePersianTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) {
      return 'هم‌اکنون';
    }
    if (diffMin < 60) {
      return `${toPersianDigits(diffMin)} دقیقه پیش`;
    }
    if (diffHours < 24) {
      return `${toPersianDigits(diffHours)} ساعت پیش`;
    }
    if (diffDays === 1) {
      return 'دیروز';
    }
    if (diffDays < 7) {
      return `${toPersianDigits(diffDays)} روز پیش`;
    }
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return 'به‌تازگی';
  }
}

/**
 * Filter notifications relevant to the active logged-in user
 */
export function isNotificationRelevantForUser(
  notif: AppNotification,
  currentUser: AppUser | null,
  students: Student[] = []
): boolean {
  if (!currentUser) return false;

  // Sub-admins and Admins can supervise all school notifications
  if (currentUser.role === 'admin' || currentUser.role === 'sub_admin') {
    return true;
  }

  // Vice principals see broad broadcasts, staff announcements and their own notices
  if (currentUser.role === 'academic_vp' || currentUser.role === 'cultural_vp') {
    if (notif.targetRole === 'all' || notif.targetRole === currentUser.role) return true;
    if (notif.senderRole === currentUser.role) return true;
    if (notif.type === 'meeting' || notif.type === 'grade' || notif.type === 'vp_message') return true;
    return false;
  }

  // Teachers see notifications for teachers, all, or specific to their classes
  if (currentUser.role === 'teacher') {
    if (notif.targetRole === 'all' || notif.targetRole === 'teacher') return true;
    if (notif.senderRole === 'teacher' && notif.senderName?.includes(currentUser.fullName)) return true;
    return false;
  }

  // Students see notifications targeted to 'all', 'student', or their specific class / student ID
  if (currentUser.role === 'student') {
    // If not intended for students or all, ignore
    if (notif.targetRole && notif.targetRole !== 'all' && notif.targetRole !== 'student') {
      return false;
    }

    // Match student profile
    const studentProfile = students.find(
      (s) =>
        s.id === currentUser.linkedId ||
        s.studentCode === currentUser.linkedId ||
        s.nationalId === currentUser.linkedId
    );

    if (notif.targetStudentId) {
      if (
        notif.targetStudentId !== currentUser.id &&
        notif.targetStudentId !== currentUser.linkedId &&
        (!studentProfile || notif.targetStudentId !== studentProfile.id)
      ) {
        return false;
      }
    }

    if (notif.targetClassId && studentProfile) {
      if (notif.targetClassId !== studentProfile.classId) {
        return false;
      }
    }

    return true;
  }

  // Parents see notifications targeted to 'all', 'parent', or their child's student ID / class
  if (currentUser.role === 'parent') {
    if (notif.targetRole && notif.targetRole !== 'all' && notif.targetRole !== 'parent') {
      return false;
    }

    const childProfile = students.find(
      (s) =>
        s.id === currentUser.linkedId ||
        s.studentCode === currentUser.linkedId ||
        s.nationalId === currentUser.linkedId
    );

    if (notif.targetStudentId) {
      if (
        notif.targetStudentId !== currentUser.linkedId &&
        (!childProfile || notif.targetStudentId !== childProfile.id)
      ) {
        return false;
      }
    }

    if (notif.targetClassId && childProfile) {
      if (notif.targetClassId !== childProfile.classId) {
        return false;
      }
    }

    return true;
  }

  return notif.targetRole === 'all';
}
