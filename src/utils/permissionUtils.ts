import { LogPeriodEntry, CurrentUser, TeacherAssignment } from '../types';

export const ADMIN_EMAILS: string[] = ['vandungtpdn1976@gmail.com'];

/**
 * Checks if an email or user object belongs to the Supreme Admin (SUPER_ADMIN).
 */
export function checkIsAdmin(email?: string, teachers: TeacherAssignment[] = []): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  
  if (lower === 'vandungtpdn1976@gmail.com' || ADMIN_EMAILS.some((adm) => adm.toLowerCase() === lower)) {
    return true;
  }

  // Check if matched teacher in roster has role === 'SUPER_ADMIN' or 'admin' and is ACTIVE
  if (Array.isArray(teachers) && teachers.length > 0) {
    const matched = teachers.find((t) => t.email && t.email.trim().toLowerCase() === lower);
    if (matched && matched.status !== 'DISABLED') {
      if (matched.role === 'SUPER_ADMIN' || matched.role === 'admin') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Resolves the assigned subject for the current user.
 * Returns 'ALL' for Admin users.
 * Returns the subject string (e.g., 'Toán', 'Lí', 'Hóa', etc.) for teacher users.
 */
export function getTeacherAssignedSubject(
  user: CurrentUser,
  teachers: TeacherAssignment[] = []
): string | null {
  if (user.role === 'admin' || user.role === 'SUPER_ADMIN' || checkIsAdmin(user.email, teachers)) {
    return 'ALL';
  }

  // 1. Explicitly assigned subject on user object
  if (user.assignedSubject && user.assignedSubject.trim()) {
    return user.assignedSubject.trim();
  }

  // 2. Match email in teacher roster
  if (user.email && Array.isArray(teachers)) {
    const userEmailLower = user.email.trim().toLowerCase();
    const matchedTeacher = teachers.find(
      (t) => t.email && t.email.trim().toLowerCase() === userEmailLower
    );
    if (matchedTeacher && matchedTeacher.subject && matchedTeacher.subject.trim()) {
      return matchedTeacher.subject.trim();
    }
  }

  return null;
}

/**
 * Checks whether a user is authorized to edit, clear, or delete a logbook period entry.
 *
 * Rules:
 * - Admin (`vandungtpdn1976@gmail.com`) can edit/delete ANY entry in ANY week at ANY time.
 * - Disabled accounts CANNOT edit/delete.
 * - If week is locked by Vice Principal/Admin, teachers CANNOT edit/delete.
 * - If entry has NO subject assigned yet (`!entry.subject`), any teacher can enter data for their subject.
 * - If entry ALREADY HAS a subject assigned, teacher can ONLY edit/delete if `entry.subject` matches
 *   their assigned subject (e.g. 'Toán' teacher can only edit 'Toán' entries).
 */
export function canUserEditEntry(
  user: CurrentUser,
  teachers: TeacherAssignment[],
  entry: LogPeriodEntry,
  isLocked: boolean
): boolean {
  // Check disabled status
  if (user.status === 'DISABLED') {
    return false;
  }

  if (user.email && Array.isArray(teachers)) {
    const matchedTeacher = teachers.find(
      (t) => t.email && t.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );
    if (matchedTeacher && matchedTeacher.status === 'DISABLED') {
      return false;
    }
  }

  // Supreme Admin always has full unrestricted access
  if (user.role === 'admin' || user.role === 'SUPER_ADMIN' || checkIsAdmin(user.email, teachers)) {
    return true;
  }

  // Frozen if Vice Principal / Admin locked the week
  if (isLocked) {
    return false;
  }

  const teacherSubject = getTeacherAssignedSubject(user, teachers);

  // If entry has no subject assigned yet, any teacher can enter lesson data for their subject
  if (!entry.subject || !entry.subject.trim()) {
    return true;
  }

  if (!teacherSubject) {
    // If teacher has no subject resolved, check if their email matches teacherEmail
    if (
      entry.teacherEmail &&
      user.email &&
      entry.teacherEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
    ) {
      return true;
    }
    return false;
  }

  // Strict subject isolation: Compare entry's subject with teacher's assigned subject
  const entrySubjectLower = entry.subject.trim().toLowerCase();
  const teacherSubjectLower = teacherSubject.trim().toLowerCase();

  if (entrySubjectLower === teacherSubjectLower) {
    return true;
  }

  // Match by teacher email
  if (
    entry.teacherEmail &&
    user.email &&
    entry.teacherEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

