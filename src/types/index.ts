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
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  assignedSubject?: string;
}
