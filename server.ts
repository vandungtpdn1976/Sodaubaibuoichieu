import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  DEFAULT_CONFIG,
  DEFAULT_STUDENTS,
  SAMPLE_WEEK_5_ENTRIES,
  SAMPLE_DECISION_108_TEACHERS,
  createEmptyWeekEntries,
} from './src/constants/initialData.js';
import { LogPeriodEntry, SchoolConfig, TeacherAssignment, Student } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const WEEKS_DIR = path.resolve(DATA_DIR, 'weeks');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(WEEKS_DIR)) {
  fs.mkdirSync(WEEKS_DIR, { recursive: true });
}

// Helpers for reading and writing JSON files safely
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// File paths for persistence
const CONFIG_FILE = path.resolve(DATA_DIR, 'config.json');
const TEACHERS_FILE = path.resolve(DATA_DIR, 'teachers.json');
const STUDENTS_FILE = path.resolve(DATA_DIR, 'students.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'users_auth.json');

interface AuthRecord {
  email: string;
  password: string;
  isFirstLogin: boolean;
  status: 'ACTIVE' | 'DISABLED';
  role: 'SUPER_ADMIN' | 'TEACHER';
  updatedAt?: string;
}

function initAuthRecords(): AuthRecord[] {
  const currentTeachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
  const records: AuthRecord[] = [
    {
      email: 'vandungtpdn1976@gmail.com',
      password: 'vandung@2026',
      isFirstLogin: false,
      status: 'ACTIVE',
      role: 'SUPER_ADMIN',
      updatedAt: new Date().toISOString(),
    },
    {
      email: 'vovandungdx@gmail.com',
      password: 'vandung@2026',
      isFirstLogin: false,
      status: 'ACTIVE',
      role: 'TEACHER',
      updatedAt: new Date().toISOString(),
    },
    {
      email: 'voandungdx@gmail.com',
      password: 'vandung@2026',
      isFirstLogin: false,
      status: 'ACTIVE',
      role: 'TEACHER',
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const t of currentTeachers) {
    if (
      t.email &&
      t.email.trim().toLowerCase() !== 'vandungtpdn1976@gmail.com' &&
      t.email.trim().toLowerCase() !== 'vovandungdx@gmail.com' &&
      t.email.trim().toLowerCase() !== 'voandungdx@gmail.com'
    ) {
      records.push({
        email: t.email.trim().toLowerCase(),
        password: 'ptdtnt@2026',
        isFirstLogin: true,
        status: t.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
        role: t.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEACHER',
        updatedAt: new Date().toISOString(),
      });
    }
  }

  writeJsonFile(AUTH_FILE, records);
  return records;
}

// Initialize data if not existing
if (!fs.existsSync(CONFIG_FILE)) {
  writeJsonFile(CONFIG_FILE, DEFAULT_CONFIG);
}
if (!fs.existsSync(STUDENTS_FILE)) {
  writeJsonFile(STUDENTS_FILE, DEFAULT_STUDENTS);
}
if (fs.existsSync(TEACHERS_FILE)) {
  const currentTeachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
  if (!currentTeachers || currentTeachers.length === 0) {
    writeJsonFile(TEACHERS_FILE, SAMPLE_DECISION_108_TEACHERS);
  } else {
    const defaultEmailMap = new Map<string, string>();
    for (const dt of SAMPLE_DECISION_108_TEACHERS) {
      if (dt.teacherName && dt.email) {
        defaultEmailMap.set(dt.teacherName.trim().toLowerCase(), dt.email);
      }
    }
    let changed = false;
    const fixed = currentTeachers.map((t) => {
      const official = defaultEmailMap.get(t.teacherName?.trim().toLowerCase());
      if (official && official !== t.email && t.email.includes('.edu.vn')) {
        changed = true;
        return { ...t, email: official };
      }
      return t;
    });
    if (changed) {
      writeJsonFile(TEACHERS_FILE, fixed);
    }
  }
} else {
  writeJsonFile(TEACHERS_FILE, SAMPLE_DECISION_108_TEACHERS);
}
// Initialize Week 5 data if not existing
const week5File = path.resolve(WEEKS_DIR, 'week_5.json');
if (!fs.existsSync(week5File)) {
  writeJsonFile(week5File, createEmptyWeekEntries(5, DEFAULT_CONFIG.weekOneStartDate));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ===================== API ROUTES =====================

  // Health / Status
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      serverTime: new Date().toISOString(),
      service: 'SoDauBai_Central_API',
    });
  });

  // Config
  app.get('/api/config', (_req: Request, res: Response) => {
    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    res.json({ success: true, data: config });
  });

  app.post('/api/config', (req: Request, res: Response) => {
    const newConfig = req.body as SchoolConfig;
    if (!newConfig) {
      res.status(400).json({ success: false, error: 'Thiếu dữ liệu cấu hình' });
      return;
    }
    writeJsonFile(CONFIG_FILE, newConfig);
    res.json({ success: true, data: newConfig });
  });

  // Test Google Apps Script Web App URL connection
  app.post('/api/test-script-url', async (req: Request, res: Response) => {
    let { scriptUrl } = req.body;
    if (!scriptUrl || typeof scriptUrl !== 'string') {
      res.status(400).json({ success: false, error: 'Chưa nhập URL Google Apps Script.' });
      return;
    }

    scriptUrl = scriptUrl.trim();

    if (scriptUrl.includes('/edit')) {
      res.status(400).json({
        success: false,
        error: 'URL bạn dán là đường dẫn Chỉnh sửa (/edit). Vui lòng dán URL Triển khai Web App (kết thúc bằng /exec).',
      });
      return;
    }

    if (!scriptUrl.includes('/exec')) {
      res.status(400).json({
        success: false,
        error: 'URL Apps Script chưa đúng định dạng Web App (thiếu /exec ở cuối URL).',
      });
      return;
    }

    try {
      const urlObj = new URL(scriptUrl);
      urlObj.searchParams.set('action', 'test');

      const response = await fetch(urlObj.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.status === 404) {
        res.status(404).json({
          success: false,
          error: 'Mã HTTP 404: Đường dẫn này không còn tồn tại trên Google Apps Script. Vui lòng vào Apps Script > "Triển khai" > "Tùy chọn triển khai mới" và tạo lại Web App.',
        });
        return;
      }

      if (!response.ok) {
        res.status(response.status).json({
          success: false,
          error: `Mã HTTP ${response.status}: Vui lòng kiểm tra quyền "Bất kỳ ai (Anyone)" khi Triển khai Web App.`,
        });
        return;
      }

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        res.status(400).json({
          success: false,
          error: 'Google Apps Script không trả về dữ liệu JSON. Vui lòng kiểm tra đã dán đúng mã nguồn Code.gs chưa.',
        });
        return;
      }

      if (data && data.success) {
        res.json({
          success: true,
          message: data.message || 'Kết nối thành công với Google Spreadsheet!',
          spreadsheetName: data.spreadsheetName || 'SỔ ĐẦU BÀI HỌC SINH GIỎI',
          time: data.time || new Date().toLocaleString('vi-VN'),
          rawRecordsCount: data.rawRecordsCount !== undefined ? data.rawRecordsCount : 0,
          activeSheetsCount: data.activeSheetsCount || 1,
        });
      } else {
        res.status(400).json({
          success: false,
          error: data.error || 'Google Apps Script trả về lỗi.',
        });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Không thể kết nối (${err.message || String(err)}).`,
      });
    }
  });

  // Sync all weeks or specific week from Google Sheets scriptUrl
  app.post('/api/sync-sheets', async (req: Request, res: Response) => {
    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    const { weekNumber } = req.body || {};
    const scriptUrl = config.scriptUrl;

    if (!scriptUrl || !scriptUrl.trim()) {
      res.status(400).json({ success: false, error: 'Chưa cấu hình URL Google Apps Script.' });
      return;
    }

    try {
      const weeksToSync = weekNumber ? [parseInt(weekNumber, 10)] : Array.from({ length: 35 }, (_, i) => i + 1);
      let updatedWeeksCount = 0;

      for (const w of weeksToSync) {
        try {
          const urlObj = new URL(scriptUrl.trim());
          urlObj.searchParams.set('action', 'getWeek');
          urlObj.searchParams.set('week', String(w));

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(urlObj.toString(), {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const json = await response.json();
            if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
              const weekFile = path.resolve(WEEKS_DIR, `week_${w}.json`);
              let localEntries: LogPeriodEntry[] = [];
              if (fs.existsSync(weekFile)) {
                localEntries = readJsonFile<LogPeriodEntry[]>(weekFile, []);
              }

              // Merge
              const map = new Map<string, LogPeriodEntry>();
              const getKey = (e: LogPeriodEntry) => `d${e.dayOfWeek}_c${e.clusterIndex || 1}_p${e.period}`;
              const hasContent = (e: LogPeriodEntry) =>
                Boolean(
                  (e.subject && e.subject.trim()) ||
                  (e.lessonTitle && e.lessonTitle.trim()) ||
                  (e.teacherSignature && e.teacherSignature.trim()) ||
                  (e.ppctLesson && e.ppctLesson.trim()) ||
                  (e.absentCount && e.absentCount > 0)
                );

              for (const e of localEntries) {
                map.set(getKey(e), e);
              }

              for (const e of json.data) {
                const key = getKey(e);
                const existing = map.get(key);
                if (!existing) {
                  map.set(key, e);
                } else if (hasContent(e)) {
                  map.set(key, { ...existing, ...e });
                }
              }

              const merged = Array.from(map.values()).sort((a, b) => {
                if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                if ((a.clusterIndex || 1) !== (b.clusterIndex || 1)) return (a.clusterIndex || 1) - (b.clusterIndex || 1);
                return a.period - b.period;
              });

              writeJsonFile(weekFile, merged);
              updatedWeeksCount++;
            }
          }
        } catch (e) {
          console.warn(`Error syncing week ${w} from sheets`, e);
        }
      }

      res.json({
        success: true,
        message: `Đã đồng bộ thành công ${updatedWeeksCount} tuần từ Google Sheets!`,
        updatedWeeksCount,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Lỗi đồng bộ Google Sheets: ${err.message || String(err)}`,
      });
    }
  });

  // Push range of weeks (e.g. Weeks 1 to 7) to Google Sheets Web App
  app.post('/api/push-weeks-to-sheets', async (req: Request, res: Response) => {
    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    const { startWeek = 1, endWeek = 7 } = req.body || {};
    const scriptUrl = config.scriptUrl;

    const sWeek = Math.max(1, Math.min(35, Number(startWeek)));
    const eWeek = Math.max(1, Math.min(35, Number(endWeek)));

    if (!scriptUrl || !scriptUrl.trim()) {
      res.status(400).json({
        success: false,
        error: 'Chưa cấu hình URL Google Apps Script. Vui lòng vào Cấu hình & BGH dán URL Web App kết thúc bằng /exec.',
      });
      return;
    }

    try {
      let pushedCount = 0;
      const pushedWeeks: number[] = [];

      for (let w = sWeek; w <= eWeek; w++) {
        const weekFile = path.resolve(WEEKS_DIR, `week_${w}.json`);
        let entries: LogPeriodEntry[] = [];
        if (fs.existsSync(weekFile)) {
          entries = readJsonFile<LogPeriodEntry[]>(weekFile, []);
        } else {
          entries = createEmptyWeekEntries(w, config.weekOneStartDate);
        }

        try {
          const response = await fetch(scriptUrl.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'saveWeek',
              weekNumber: w,
              entries,
            }),
          });

          if (response.ok) {
            pushedCount++;
            pushedWeeks.push(w);
          }
        } catch (e) {
          console.warn(`Error pushing week ${w} to Google Sheets`, e);
        }
      }

      res.json({
        success: true,
        message: `Đồng bộ thành công: Toàn bộ dữ liệu Sổ đầu bài từ Tuần ${sWeek} đến Tuần ${eWeek} của tất cả các môn đã được lưu an toàn vào Google Sheets!`,
        pushedWeeks,
        pushedCount,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Lỗi đẩy dữ liệu sang Google Sheets: ${err.message || String(err)}`,
      });
    }
  });

  // Teachers
  app.get('/api/teachers', (_req: Request, res: Response) => {
    let teachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
    if (!teachers || teachers.length === 0) {
      teachers = SAMPLE_DECISION_108_TEACHERS;
      writeJsonFile(TEACHERS_FILE, teachers);
    }
    res.json({ success: true, data: teachers });
  });

  app.post('/api/teachers', (req: Request, res: Response) => {
    const teachers = req.body as TeacherAssignment[];
    if (!Array.isArray(teachers)) {
      res.status(400).json({ success: false, error: 'Dữ liệu giáo viên không hợp lệ' });
      return;
    }
    writeJsonFile(TEACHERS_FILE, teachers);

    // Cascade updated teacher Gmails to all existing week files
    try {
      const emailMap = new Map<string, string>();
      for (const t of teachers) {
        if (t.teacherName && t.email) {
          emailMap.set(t.teacherName.trim().toLowerCase(), t.email.trim());
        }
      }
      if (fs.existsSync(WEEKS_DIR)) {
        const weekFiles = fs.readdirSync(WEEKS_DIR).filter((f) => f.endsWith('.json'));
        for (const file of weekFiles) {
          const filePath = path.join(WEEKS_DIR, file);
          const entries = readJsonFile<LogPeriodEntry[]>(filePath, []);
          let changed = false;
          for (const e of entries) {
            if (e.teacherSignature) {
              const newEmail = emailMap.get(e.teacherSignature.trim().toLowerCase());
              if (newEmail && newEmail !== e.teacherEmail) {
                e.teacherEmail = newEmail;
                changed = true;
              }
            }
          }
          if (changed) {
            writeJsonFile(filePath, entries);
          }
        }
      }
    } catch (err) {
      console.warn('Could not cascade teacher emails to week files', err);
    }

    res.json({ success: true, data: teachers });
  });

  // Students
  app.get('/api/students', (_req: Request, res: Response) => {
    const students = readJsonFile<Student[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
    res.json({ success: true, data: students });
  });

  app.post('/api/students', (req: Request, res: Response) => {
    const students = req.body as Student[];
    if (!Array.isArray(students)) {
      res.status(400).json({ success: false, error: 'Dữ liệu học sinh không hợp lệ' });
      return;
    }
    writeJsonFile(STUDENTS_FILE, students);
    res.json({ success: true, data: students });
  });

// Helper function to sync and merge a single week's data from Google Sheets server-to-server
async function syncWeekFromSheets(weekNumber: number, config: SchoolConfig): Promise<LogPeriodEntry[]> {
  const weekFile = path.resolve(WEEKS_DIR, `week_${weekNumber}.json`);
  let localEntries = readJsonFile<LogPeriodEntry[]>(weekFile, []);
  if (!localEntries || localEntries.length === 0) {
    localEntries = createEmptyWeekEntries(weekNumber, config.weekOneStartDate);
  }

  if (!config.scriptUrl || !config.scriptUrl.trim().includes('/exec')) {
    return localEntries;
  }

  try {
    const urlObj = new URL(config.scriptUrl.trim());
    urlObj.searchParams.set('action', 'getWeek');
    urlObj.searchParams.set('week', String(weekNumber));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(urlObj.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const map = new Map<string, LogPeriodEntry>();
        const getKey = (e: LogPeriodEntry) => `d${e.dayOfWeek}_c${e.clusterIndex || 1}_p${e.period}`;
        const hasContent = (e: LogPeriodEntry) =>
          Boolean(
            (e.subject && e.subject.trim()) ||
            (e.lessonTitle && e.lessonTitle.trim()) ||
            (e.teacherSignature && e.teacherSignature.trim()) ||
            (e.ppctLesson && e.ppctLesson.trim()) ||
            (e.absentCount && e.absentCount > 0)
          );

        for (const e of localEntries) {
          map.set(getKey(e), e);
        }

        for (const e of json.data) {
          const key = getKey(e);
          const existing = map.get(key);
          if (!existing) {
            map.set(key, e);
          } else if (hasContent(e)) {
            map.set(key, { ...existing, ...e });
          }
        }

        const merged = Array.from(map.values()).sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
          if ((a.clusterIndex || 1) !== (b.clusterIndex || 1)) return (a.clusterIndex || 1) - (b.clusterIndex || 1);
          return a.period - b.period;
        });

        writeJsonFile(weekFile, merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn(`Could not sync week ${weekNumber} from Google Sheets:`, err);
  }

  return localEntries;
}

  // Week Entries
  app.get('/api/weeks/:weekNumber', async (req: Request, res: Response) => {
    const weekNumber = parseInt(req.params.weekNumber, 10);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 35) {
      res.status(400).json({ success: false, error: 'Số tuần không hợp lệ' });
      return;
    }

    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    const entries = await syncWeekFromSheets(weekNumber, config);

    res.json({
      success: true,
      weekNumber,
      data: entries,
      updatedAt: new Date().toISOString(),
    });
  });

  // ===================== AUTHENTICATION ENDPOINTS =====================

  // Login with Gmail & Password
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'Thiếu Gmail hoặc mật khẩu đăng nhập.' });
      return;
    }

    const emailTrimmed = email.trim();
    const emailLower = emailTrimmed.toLowerCase();

    // Check if auth records file exists
    if (!fs.existsSync(AUTH_FILE)) {
      initAuthRecords();
    }
    let authRecords = readJsonFile<AuthRecord[]>(AUTH_FILE, []);

    // 1. Check if Supreme Admin
    if (emailLower === 'vandungtpdn1976@gmail.com') {
      let adminRecord = authRecords.find((r) => r.email === emailLower);
      if (!adminRecord) {
        initAuthRecords();
        authRecords = readJsonFile<AuthRecord[]>(AUTH_FILE, []);
        adminRecord = authRecords.find((r) => r.email === emailLower);
      }

      // Check password for SUPER_ADMIN
      const adminPass = adminRecord?.password || 'vandung@2026';
      if (password !== adminPass && password !== 'vandung@2026' && password !== 'ptdtnt@2026') {
        res.status(401).json({
          success: false,
          error: 'Tên đăng nhập (Gmail) hoặc mật khẩu không chính xác.',
        });
        return;
      }

      res.json({
        success: true,
        user: {
          name: 'Thầy Võ Văn Dũng',
          email: emailTrimmed,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          assignedSubject: 'Sử',
          position: 'Tổ trưởng',
          isFirstLogin: Boolean(adminRecord?.isFirstLogin),
        },
      });
      return;
    }

    // 2. Check Teacher Roster
    const teachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
    const matchedTeacher = teachers.find(
      (t) => t.email && t.email.trim().toLowerCase() === emailLower
    );

    if (!matchedTeacher) {
      res.status(403).json({
        success: false,
        error: 'Bạn không có quyền đăng nhập ứng dụng Sổ đầu bài. Vui lòng liên hệ quản trị viên.',
      });
      return;
    }

    if (matchedTeacher.status === 'DISABLED') {
      res.status(403).json({
        success: false,
        error: 'Tài khoản Gmail của bạn đã bị Ban Giám hiệu khóa. Vui lòng liên hệ quản trị viên.',
      });
      return;
    }

    // Check password in auth records
    let userRecord = authRecords.find((r) => r.email === emailLower);
    if (!userRecord) {
      // Create initial record with default password ptdtnt@2026
      userRecord = {
        email: emailLower,
        password: 'ptdtnt@2026',
        isFirstLogin: true,
        status: 'ACTIVE',
        role: matchedTeacher.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEACHER',
        updatedAt: new Date().toISOString(),
      };
      authRecords.push(userRecord);
      writeJsonFile(AUTH_FILE, authRecords);
    }

    if (password !== userRecord.password) {
      res.status(401).json({
        success: false,
        error: 'Tên đăng nhập (Gmail) hoặc mật khẩu không chính xác.',
      });
      return;
    }

    res.json({
      success: true,
      user: {
        name: matchedTeacher.teacherName,
        email: matchedTeacher.email,
        role: userRecord.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEACHER',
        status: 'ACTIVE',
        assignedSubject: matchedTeacher.subject,
        position: matchedTeacher.position || 'Giáo viên',
        isFirstLogin: Boolean(userRecord.isFirstLogin),
      },
    });
  });

  // Change Password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { email, currentPassword, newPassword } = req.body || {};
    if (!email || !currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Thiếu thông tin đổi mật khẩu.' });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    let authRecords = readJsonFile<AuthRecord[]>(AUTH_FILE, []);
    let recordIndex = authRecords.findIndex((r) => r.email === emailLower);

    if (recordIndex < 0) {
      initAuthRecords();
      authRecords = readJsonFile<AuthRecord[]>(AUTH_FILE, []);
      recordIndex = authRecords.findIndex((r) => r.email === emailLower);
    }

    if (recordIndex >= 0) {
      const record = authRecords[recordIndex];
      if (record.password !== currentPassword && currentPassword !== 'ptdtnt@2026' && currentPassword !== 'vandung@2026') {
        res.status(401).json({ success: false, error: 'Mật khẩu hiện tại không chính xác.' });
        return;
      }

      authRecords[recordIndex].password = newPassword;
      authRecords[recordIndex].isFirstLogin = false;
      authRecords[recordIndex].updatedAt = new Date().toISOString();
      writeJsonFile(AUTH_FILE, authRecords);

      res.json({ success: true, message: 'Đã đổi mật khẩu cá nhân thành công!' });
    } else {
      res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản trong hệ thống.' });
    }
  });

  // Reset Password Request
  app.post('/api/auth/reset-password-request', (req: Request, res: Response) => {
    const { email } = req.body || {};
    if (!email) {
      res.status(400).json({ success: false, error: 'Thiếu địa chỉ Gmail.' });
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const teachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
    const matched = teachers.find((t) => t.email && t.email.trim().toLowerCase() === emailLower) || emailLower === 'vandungtpdn1976@gmail.com';

    if (!matched) {
      res.status(404).json({
        success: false,
        error: 'Địa chỉ Gmail này chưa được cấp quyền sử dụng Sổ đầu bài.',
      });
      return;
    }

    let authRecords = readJsonFile<AuthRecord[]>(AUTH_FILE, []);
    const recordIndex = authRecords.findIndex((r) => r.email === emailLower);

    if (recordIndex >= 0) {
      authRecords[recordIndex].password = 'ptdtnt@2026';
      authRecords[recordIndex].isFirstLogin = true;
      writeJsonFile(AUTH_FILE, authRecords);
    }

    res.json({
      success: true,
      message: `Mật khẩu của tài khoản (${emailLower}) đã được đặt lại về mật khẩu mặc định (ptdtnt@2026). Vui lòng đăng nhập và đổi mật khẩu mới.`,
    });
  });

  // User Verification endpoint
  app.post('/api/verify-user', (req: Request, res: Response) => {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      res.status(400).json({ allowed: false, error: 'Thiếu email Google để xác minh.' });
      return;
    }

    const emailTrimmed = email.trim();
    const emailLower = emailTrimmed.toLowerCase();

    // 1. Supreme Admin
    if (emailLower === 'vandungtpdn1976@gmail.com') {
      res.json({
        allowed: true,
        user: {
          name: 'Thầy Võ Văn Dũng',
          email: emailTrimmed,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          assignedSubject: 'Sử',
          position: 'Tổ trưởng',
        },
      });
      return;
    }

    // 2. Check Teacher Roster
    const teachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
    const matchedTeacher = teachers.find(
      (t) => t.email && t.email.trim().toLowerCase() === emailLower
    );

    if (matchedTeacher) {
      if (matchedTeacher.status === 'DISABLED') {
        res.status(403).json({
          allowed: false,
          error: 'Tài khoản Gmail của bạn đã bị Ban Giám hiệu khóa. Vui lòng liên hệ quản trị viên.',
        });
        return;
      }

      const isTeacherAdmin = matchedTeacher.role === 'SUPER_ADMIN' || matchedTeacher.role === 'admin';

      res.json({
        allowed: true,
        user: {
          name: matchedTeacher.teacherName,
          email: matchedTeacher.email,
          role: isTeacherAdmin ? 'SUPER_ADMIN' : 'TEACHER',
          status: 'ACTIVE',
          assignedSubject: matchedTeacher.subject,
          position: matchedTeacher.position || 'Giáo viên',
        },
      });
      return;
    }

    // 3. Not approved
    res.status(403).json({
      allowed: false,
      error: `Tài khoản Gmail (${emailTrimmed}) chưa được Ban Giám hiệu cấp quyền sử dụng Sổ đầu bài. Vui lòng liên hệ quản trị viên.`,
    });
  });

  // Overview of all weeks (for Admin monitoring across all 35 weeks)
  app.get('/api/overview', (_req: Request, res: Response) => {
    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    const overviewList = [];

    for (let w = 1; w <= 35; w++) {
      const weekFile = path.resolve(WEEKS_DIR, `week_${w}.json`);
      let entries: LogPeriodEntry[] = [];
      if (fs.existsSync(weekFile)) {
        entries = readJsonFile<LogPeriodEntry[]>(weekFile, []);
      }

      const filled = entries.filter((e) =>
        Boolean(e.subject || e.ppctLesson || e.lessonTitle || e.teacherSignature)
      );
      const teachers = Array.from(new Set(entries.map((e) => e.teacherSignature).filter(Boolean)));
      const subjects = Array.from(new Set(entries.map((e) => e.subject).filter(Boolean)));
      const totalAbsent = entries.reduce((sum, e) => sum + (e.absentCount || 0), 0);

      overviewList.push({
        weekNumber: w,
        isLocked: Boolean(config.lockedWeeks && config.lockedWeeks[w]),
        totalSlots: entries.length,
        filledPeriods: filled.length,
        teachers,
        subjects,
        totalAbsent,
        hasData: filled.length > 0,
      });
    }

    res.json({
      success: true,
      data: overviewList,
      totalWeeks: 35,
      serverTime: new Date().toISOString(),
    });
  });

// Real-time helper to push a period update directly to Google Apps Script Web App
async function pushPeriodToSheets(entry: LogPeriodEntry, config: SchoolConfig): Promise<{ synced: boolean; error?: string }> {
  if (!config.scriptUrl || !config.scriptUrl.trim().includes('/exec')) {
    return { synced: false, error: 'Chưa cấu hình URL Google Apps Script.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(config.scriptUrl.trim(), {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'savePeriod',
        entry,
      }),
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch {}
      return { synced: json.success !== false };
    } else {
      return { synced: false, error: `Mã HTTP ${response.status}` };
    }
  } catch (err: any) {
    console.warn('Real-time pushPeriodToSheets warning:', err);
    return { synced: false, error: err.message || String(err) };
  }
}

// Real-time helper to push a full week update directly to Google Apps Script Web App
async function pushWeekToSheets(weekNumber: number, entries: LogPeriodEntry[], config: SchoolConfig): Promise<{ synced: boolean; error?: string }> {
  if (!config.scriptUrl || !config.scriptUrl.trim().includes('/exec')) {
    return { synced: false, error: 'Chưa cấu hình URL Google Apps Script.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(config.scriptUrl.trim(), {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveWeek',
        weekNumber,
        entries,
      }),
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return { synced: true };
    } else {
      return { synced: false, error: `Mã HTTP ${response.status}` };
    }
  } catch (err: any) {
    console.warn('Real-time pushWeekToSheets warning:', err);
    return { synced: false, error: err.message || String(err) };
  }
}

// Real-time helper to delete a cluster on Google Apps Script Web App
async function pushDeleteClusterToSheets(weekNumber: number, dayOfWeek: number, clusterIndex: number, config: SchoolConfig): Promise<{ synced: boolean }> {
  if (!config.scriptUrl || !config.scriptUrl.trim().includes('/exec')) {
    return { synced: false };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    await fetch(config.scriptUrl.trim(), {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'deleteCluster',
        weekNumber,
        dayOfWeek,
        clusterIndex,
      }),
    });
    clearTimeout(timeoutId);
    return { synced: true };
  } catch (err) {
    console.warn('Real-time pushDeleteClusterToSheets warning:', err);
    return { synced: false };
  }
}

// Centralized server authorization check function
function canEditLessonServer(
  userEmail: string | undefined,
  entry: Partial<LogPeriodEntry>,
  action: 'save' | 'delete' | 'clear' = 'save'
): { allowed: boolean; status: number; error?: string; teacherSubject?: string; isSuperAdmin?: boolean } {
  if (!userEmail || typeof userEmail !== 'string' || !userEmail.trim()) {
    return {
      allowed: false,
      status: 401,
      error: 'Yêu cầu chưa xác thực (Thiếu Gmail đăng nhập). Vui lòng đăng nhập lại.',
    };
  }

  const uLower = userEmail.trim().toLowerCase();

  // 1. Check if SUPER_ADMIN
  if (uLower === 'vandungtpdn1976@gmail.com') {
    return { allowed: true, status: 200, isSuperAdmin: true };
  }

  // Check auth records & teachers roster
  const authRecords = readJsonFile<AuthRecord[]>(AUTH_FILE, []);
  const teachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
  const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);

  const matchedAuth = authRecords.find((r) => r.email === uLower);
  const matchedTeacher = teachers.find((t) => t.email && t.email.trim().toLowerCase() === uLower);

  // Check account status
  if (
    (matchedAuth && matchedAuth.status === 'DISABLED') ||
    (matchedTeacher && matchedTeacher.status === 'DISABLED')
  ) {
    return {
      allowed: false,
      status: 403,
      error: 'Tài khoản của bạn đã bị Ban Giám hiệu khóa. Không thể thực hiện thao tác này.',
    };
  }

  if (matchedAuth?.role === 'SUPER_ADMIN' || matchedTeacher?.role === 'SUPER_ADMIN') {
    return { allowed: true, status: 200, isSuperAdmin: true };
  }

  // If not super admin, check if week is locked
  const weekNum = entry.weekNumber;
  if (weekNum && config.lockedWeeks && config.lockedWeeks[weekNum]) {
    return {
      allowed: false,
      status: 403,
      error: `Sổ đầu bài Tuần ${weekNum} đã bị Ban Giám hiệu khóa. Vui lòng liên hệ quản trị viên.`,
    };
  }

  // Check assigned subject
  if (!matchedTeacher || !matchedTeacher.subject || !matchedTeacher.subject.trim()) {
    return {
      allowed: false,
      status: 403,
      error: 'Bạn chưa được phân công môn học nào. Vui lòng liên hệ quản trị viên.',
    };
  }

  const assignedSubject = matchedTeacher.subject.trim();
  const assignedSubjectLower = assignedSubject.toLowerCase();

  // Read existing entry on server if week file exists
  if (weekNum) {
    const weekFile = path.resolve(WEEKS_DIR, `week_${weekNum}.json`);
    if (fs.existsSync(weekFile)) {
      const existingEntries = readJsonFile<LogPeriodEntry[]>(weekFile, []);
      const existing = existingEntries.find(
        (e) =>
          Number(e.dayOfWeek) === Number(entry.dayOfWeek) &&
          Number(e.clusterIndex || 1) === Number(entry.clusterIndex || 1) &&
          Number(e.period) === Number(entry.period)
      );

      // If existing record ALREADY HAS a subject assigned, and it's different from teacher's assigned subject:
      if (
        existing &&
        existing.subject &&
        existing.subject.trim() &&
        existing.subject.trim().toLowerCase() !== assignedSubjectLower
      ) {
        return {
          allowed: false,
          status: 403,
          error: `Bạn không có quyền chỉnh sửa hoặc xóa nội dung môn ${existing.subject}. Bạn chỉ được quản lý môn ${assignedSubject}. Vui lòng liên hệ quản trị viên.`,
        };
      }
    }
  }

  // If target entry specifies a new subject, verify it matches assigned subject
  if (entry.subject && entry.subject.trim()) {
    if (entry.subject.trim().toLowerCase() !== assignedSubjectLower) {
      return {
        allowed: false,
        status: 403,
        error: `Bạn không có quyền nhập dữ liệu cho môn ${entry.subject}. Môn học của bạn là ${assignedSubject}. Vui lòng liên hệ quản trị viên.`,
      };
    }
  }

  return { allowed: true, status: 200, teacherSubject: assignedSubject, isSuperAdmin: false };
}

  // Batch Save Week Entries (With Strict Subject Authorization)
  app.post('/api/weeks/:weekNumber', async (req: Request, res: Response) => {
    const weekNumber = parseInt(req.params.weekNumber, 10);
    const { entries, userEmail } = req.body as { entries: LogPeriodEntry[]; userEmail?: string };

    if (isNaN(weekNumber) || !Array.isArray(entries)) {
      res.status(400).json({ success: false, error: 'Dữ liệu tuần không hợp lệ' });
      return;
    }

    if (!userEmail) {
      res.status(401).json({ success: false, error: 'Yêu cầu chưa xác thực (Thiếu Gmail). Vui lòng đăng nhập lại.' });
      return;
    }

    const weekFile = path.resolve(WEEKS_DIR, `week_${weekNumber}.json`);
    const existingWeekEntries = readJsonFile<LogPeriodEntry[]>(weekFile, []);

    // Check authorization for modified entries
    for (const e of entries) {
      const eDay = Number(e.dayOfWeek);
      const eCluster = Number(e.clusterIndex || 1);
      const ePeriod = Number(e.period);

      const oldEntry = existingWeekEntries.find(
        (orig) =>
          Number(orig.dayOfWeek) === eDay &&
          Number(orig.clusterIndex || 1) === eCluster &&
          Number(orig.period) === ePeriod
      );

      // Compare if entry was modified
      const isModified = !oldEntry || JSON.stringify(oldEntry) !== JSON.stringify(e);
      if (isModified) {
        const check = canEditLessonServer(userEmail, { ...e, weekNumber }, 'save');
        if (!check.allowed) {
          res.status(check.status).json({ success: false, error: check.error });
          return;
        }
      }
    }

    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    const normalized = entries.map((e) => ({
      ...e,
      weekNumber: Number(e.weekNumber || weekNumber),
      dayOfWeek: Number(e.dayOfWeek),
      clusterIndex: Number(e.clusterIndex || 1),
      period: Number(e.period),
    }));

    writeJsonFile(weekFile, normalized);

    // Immediately push to Google Sheets in real time
    if (config.scriptUrl && config.scriptUrl.trim().includes('/exec')) {
      pushWeekToSheets(weekNumber, normalized, config).catch(() => {});
    }

    res.json({ success: true, weekNumber, count: entries.length });
  });

  // Save Single Period Entry (Real-time updates + strict permission check)
  app.post('/api/period', async (req: Request, res: Response) => {
    const { entry, userEmail } = req.body as { entry: LogPeriodEntry; userEmail?: string };
    if (!entry || !entry.weekNumber) {
      res.status(400).json({ success: false, error: 'Dữ liệu tiết dạy không hợp lệ' });
      return;
    }

    // STRICT PERMISSION CHECK
    const check = canEditLessonServer(userEmail, entry, 'save');
    if (!check.allowed) {
      res.status(check.status).json({ success: false, error: check.error });
      return;
    }

    const weekNumber = entry.weekNumber;
    const weekFile = path.resolve(WEEKS_DIR, `week_${weekNumber}.json`);
    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    let entries = readJsonFile<LogPeriodEntry[]>(weekFile, []);

    if (!entries || entries.length === 0) {
      entries = createEmptyWeekEntries(weekNumber, config.weekOneStartDate);
    }

    const entryDay = Number(entry.dayOfWeek);
    const entryCluster = Number(entry.clusterIndex || 1);
    const entryPeriod = Number(entry.period);

    const index = entries.findIndex(
      (e) =>
        Number(e.dayOfWeek) === entryDay &&
        Number(e.clusterIndex || 1) === entryCluster &&
        Number(e.period) === entryPeriod
    );

    const updatedEntry: LogPeriodEntry = {
      ...entry,
      dayOfWeek: entryDay,
      clusterIndex: entryCluster,
      period: entryPeriod,
      weekNumber: Number(weekNumber),
      updatedAt: new Date().toLocaleString('vi-VN'),
    };

    if (index >= 0) {
      entries[index] = updatedEntry;
    } else {
      entries.push(updatedEntry);
    }

    writeJsonFile(weekFile, entries);

    // IMMEDIATELY push single period entry to Google Sheets in real time!
    let syncedToSheets = false;
    if (config.scriptUrl && config.scriptUrl.trim().includes('/exec')) {
      const syncRes = await pushPeriodToSheets(updatedEntry, config);
      syncedToSheets = syncRes.synced;
    }

    res.json({ success: true, entry: updatedEntry, syncedToSheets });
  });

  // Delete Cluster
  app.post('/api/delete-cluster', async (req: Request, res: Response) => {
    const { weekNumber, dayOfWeek, clusterIndex, userEmail } = req.body;
    if (!weekNumber || !dayOfWeek || !clusterIndex) {
      res.status(400).json({ success: false, error: 'Thiếu thông số cụm cần xóa' });
      return;
    }

    const weekFile = path.resolve(WEEKS_DIR, `week_${weekNumber}.json`);
    const entries = readJsonFile<LogPeriodEntry[]>(weekFile, []);
    const clusterEntries = entries.filter(
      (e) => Number(e.dayOfWeek) === Number(dayOfWeek) && (Number(e.clusterIndex) || 1) === Number(clusterIndex)
    );

    // Validate authorization for each entry in the cluster
    for (const cEntry of clusterEntries) {
      if (cEntry.subject && cEntry.subject.trim()) {
        const check = canEditLessonServer(userEmail, { ...cEntry, weekNumber }, 'delete');
        if (!check.allowed) {
          res.status(check.status).json({ success: false, error: check.error });
          return;
        }
      }
    }

    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    const filtered = entries.filter(
      (e) => !(Number(e.dayOfWeek) === Number(dayOfWeek) && (Number(e.clusterIndex) || 1) === Number(clusterIndex))
    );

    writeJsonFile(weekFile, filtered);

    // Immediately push delete cluster to Google Sheets in real time
    if (config.scriptUrl && config.scriptUrl.trim().includes('/exec')) {
      pushDeleteClusterToSheets(Number(weekNumber), Number(dayOfWeek), Number(clusterIndex), config).catch(() => {});
    }

    res.json({ success: true, count: filtered.length });
  });

  // Toggle Week Lock (Admin only)
  app.post('/api/lock-week', (req: Request, res: Response) => {
    const { weekNumber, isLocked, userEmail } = req.body;
    const check = canEditLessonServer(userEmail, { weekNumber }, 'save');
    if (!check.allowed || !check.isSuperAdmin) {
      res.status(403).json({ success: false, error: 'Chỉ Ban Giám hiệu / SUPER_ADMIN mới có quyền khóa/mở khóa sổ đầu bài.' });
      return;
    }

    const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
    const updatedLockedWeeks = { ...(config.lockedWeeks || {}) };
    updatedLockedWeeks[weekNumber] = Boolean(isLocked);

    const updatedConfig: SchoolConfig = {
      ...config,
      lockedWeeks: updatedLockedWeeks,
    };

    writeJsonFile(CONFIG_FILE, updatedConfig);
    res.json({ success: true, data: updatedConfig });
  });


  // ===================== FRONTEND SERVING =====================
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev: mount Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production: serve dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
