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

const STORAGE_KEY_PREFIX_WEEK = 'sdb_week_';
const STORAGE_KEY_CONFIG = 'sdb_config';
const STORAGE_KEY_TEACHERS = 'sdb_teachers';
const STORAGE_KEY_STUDENTS = 'sdb_students';
const STORAGE_KEY_CURRENT_USER = 'sdb_current_user';

export class ApiService {
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
      const data = localStorage.getItem(STORAGE_KEY_TEACHERS);
      if (data !== null) {
        const parsed = JSON.parse(data) as TeacherAssignment[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasEduVn = false;
          const cleaned = parsed.map((t) => {
            if (t.email && t.email.includes('.edu.vn')) {
              hasEduVn = true;
              return {
                ...t,
                email: t.email.replace(/@[^@]+\.edu\.vn$/i, '@gmail.com'),
              };
            }
            return t;
          });
          if (hasEduVn) {
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
        if (json.success && Array.isArray(json.data)) {
          const cleaned = json.data.map((t: TeacherAssignment) => {
            if (t.email && t.email.includes('.edu.vn')) {
              return {
                ...t,
                email: t.email.replace(/@[^@]+\.edu\.vn$/i, '@gmail.com'),
              };
            }
            return t;
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

  static async testConnection(scriptUrl: string): Promise<{ success: boolean; message: string }> {
    if (!scriptUrl || !scriptUrl.trim()) {
      return { success: false, message: 'Chưa nhập URL Google Apps Script.' };
    }
    try {
      const url = new URL(scriptUrl.trim());
      url.searchParams.set('action', 'test');
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
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
        message: `Không thể kết nối (${errorMsg}). Vui lòng kiểm tra quyền "Bất kỳ ai (Anyone)" khi Deploy.`,
      };
    }
  }

  // Load week data: First attempts central backend server, falls back to Google Sheets, then localStorage
  static async loadWeekData(weekNumber: number, config: SchoolConfig): Promise<LogPeriodEntry[]> {
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
    const localData = localStorage.getItem(localKey);
    let cachedEntries: LogPeriodEntry[] | null = null;

    if (localData) {
      try {
        cachedEntries = JSON.parse(localData);
      } catch (e) {
        console.warn('Failed to parse cached week data', e);
      }
    } else if (weekNumber === 5) {
      cachedEntries = SAMPLE_WEEK_5_ENTRIES;
      localStorage.setItem(localKey, JSON.stringify(cachedEntries));
    }

    // 1. Primary: Fetch from central backend server API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`/api/weeks/${weekNumber}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          localStorage.setItem(localKey, JSON.stringify(json.data));
          return json.data;
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
            localStorage.setItem(localKey, JSON.stringify(json.data));
            return json.data;
          }
        }
      } catch (e) {
        console.warn('Could not fetch week data from Google Sheets, using local cache', e);
      }
    }

    // 3. Fallback: cached entries in localStorage
    if (cachedEntries && cachedEntries.length > 0) {
      return cachedEntries;
    }

    const emptyEntries = createEmptyWeekEntries(weekNumber, config.weekOneStartDate);
    localStorage.setItem(localKey, JSON.stringify(emptyEntries));
    return emptyEntries;
  }

  // Silent poll for real-time background sync
  static async pollWeekData(weekNumber: number): Promise<LogPeriodEntry[] | null> {
    try {
      const res = await fetch(`/api/weeks/${weekNumber}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
          localStorage.setItem(localKey, JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {
      // Ignore background polling errors
    }
    return null;
  }

  // Save 1 period entry (e.g. teacher editing a row)
  static async savePeriodEntry(
    entry: LogPeriodEntry,
    config: SchoolConfig
  ): Promise<{ success: boolean; error?: string }> {
    const weekNumber = entry.weekNumber;
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;

    // Update local cache
    try {
      const localData = localStorage.getItem(localKey);
      let list: LogPeriodEntry[] = localData ? JSON.parse(localData) : [];
      if (!list || list.length === 0) {
        list = createEmptyWeekEntries(weekNumber, config.weekOneStartDate);
      }

      const entryDay = Number(entry.dayOfWeek);
      const entryCluster = Number(entry.clusterIndex || 1);
      const entryPeriod = Number(entry.period);

      const index = list.findIndex(
        (e) =>
          Number(e.dayOfWeek) === entryDay &&
          Number(e.clusterIndex || 1) === entryCluster &&
          Number(e.period) === entryPeriod
      );

      const entryWithDate: LogPeriodEntry = {
        ...entry,
        dayOfWeek: entryDay,
        clusterIndex: entryCluster,
        period: entryPeriod,
        updatedAt: new Date().toLocaleString('vi-VN'),
      };

      if (index >= 0) {
        list[index] = entryWithDate;
      } else {
        list.push(entryWithDate);
      }
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }

    // 1. Send to central backend server
    try {
      await fetch('/api/period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry }),
      });
    } catch (err) {
      console.warn('Central server save failed', err);
    }

    // 2. Secondary sync to Google Sheets (if configured)
    if (config.scriptUrl && config.scriptUrl.trim()) {
      try {
        await fetch(config.scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'savePeriod',
            entry: {
              ...entry,
              updatedAt: new Date().toLocaleString('vi-VN'),
            },
          }),
        });
      } catch (err: unknown) {
        return { success: true, error: 'Đã lưu máy chủ trung tâm (chưa đồng bộ Google Sheet)' };
      }
    }

    return { success: true };
  }

  // Delete a cluster
  static async deleteCluster(
    weekNumber: number,
    dayOfWeek: number,
    clusterIndex: number,
    config: SchoolConfig
  ): Promise<{ success: boolean }> {
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;

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
        localStorage.setItem(localKey, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error('Failed to delete cluster locally', e);
    }

    // Send to central server
    try {
      await fetch('/api/delete-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, dayOfWeek, clusterIndex }),
      });
    } catch (e) {
      console.warn('Central server delete cluster failed', e);
    }

    // Sync to Google Sheets
    if (config.scriptUrl && config.scriptUrl.trim()) {
      try {
        await fetch(config.scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deleteCluster',
            weekNumber,
            dayOfWeek,
            clusterIndex,
          }),
        });
      } catch (e) {
        console.warn('Could not sync cluster delete to Google Sheets', e);
      }
    }

    return { success: true };
  }

  // Batch save week entries (e.g. Quick Entry Modal or Add Cluster)
  static async saveWeekData(
    weekNumber: number,
    entries: LogPeriodEntry[],
    config: SchoolConfig
  ): Promise<{ success: boolean; error?: string }> {
    const localKey = `${STORAGE_KEY_PREFIX_WEEK}${weekNumber}`;
    localStorage.setItem(localKey, JSON.stringify(entries));

    // 1. Send to central backend server
    try {
      await fetch(`/api/weeks/${weekNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
    } catch (err) {
      console.warn('Central server batch save failed', err);
    }

    // 2. Secondary sync to Google Sheets
    if (config.scriptUrl && config.scriptUrl.trim()) {
      try {
        await fetch(config.scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveWeek',
            weekNumber,
            entries,
          }),
        });
      } catch (err) {
        return { success: true, error: 'Đã lưu máy chủ trung tâm (chưa đồng bộ Google Sheet)' };
      }
    }

    return { success: true };
  }

  // Toggle Week Lock
  static async toggleLockWeek(
    weekNumber: number,
    isLocked: boolean,
    config: SchoolConfig
  ): Promise<SchoolConfig> {
    const newConfig: SchoolConfig = {
      ...config,
      lockedWeeks: {
        ...config.lockedWeeks,
        [weekNumber]: isLocked,
      },
    };
    ApiService.saveConfig(newConfig);

    // Sync to central backend
    fetch('/api/lock-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber, isLocked }),
    }).catch((err) => console.warn('Could not sync lock to central server', err));

    // Secondary sync to Google Sheets
    if (config.scriptUrl && config.scriptUrl.trim()) {
      try {
        fetch(config.scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'lockWeek',
            weekNumber,
            isLocked,
          }),
        });
      } catch (e) {
        console.warn('Could not sync lock status to Google Sheets', e);
      }
    }

    return newConfig;
  }
}
