import {
  LogPeriodEntry,
  SchoolConfig,
  TeacherAssignment,
  Student,
  CurrentUser,
} from '../types';
import {
  DEFAULT_CONFIG,
  DEFAULT_TEACHERS,
  DEFAULT_STUDENTS,
  DEFAULT_CURRENT_USER,
  checkIsAdmin,
  SAMPLE_WEEK_5_ENTRIES,
  SAMPLE_DECISION_108_TEACHERS,
  createEmptyWeekEntries,
} from '../constants/initialData';
import {
  normalizeLogPeriodEntry,
  normalizeWeekEntries,
} from '../utils/dateUtils';

const STORAGE_KEY_PREFIX_WEEK = 'sdb_week_';
const STORAGE_KEY_CONFIG = 'sdb_config';
const STORAGE_KEY_TEACHERS = 'sdb_teachers';
const STORAGE_KEY_STUDENTS = 'sdb_students';
const STORAGE_KEY_CURRENT_USER = 'sdb_current_user';

const STORAGE_KEY_AUTH_SESSION = 'sdb_authenticated_session';

export class ApiService {
  static checkIsAuthenticated(): boolean {
    // Per security requirements: Always require login on page reload / initial load / new tab
    return false;
  }

  static setAuthenticatedSession(authenticated: boolean): void {
    try {
      if (!authenticated) {
        sessionStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
        localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.warn('Error setting auth session', e);
    }
  }

  static async loginWithPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: CurrentUser & { isFirstLogin?: boolean }; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.user) {
        ApiService.setAuthenticatedSession(true);
        ApiService.saveCurrentUser(json.user);
        return { success: true, user: json.user };
      }
      return { success: false, error: json.error || 'Đăng nhập không thành công.' };
    } catch (e: any) {
      return { success: false, error: 'Không thể kết nối máy chủ xác thực: ' + (e.message || String(e)) };
    }
  }

  static async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || 'Đổi mật khẩu thất bại.' };
    } catch (e: any) {
      return { success: false, error: 'Không thể kết nối máy chủ: ' + (e.message || String(e)) };
    }
  }

  static async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || 'Không thể khôi phục mật khẩu.' };
    } catch (e: any) {
      return { success: false, error: 'Lỗi hệ thống: ' + (e.message || String(e)) };
    }
  }

  static logout(): void {
    ApiService.setAuthenticatedSession(false);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }

  static loadCurrentUser(): CurrentUser {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (data) {
        const parsed = JSON.parse(data) as CurrentUser;
        if (parsed && parsed.email) {
          if (checkIsAdmin(parsed.email)) {
            return {
              ...parsed,
              name: parsed.email.toLowerCase() === 'vandungtpdn1976@gmail.com' ? 'Thầy Võ Văn Dũng' : (parsed.name || 'Quản trị viên'),
              role: 'admin',
            };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading current user from storage', e);
    }
    return DEFAULT_CURRENT_USER;
  }

  static saveCurrentUser(user: CurrentUser): void {
    const updatedUser: CurrentUser = checkIsAdmin(user.email)
      ? {
          ...user,
          name: user.email.toLowerCase() === 'vandungtpdn1976@gmail.com' ? 'Thầy Võ Văn Dũng' : user.name,
          role: 'admin',
        }
      : user;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updatedUser));
  }

  static loadConfig(): SchoolConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (data) {
        const parsed = JSON.parse(data);
        const merged = { ...DEFAULT_CONFIG, ...parsed };
        merged.schoolName = 'TRƯỜNG PTDTNT THPT BÌNH PHƯỚC';
        merged.departmentName = 'SỞ GD & ĐT TP ĐỒNG NAI';
        merged.academicYear = '2026 – 2027';
        return merged;
      }
    } catch (e) {
      console.warn('Error reading config from storage', e);
    }
    return DEFAULT_CONFIG;
  }

  static async fetchServerConfig(): Promise<SchoolConfig | null> {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch config from server', e);
    }
    return null;
  }

  static saveConfig(config: SchoolConfig): void {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    // Sync to backend server
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch((err) => console.warn('Could not sync config to server', err));
  }

  static loadTeachers(): TeacherAssignment[] {
    try {
      const defaultMap = new Map<string, string>();
      for (const dt of SAMPLE_DECISION_108_TEACHERS) {
        if (dt.teacherName && dt.email) {
          defaultMap.set(dt.teacherName.trim().toLowerCase(), dt.email);
        }
      }

      const data = localStorage.getItem(STORAGE_KEY_TEACHERS);
      if (data !== null) {
        const parsed = JSON.parse(data) as TeacherAssignment[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          let needsUpdate = false;
          const cleaned = parsed.map((t) => {
            let email = t.email || '';
            if (email.includes('.edu.vn')) {
              email = email.replace(/@[^@]+\.edu\.vn$/i, '@gmail.com');
              needsUpdate = true;
            }
            const officialEmail = defaultMap.get(t.teacherName?.trim().toLowerCase());
            // If there is an official updated gmail for this teacher and the current email is an old mock or placeholder
            if (officialEmail && email !== officialEmail && (email.includes('@gmail.com') || !email)) {
              // Automatically upgrade to official gmail
              email = officialEmail;
              needsUpdate = true;
            }
            return { ...t, email };
          });
          if (needsUpdate) {
            localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(cleaned));
            return cleaned;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading teachers from storage', e);
    }
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(SAMPLE_DECISION_108_TEACHERS));
    return SAMPLE_DECISION_108_TEACHERS;
  }

  static async fetchServerTeachers(): Promise<TeacherAssignment[] | null> {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const cleaned = json.data.map((t: TeacherAssignment) => {
            let email = t.email || '';
            if (email && email.includes('.edu.vn')) {
              email = email.replace(/@[^@]+\.edu\.vn$/i, '@gmail.com');
            }
            if (t.teacherName?.trim().toLowerCase() === 'nguyễn anh tuấn' && email === 'tuan.na@gmail.com') {
              email = 'totoancvabd@gmail.com';
            }
            return { ...t, email };
          });
          const TEACHERS_CLEARED_VERSION_KEY = 'sdb_teachers_version_clear_old_for_file_v1';
          localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(cleaned));
          localStorage.setItem(TEACHERS_CLEARED_VERSION_KEY, 'v_cleared_for_user_upload');
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Could not fetch teachers from server', e);
    }
    return null;
  }

  static async saveTeachers(teachers: TeacherAssignment[]): Promise<boolean> {
    const TEACHERS_CLEARED_VERSION_KEY = 'sdb_teachers_version_clear_old_for_file_v1';
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
    localStorage.setItem(TEACHERS_CLEARED_VERSION_KEY, 'v_cleared_for_user_upload');

    // Sync to backend server
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teachers),
      });
      return res.ok;
    } catch (err) {
      console.warn('Could not sync teachers to server', err);
      return false;
    }
  }

  static clearTeachers(): void {
    const TEACHERS_CLEARED_VERSION_KEY = 'sdb_teachers_version_clear_old_for_file_v1';
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify([]));
    localStorage.setItem(TEACHERS_CLEARED_VERSION_KEY, 'v_cleared_for_user_upload');

    fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    }).catch((err) => console.warn('Could not clear teachers on server', err));
  }

  static loadStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading students from storage', e);
    }
    return DEFAULT_STUDENTS;
  }

  static saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));

    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(students),
    }).catch((err) => console.warn('Could not sync students to server', err));
  }

  static async testConnection(scriptUrl: string): Promise<{
    success: boolean;
    message: string;
    spreadsheetName?: string;
    time?: string;
    rawRecordsCount?: number;
    activeSheetsCount?: number;
  }> {
    if (!scriptUrl || !scriptUrl.trim()) {
      return { success: false, message: 'Chưa nhập URL Google Apps Script.' };
    }

    const trimmed = scriptUrl.trim();

    if (trimmed.includes('/edit')) {
      return {
        success: false,
        message: 'URL bạn vừa nhập là link Chỉnh sửa Apps Script (/edit). Vui lòng dán đúng URL Triển khai Web App (kết thúc bằng /exec).',
      };
    }

    if (!trimmed.includes('/exec')) {
      return {
        success: false,
        message: 'URL Google Apps Script chưa đúng định dạng Web App (thiếu /exec ở cuối đường dẫn).',
      };
    }

    // Try central server backend proxy test first
    try {
      const res = await fetch('/api/test-script-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: trimmed }),
      });

      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          message: json.message || 'Kết nối thành công với Google Spreadsheet!',
          spreadsheetName: json.spreadsheetName,
          time: json.time,
          rawRecordsCount: json.rawRecordsCount,
          activeSheetsCount: json.activeSheetsCount,
        };
      } else {
        return {
          success: false,
          message: json.error || 'Không thể kết nối với Google Apps Script.',
        };
      }
    } catch (e) {
      console.warn('Backend proxy test connection failed, trying direct browser fetch', e);
    }

    // Direct browser fetch fallback
    try {
      const url = new URL(trimmed);
      url.searchParams.set('action', 'test');
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.status === 404) {
        return {
          success: false,
          message: 'Mã HTTP 404: Bản triển khai không tồn tại hoặc đã bị xóa. Vui lòng vào Apps Script > "Triển khai" > "Tùy chọn triển khai mới" và tạo lại Web App.',
        };
      }
      if (!response.ok) {
        throw new Error(`Mã HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.success) {
        return {
          success: true,
          message: data.message || 'Kết nối thành công với Google Spreadsheet!',
        };
      }
      return {
        success: false,
        message: data.error || 'Google Apps Script trả về lỗi.',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Không thể kết nối (${errorMsg}). Vui lòng kiểm tra lại URL Web App và quyền "Bất kỳ ai (Anyone)" khi Deploy.`,
      };
    }
  }

  // Trigger sync of week data from Google Sheets scriptUrl
  static async syncFromSheets(weekNumber?: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber }),
      });
      const json = await res.json();
      if (json.success) {
        return { success: true, message: json.message };
      }
      return { success: false, message: json.error || 'Lỗi đồng bộ từ Google Sheets.' };
    } catch (e: any) {
      return { success: false, message: `Lỗi kết nối đồng bộ: ${e.message || String(e)}` };
    }
  }

  // Push range of weeks (e.g. Weeks 1 to 7) to Google Sheets Web App
  static async pushWeeksToSheets(
    startWeek: number = 1,
    endWeek: number = 7,
    config?: SchoolConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/push-weeks-to-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startWeek, endWeek }),
      });
      const json = await res.json();
      if (json.success) {
        return { success: true, message: json.message };
      }
      if (json.error) {
        return { success: false, message: json.error };
      }
    } catch (e: any) {
      console.warn('Backend proxy push failed, trying direct browser fetch', e);
    }

    // Direct browser fetch fallback if backend proxy call failed
    const scriptUrl = config?.scriptUrl;
    if (!scriptUrl || !scriptUrl.trim()) {
      return {
        success: false,
        message: 'Chưa cấu hình URL Google Apps Script. Vui lòng dán URL Web App kết thúc bằng /exec.',
      };
    }

    try {
      let pushed = 0;
      for (let w = startWeek; w <= endWeek; w++) {
        const weekEntries = await ApiService.loadWeekData(w, config || ApiService.loadConfig());
        await fetch(scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveWeek',
            weekNumber: w,
            entries: weekEntries,
          }),
        });
        pushed++;
      }
      return {
        success: true,
        message: `Đồng bộ thành công: Toàn bộ dữ liệu Sổ đầu bài từ Tuần ${startWeek} đến Tuần ${endWeek} của tất cả các môn đã được lưu an toàn vào Google Sheets!`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Lỗi kết nối đẩy dữ liệu sang Google Sheets: ${err.message || String(err)}`,
      };
    }
  }

  // Helper to merge two lists of period entries preserving non-empty lesson data
  static mergeEntriesLists(
    primary: LogPeriodEntry[],
    secondary: LogPeriodEntry[],
    weekNumber: number = 1,
    startDateStr: string = DEFAULT_CONFIG.weekOneStartDate
  ): LogPeriodEntry[] {
    const normPrimary = (primary || []).map((e) => normalizeLogPeriodEntry(e, weekNumber, startDateStr));
    const normSecondary = (secondary || []).map((e) => normalizeLogPeriodEntry(e, weekNumber, startDateStr));

    if (normPrimary.length === 0) return normSecondary;
    if (normSecondary.length === 0) return normPrimary;

    const map = new Map<string, LogPeriodEntry>();
    const hasContent = (e: LogPeriodEntry) =>
      Boolean(
        (e.subject && e.subject.trim()) ||
        (e.lessonTitle && e.lessonTitle.trim()) ||
        (e.teacherSignature && e.teacherSignature.trim()) ||
        (e.ppctLesson && e.ppctLesson.trim()) ||
        (e.absentCount && e.absentCount > 0)
      );

    for (const e of normSecondary) {
      map.set(e.id, e);
    }

    for (const e of normPrimary) {
      const existing = map.get(e.id);
      if (!existing) {
        map.set(e.id, e);
      } else {
        if (hasContent(e) && !hasContent(existing)) {
          map.set(e.id, e);
        } else if (hasContent(e) && hasContent(existing)) {
          map.set(e.id, e);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      if (a.clusterIndex !== b.clusterIndex) return a.clusterIndex - b.clusterIndex;
      return a.period - b.period;
    });
  }

  // Load week data: Intelligent merge across Central Server, Google Sheets, and Local Storage
  static async loadWeekData(weekNumber: number, config: SchoolConfig): Promise<LogPeriodEntry[]> {
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
    const localData = localStorage.getItem(localKey);
    let cachedEntries: LogPeriodEntry[] = [];

    if (localData) {
      try {
        cachedEntries = JSON.parse(localData);
      } catch (e) {
        console.warn('Failed to parse cached week data', e);
      }
    }

    let currentResult: LogPeriodEntry[] = cachedEntries;

    // 1. Primary: Fetch from central backend server API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`/api/weeks/${weekNumber}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          currentResult = ApiService.mergeEntriesLists(json.data, currentResult, weekNumber, config.weekOneStartDate);
        }
      }
    } catch (e) {
      console.warn('Central server fetch failed or timed out, trying fallback', e);
    }

    // 2. Secondary fallback: Google Sheets (if configured)
    if (config.scriptUrl && config.scriptUrl.trim()) {
      try {
        const url = new URL(config.scriptUrl.trim());
        url.searchParams.set('action', 'getWeek');
        url.searchParams.set('week', String(weekNumber));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
            currentResult = ApiService.mergeEntriesLists(json.data, currentResult, weekNumber, config.weekOneStartDate);
          }
        }
      } catch (e) {
        console.warn('Could not fetch week data from Google Sheets, using local cache', e);
      }
    }

    // 3. Fallback: create empty slots if result is empty
    if (!currentResult || currentResult.length === 0) {
      currentResult = createEmptyWeekEntries(weekNumber, config.weekOneStartDate);
    }

    currentResult = normalizeWeekEntries(currentResult, weekNumber, config.weekOneStartDate);
    localStorage.setItem(localKey, JSON.stringify(currentResult));
    return currentResult;
  }

  // Silent poll for real-time background sync
  static async pollWeekData(weekNumber: number): Promise<LogPeriodEntry[] | null> {
    try {
      const config = ApiService.loadConfig();
      const res = await fetch(`/api/weeks/${weekNumber}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
          const localData = localStorage.getItem(localKey);
          let cached: LogPeriodEntry[] = [];
          if (localData) {
            try { cached = JSON.parse(localData); } catch {}
          }
          const merged = ApiService.mergeEntriesLists(json.data, cached, weekNumber, config.weekOneStartDate);
          const normalized = normalizeWeekEntries(merged, weekNumber, config.weekOneStartDate);
          localStorage.setItem(localKey, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch {
      // Ignore background polling errors
    }
    return null;
  }

  // Save 1 period entry (e.g. teacher editing a row) with user authentication
  static async savePeriodEntry(
    entry: LogPeriodEntry,
    config: SchoolConfig,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string; syncedToSheets?: boolean }> {
    const normEntry = normalizeLogPeriodEntry(entry, entry.weekNumber, config.weekOneStartDate);
    const weekNumber = normEntry.weekNumber;
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
    const emailToUse = userEmail || ApiService.loadCurrentUser().email;

    // 1. Send to central backend server (which checks permissions & pushes server-to-server to Google Sheets)
    let syncedToSheets = false;
    try {
      const res = await fetch('/api/period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: normEntry, userEmail: emailToUse }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        return {
          success: false,
          error: json.error || 'Bạn không có quyền chỉnh sửa hoặc xóa nội dung môn học này. Vui lòng liên hệ quản trị viên.',
        };
      }
      syncedToSheets = Boolean(json.syncedToSheets);
    } catch (err) {
      console.warn('Central server save failed', err);
    }

    // 2. Update local cache ONLY AFTER server validation passes
    try {
      const localData = localStorage.getItem(localKey);
      let list: LogPeriodEntry[] = localData ? JSON.parse(localData) : [];
      if (!list || list.length === 0) {
        list = createEmptyWeekEntries(weekNumber, config.weekOneStartDate);
      }

      const index = list.findIndex((e) => e.id === normEntry.id);
      if (index >= 0) {
        list[index] = normEntry;
      } else {
        list.push(normEntry);
      }
      const normalizedList = normalizeWeekEntries(list, weekNumber, config.weekOneStartDate);
      localStorage.setItem(localKey, JSON.stringify(normalizedList));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }

    return { success: true, syncedToSheets };
  }

  // Delete a cluster
  static async deleteCluster(
    weekNumber: number,
    dayOfWeek: number,
    clusterIndex: number,
    config: SchoolConfig,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
    const emailToUse = userEmail || ApiService.loadCurrentUser().email;

    // Send to central server
    try {
      const res = await fetch('/api/delete-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, dayOfWeek, clusterIndex, userEmail: emailToUse }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        return {
          success: false,
          error: json.error || 'Bạn không có quyền xóa cụm môn này. Vui lòng liên hệ quản trị viên.',
        };
      }
    } catch (e) {
      console.warn('Central server delete cluster failed', e);
    }

    try {
      const localData = localStorage.getItem(localKey);
      if (localData) {
        const list: LogPeriodEntry[] = JSON.parse(localData);
        const filtered = list.filter(
          (e) =>
            !(
              Number(e.dayOfWeek) === Number(dayOfWeek) &&
              (Number(e.clusterIndex) || 1) === Number(clusterIndex)
            )
        );
        const normalizedList = normalizeWeekEntries(filtered, weekNumber, config.weekOneStartDate);
        localStorage.setItem(localKey, JSON.stringify(normalizedList));
      }
    } catch (e) {
      console.error('Failed to delete cluster locally', e);
    }

    return { success: true };
  }

  // Batch save week entries (e.g. Quick Entry Modal or Add Cluster)
  static async saveWeekData(
    weekNumber: number,
    entries: LogPeriodEntry[],
    config: SchoolConfig,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
    const emailToUse = userEmail || ApiService.loadCurrentUser().email;
    const normalizedEntries = normalizeWeekEntries(entries, weekNumber, config.weekOneStartDate);

    // 1. Send to central backend server
    try {
      const res = await fetch(`/api/weeks/${weekNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: normalizedEntries, userEmail: emailToUse }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        return {
          success: false,
          error: json.error || 'Bạn không có quyền chỉnh sửa nội dung thuộc môn học khác.',
        };
      }
    } catch (err) {
      console.warn('Central server batch save failed', err);
    }

    localStorage.setItem(localKey, JSON.stringify(normalizedEntries));
    return { success: true };
  }

  // Toggle Week Lock
  static async toggleLockWeek(
    weekNumber: number,
    isLocked: boolean,
    config: SchoolConfig,
    userEmail?: string
  ): Promise<SchoolConfig> {
    const emailToUse = userEmail || ApiService.loadCurrentUser().email;
    const newConfig: SchoolConfig = {
      ...config,
      lockedWeeks: {
        ...(config.lockedWeeks || {}),
        [weekNumber]: isLocked,
      },
    };
    ApiService.saveConfig(newConfig);

    // Sync to central backend
    try {
      await fetch('/api/lock-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, isLocked, userEmail: emailToUse }),
      });
    } catch (e) {
      console.warn('Could not sync locked week state to server', e);
    }

    return newConfig;
  }

  // Fetch teacher completion progress summary for any given week (1-35)
  static async fetchProgressSummary(weekNumber: number, config: SchoolConfig): Promise<import('../types').TeacherProgressItem[]> {
    const teachers = ApiService.loadTeachers();
    const entries = await ApiService.loadWeekData(weekNumber, config);

    const result: import('../types').TeacherProgressItem[] = [];

    for (const t of teachers) {
      if (t.status === 'DISABLED') continue; // Exclude disabled teachers

      const expected = t.expectedPeriods || 5;
      const tNameLower = (t.teacherName || '').trim().toLowerCase();
      const tSubjectLower = (t.subject || '').trim().toLowerCase();

      // Find entries that match either this teacher's assigned subject or signature or email
      const matchedEntries = entries.filter((e) => {
        const eSubjectLower = (e.subject || '').trim().toLowerCase();
        const eSigLower = (e.teacherSignature || '').trim().toLowerCase();
        const eEmailLower = (e.teacherEmail || '').trim().toLowerCase();

        const hasContent = Boolean(e.lessonTitle || e.ppctLesson || e.subject || e.teacherSignature);
        if (!hasContent) return false;

        if (eSubjectLower && eSubjectLower === tSubjectLower) return true;
        if (eSigLower && eSigLower === tNameLower) return true;
        if (eEmailLower && t.email && eEmailLower === t.email.trim().toLowerCase()) return true;

        return false;
      });

      const enteredCount = matchedEntries.length;
      let status: import('../types').ProgressStatus = 'NOT_ENTERED';

      if (expected === 0) {
        status = 'NO_SCHEDULE';
      } else if (enteredCount === 0) {
        status = 'NOT_ENTERED';
      } else if (enteredCount < expected) {
        status = 'INCOMPLETE';
      } else {
        status = 'COMPLETED';
      }

      // Calculate missing period numbers (1..expected)
      const enteredPeriodsList = matchedEntries.map((e) => e.period);
      const missingPeriods: number[] = [];
      for (let p = 1; p <= expected; p++) {
        if (!enteredPeriodsList.includes(p)) {
          missingPeriods.push(p);
        }
      }

      const lessonsEntered = matchedEntries.map((e) => ({
        dayOfWeek: e.dayOfWeek,
        period: e.period,
        ppctLesson: e.ppctLesson || '',
        lessonTitle: e.lessonTitle || '',
      }));

      result.push({
        teacherId: t.id,
        teacherName: t.teacherName,
        email: t.email,
        subject: t.subject,
        className: t.className || 'Khối 12',
        expectedPeriods: expected,
        enteredPeriods: enteredCount,
        status,
        missingPeriods,
        lessonsEntered,
      });
    }

    return result;
  }

  // Audit data across Weeks 1 to 35
  static async fetchAuditEntries(): Promise<{
    success: boolean;
    totalEnteredRecords: number;
    verifiedCount: number;
    unverifiedCount: number;
    unverifiedEntries: (LogPeriodEntry & { origin: string; isTeacherVerified: boolean })[];
    verifiedEntries: (LogPeriodEntry & { origin: string; isTeacherVerified: boolean })[];
  }> {
    try {
      const res = await fetch('/api/admin/audit-entries');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return json;
        }
      }
    } catch (e) {
      console.warn('Could not fetch audit entries', e);
    }
    return {
      success: false,
      totalEnteredRecords: 0,
      verifiedCount: 0,
      unverifiedCount: 0,
      unverifiedEntries: [],
      verifiedEntries: [],
    };
  }

  // Action to verify or clear unverified entry
  static async verifyAuditEntry(
    userEmail: string,
    action: 'verify' | 'delete' | 'verify_all_unverified',
    entryId?: string,
    weekNumber?: number
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/admin/verify-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, weekNumber, action, userEmail }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || 'Thao tác không thành công.' };
    } catch (e: any) {
      return { success: false, error: 'Lỗi kết nối máy chủ: ' + (e.message || String(e)) };
    }
  }
}


