import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  DEFAULT_CONFIG,
  DEFAULT_STUDENTS,
  SAMPLE_WEEK_5_ENTRIES,
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

// Initialize data if not existing
if (!fs.existsSync(CONFIG_FILE)) {
  writeJsonFile(CONFIG_FILE, DEFAULT_CONFIG);
}
if (!fs.existsSync(STUDENTS_FILE)) {
  writeJsonFile(STUDENTS_FILE, DEFAULT_STUDENTS);
}
if (!fs.existsSync(TEACHERS_FILE)) {
  writeJsonFile(TEACHERS_FILE, []);
}
// Initialize Week 5 sample data
const week5File = path.resolve(WEEKS_DIR, 'week_5.json');
if (!fs.existsSync(week5File)) {
  writeJsonFile(week5File, SAMPLE_WEEK_5_ENTRIES);
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

  // Teachers
  app.get('/api/teachers', (_req: Request, res: Response) => {
    const teachers = readJsonFile<TeacherAssignment[]>(TEACHERS_FILE, []);
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

  // Week Entries
  app.get('/api/weeks/:weekNumber', (req: Request, res: Response) => {
    const weekNumber = parseInt(req.params.weekNumber, 10);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 35) {
      res.status(400).json({ success: false, error: 'Số tuần không hợp lệ' });
      return;
    }

    const weekFile = path.resolve(WEEKS_DIR, `week_${weekNumber}.json`);
    let entries = readJsonFile<LogPeriodEntry[] | null>(weekFile, null);

    if (!entries || entries.length === 0) {
      const config = readJsonFile<SchoolConfig>(CONFIG_FILE, DEFAULT_CONFIG);
      if (weekNumber === 5) {
        entries = SAMPLE_WEEK_5_ENTRIES;
      } else {
        entries = createEmptyWeekEntries(weekNumber, config.weekOneStartDate);
      }
      writeJsonFile(weekFile, entries);
    }

    res.json({
      success: true,
      weekNumber,
      data: entries,
      updatedAt: new Date().toISOString(),
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
      } else if (w === 5) {
        entries = SAMPLE_WEEK_5_ENTRIES;
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

  // Batch Save Week Entries
  app.post('/api/weeks/:weekNumber', (req: Request, res: Response) => {
    const weekNumber = parseInt(req.params.weekNumber, 10);
    const { entries } = req.body as { entries: LogPeriodEntry[] };

    if (isNaN(weekNumber) || !Array.isArray(entries)) {
      res.status(400).json({ success: false, error: 'Dữ liệu tuần không hợp lệ' });
      return;
    }

    const normalized = entries.map((e) => ({
      ...e,
      weekNumber: Number(e.weekNumber || weekNumber),
      dayOfWeek: Number(e.dayOfWeek),
      clusterIndex: Number(e.clusterIndex || 1),
      period: Number(e.period),
    }));

    const weekFile = path.resolve(WEEKS_DIR, `week_${weekNumber}.json`);
    writeJsonFile(weekFile, normalized);
    res.json({ success: true, weekNumber, count: entries.length });
  });

  // Save Single Period Entry (Real-time updates by teachers)
  app.post('/api/period', (req: Request, res: Response) => {
    const { entry } = req.body as { entry: LogPeriodEntry };
    if (!entry || !entry.weekNumber) {
      res.status(400).json({ success: false, error: 'Dữ liệu tiết dạy không hợp lệ' });
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
    res.json({ success: true, entry: updatedEntry });
  });

  // Delete Cluster
  app.post('/api/delete-cluster', (req: Request, res: Response) => {
    const { weekNumber, dayOfWeek, clusterIndex } = req.body;
    if (!weekNumber || !dayOfWeek || !clusterIndex) {
      res.status(400).json({ success: false, error: 'Thiếu thông số cụm cần xóa' });
      return;
    }

    const weekFile = path.resolve(WEEKS_DIR, `week_${weekNumber}.json`);
    const entries = readJsonFile<LogPeriodEntry[]>(weekFile, []);
    const filtered = entries.filter(
      (e) => !(e.dayOfWeek === dayOfWeek && (e.clusterIndex || 1) === clusterIndex)
    );

    writeJsonFile(weekFile, filtered);
    res.json({ success: true, count: filtered.length });
  });

  // Toggle Week Lock (Admin only)
  app.post('/api/lock-week', (req: Request, res: Response) => {
    const { weekNumber, isLocked } = req.body;
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
