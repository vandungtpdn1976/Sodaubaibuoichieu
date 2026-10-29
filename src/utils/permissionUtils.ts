import { LogPeriodEntry, CurrentUser, TeacherAssignment } from '../types';

export const ADMIN_EMAILS: string[] = ['vandungtpdn1976@gmail.com', 'thenamdt@gmail.com'];

/**
 * Checks if an email or user object belongs to the Supreme Admin (SUPER_ADMIN).
 */
export function checkIsAdmin(email?: string, teachers: TeacherAssignment[] = []): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  
  if (
    lower === 'vandungtpdn1976@gmail.com' ||
    lower === 'thenamdt@gmail.com' ||
    ADMIN_EMAILS.some((adm) => adm.toLowerCase() === lower)
  ) {
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
 * - Admin (SUPER_ADMIN) can edit/delete ANY entry in ANY week at ANY time.
 * - Unauthenticated or Disabled accounts CANNOT edit/delete.
 * - If week is locked by Vice Principal/Admin, teachers CANNOT edit/delete.
 * - Teachers can ONLY edit/clear/delete entries belonging to their assigned subject.
 * - Teachers CANNOT edit/clear/delete entries assigned to other subjects.
 */
export function canUserEditEntry(
  user: CurrentUser,
  teachers: TeacherAssignment[],
  entry: LogPeriodEntry,
  isLocked: boolean
): boolean {
  if (!user || !user.email) {
    return false;
  }

  // Check disabled status
  if (user.status === 'DISABLED') {
    return false;
  }

  const userEmailLower = user.email.trim().toLowerCase();

  if (Array.isArray(teachers) && teachers.length > 0) {
    const matchedTeacher = teachers.find(
      (t) => t.email && t.email.trim().toLowerCase() === userEmailLower
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
  if (!teacherSubject || teacherSubject === 'NONE') {
    return false;
  }

  // Verify record ownership if signed or created by another teacher
  if (entry.teacherEmail && entry.teacherEmail.trim()) {
    const entryEmailLower = entry.teacherEmail.trim().toLowerCase();
    if (entryEmailLower !== userEmailLower) {
      return false; // Cannot edit/delete another teacher's signed record
    }
  } else if (entry.teacherSignature && entry.teacherSignature.trim()) {
    const sigLower = entry.teacherSignature.trim().toLowerCase();
    const userMatchedTeacher = teachers.find(
      (t) => t.email && t.email.trim().toLowerCase() === userEmailLower
    );
    const myNameLower = (userMatchedTeacher?.teacherName || user.name || '').trim().toLowerCase();
    if (
      myNameLower &&
      sigLower !== myNameLower &&
      !sigLower.includes(myNameLower) &&
      !myNameLower.includes(sigLower)
    ) {
      return false; // Cannot edit/delete another teacher's signed record
    }
  }

  // If entry has an assigned subject, compare directly with teacher's assigned subject
  if (entry.subject && entry.subject.trim()) {
    return entry.subject.trim().toLowerCase() === teacherSubject.trim().toLowerCase();
  }

  // If entry has no subject assigned yet (empty slot), teacher can edit to add their assigned subject
  return true;
}

/**
 * Checks if a teacher is authorized to perform actions for a specific subject.
 */
export function canUserEditSubject(
  user: CurrentUser,
  subject: string,
  teachers: TeacherAssignment[] = []
): boolean {
  if (!user || !user.email) return false;
  if (checkIsAdmin(user.email, teachers) || user.role === 'SUPER_ADMIN' || user.role === 'admin') {
    return true;
  }
  if (user.status === 'DISABLED') return false;

  const assigned = getTeacherAssignedSubject(user, teachers);
  if (!assigned || assigned === 'NONE') return false;
  if (!subject || !subject.trim()) return true;

  return assigned.trim().toLowerCase() === subject.trim().toLowerCase();
}

/**
 * Checks if a user is authorized to delete a 5-period cluster.
 * Super Admin can delete any cluster.
 * Teachers can only delete a cluster if ALL non-empty entries inside that cluster belong to their assigned subject.
 */
export function canUserDeleteCluster(
  user: CurrentUser,
  clusterEntries: LogPeriodEntry[],
  teachers: TeacherAssignment[],
  isLocked: boolean
): boolean {
  if (!user || !user.email) return false;
  if (checkIsAdmin(user.email, teachers) || user.role === 'SUPER_ADMIN' || user.role === 'admin') {
    return true;
  }
  if (isLocked || user.status === 'DISABLED') return false;

  const assignedSubject = getTeacherAssignedSubject(user, teachers);
  if (!assignedSubject || assignedSubject === 'NONE') return false;

  const filledEntries = clusterEntries.filter((e) => Boolean(e.subject && e.subject.trim()));
  if (filledEntries.length === 0) return true; // Empty cluster can be deleted/reset by assigned teacher

  return filledEntries.every(
    (e) => e.subject.trim().toLowerCase() === assignedSubject.trim().toLowerCase()
  );
}


/**
 * Checks whether a period entry has a duplicate PPCT lesson number within the same subject.
 * Note: Duplicate lesson titles (Tên bài học) are explicitly ALLOWED for multi-period lessons.
 * Excludes comparing against the target entry's own record ID or exact slot.
 * Returns detailed info on where the duplicate PPCT was found.
 */
export function checkDuplicatePPCTLesson(
  entries: LogPeriodEntry[],
  targetEntry: Partial<LogPeriodEntry>
): { isDuplicate: boolean; duplicateInfo?: string; conflictEntry?: LogPeriodEntry; warningMessage?: string } {
  if (
    !targetEntry ||
    !targetEntry.subject ||
    !targetEntry.subject.trim() ||
    !targetEntry.ppctLesson ||
    !targetEntry.ppctLesson.trim()
  ) {
    return { isDuplicate: false };
  }

  const subjLower = targetEntry.subject.trim().toLowerCase();
  const ppctStr = targetEntry.ppctLesson.trim().toLowerCase();
  const ppctDigits = ppctStr.replace(/\D/g, '');

  if (!ppctDigits && !ppctStr) return { isDuplicate: false };

  const dayNames: Record<number, string> = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
    8: 'Chủ Nhật',
  };

  const duplicate = entries.find((e) => {
    // 1. Skip if exact same record ID
    if (targetEntry.id && e.id === targetEntry.id) return false;

    // 2. Skip if exact same slot (weekNumber, dayOfWeek, clusterIndex, period)
    const eWeek = Number(e.weekNumber);
    const tWeek = Number(targetEntry.weekNumber);
    const eDay = Number(e.dayOfWeek);
    const tDay = Number(targetEntry.dayOfWeek);
    const eCluster = Number(e.clusterIndex || 1);
    const tCluster = Number(targetEntry.clusterIndex || 1);
    const ePeriod = Number(e.period);
    const tPeriod = Number(targetEntry.period);

    if (
      tWeek &&
      tDay &&
      tCluster &&
      tPeriod &&
      eWeek === tWeek &&
      eDay === tDay &&
      eCluster === tCluster &&
      ePeriod === tPeriod
    ) {
      return false;
    }

    // 3. Compare subject
    if (!e.subject || !e.subject.trim()) return false;
    if (e.subject.trim().toLowerCase() !== subjLower) return false;

    // 4. Compare PPCT number
    if (!e.ppctLesson || !e.ppctLesson.trim()) return false;
    const ePpctStr = e.ppctLesson.trim().toLowerCase();
    const ePpctDigits = ePpctStr.replace(/\D/g, '');

    if (ppctDigits && ePpctDigits) {
      return ppctDigits === ePpctDigits;
    }
    return ppctStr === ePpctStr;
  });

  if (duplicate) {
    const dName = dayNames[duplicate.dayOfWeek] || `Thứ ${duplicate.dayOfWeek}`;
    const datePart = duplicate.dateStr ? `, ngày ${duplicate.dateStr}` : '';
    const weekPart = duplicate.weekNumber ? `, Tuần ${duplicate.weekNumber}` : '';
    const teacherPart = duplicate.teacherSignature ? ` (GV ${duplicate.teacherSignature})` : '';

    const duplicateInfo = `${dName}${datePart}${weekPart}${teacherPart}`;
    const warningMessage = `Các tiết PPCT ${targetEntry.ppctLesson} của môn ${targetEntry.subject} đã được ghi vào ${dName}${datePart}${weekPart}${teacherPart}.\n\nVui lòng kiểm tra và nhập lại số tiết PPCT chính xác trước khi lưu.`;

    return {
      isDuplicate: true,
      duplicateInfo,
      conflictEntry: duplicate,
      warningMessage,
    };
  }

  return { isDuplicate: false };
}


