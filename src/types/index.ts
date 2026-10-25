export type SubjectName =
  | 'Toán'
  | 'Lí'
  | 'Hóa'
  | 'Sinh'
  | 'Công nghệ'
  | 'Anh'
  | 'Ngữ văn'
  | 'Sử'
  | 'Địa lí'
  | 'GDKTPL'
  | 'Tin học'
  | string;

export interface LogPeriodEntry {
  id: string; // e.g. "w5_d3_c1_p1"
  weekNumber: number;
  dayOfWeek: number; // 2 = Thứ Hai, 3 = Thứ Ba, ..., 7 = Thứ Bảy, 8 = Chủ Nhật
  dateStr: string; // "13/10/2026"
  clusterIndex: number; // 1, 2, 3... (Số thứ tự cụm môn trong ngày)
  period: number; // 1, 2, 3, 4, 5
  subject: string; // Môn học (Toán, Lí, Hóa, Sinh, Công nghệ, Anh, Ngữ văn, Sử, Địa lí, GDKTPL, Tin học)
  ppctLesson: string; // Tiết PPCT (e.g. "5", "6", "7", "8")
  absentCount: number; // Số HS nghỉ
  absentStudents: string; // Tên HS nghỉ tiết
  lessonTitle: string; // Tên bài, nội dung công việc (cột rộng nhất)
  teacherSignature: string; // Ký tên (Họ tên đầy đủ của giáo viên dạy tiết đó)
  teacherEmail: string;
  updatedAt: string;
}

export interface DayCluster {
  dayOfWeek: number;
  clusterIndex: number;
  subjectName?: string;
}

export interface TeacherAssignment {
  id: string;
  teacherName: string;
  email: string;
  subject: string;
  position?: string; // Tổ trưởng, Tổ phó, Giáo viên
  phone?: string;
  className?: string; // Lớp / đội tuyển phụ trách
  weeksRange?: string; // Phạm vi tuần (e.g. "Tuần 1 - 35")
  role?: 'SUPER_ADMIN' | 'TEACHER' | 'admin' | 'teacher';
  status?: 'ACTIVE' | 'DISABLED';
  expectedPeriods?: number; // Số tiết dự kiến theo TKB (default 5)
}

export interface Student {
  id: string;
  name: string;
  subjectTeam: string;
  className?: string;
  note?: string;
}

export interface SchoolConfig {
  departmentName: string; // SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐÀ NẴNG
  schoolName: string; // TRƯỜNG THPT CHUYÊN LÊ QUÝ ĐÔN
  gradeLevel: 'Khối 10' | 'Khối 11' | 'Khối 12'; // Khối lớp
  academicYear: string; // 2026 - 2027
  weekOneStartDate: string; // YYYY-MM-DD format (Thứ 2 của Tuần 1, e.g. "2026-09-07")
  scriptUrl: string; // Google Apps Script Web App URL
  lockedWeeks: Record<number, boolean>; // { 1: true, 5: false }
  subjectsList: string[]; // Custom subjects list
  publicAppUrl?: string; // Optional custom public URL when published or deployed
}

export interface CurrentUser {
  uid?: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TEACHER' | 'admin' | 'teacher';
  status?: 'ACTIVE' | 'DISABLED';
  assignedSubject?: string;
  position?: string;
  className?: string;
  expectedPeriods?: number;
}

export type ProgressStatus = 'COMPLETED' | 'INCOMPLETE' | 'NOT_ENTERED' | 'NO_SCHEDULE';

export interface TeacherProgressItem {
  teacherId: string;
  teacherName: string;
  email: string;
  subject: string;
  className: string;
  expectedPeriods: number;
  enteredPeriods: number;
  status: ProgressStatus;
  missingPeriods: number[];
  lessonsEntered: {
    dayOfWeek: number;
    period: number;
    ppctLesson: string;
    lessonTitle: string;
  }[];
}

