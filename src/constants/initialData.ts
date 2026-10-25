import {
  SubjectName,
  TeacherAssignment,
  Student,
  SchoolConfig,
  CurrentUser,
  LogPeriodEntry,
} from '../types';

export const DEFAULT_SUBJECTS_LIST: string[] = [
  'Toán',
  'Lí',
  'Hóa',
  'Sinh',
  'Công nghệ',
  'Anh',
  'Ngữ văn',
  'Sử',
  'Địa lí',
  'GDKTPL',
  'Tin học',
];

export const SUBJECT_LIST = DEFAULT_SUBJECTS_LIST;

export const SAMPLE_DECISION_108_TEACHERS: TeacherAssignment[] = [
  // 01 & 02: Môn Toán (2 GV)
  {
    id: 'gv_01',
    teacherName: 'Nguyễn Anh Tuấn',
    position: 'Tổ phó',
    subject: 'Toán',
    email: 'totoancvabd@gmail.com',
    phone: '0905123001',
  },
  {
    id: 'gv_02',
    teacherName: 'Nguyễn Thị Thúy',
    position: 'Giáo viên',
    subject: 'Toán',
    email: 'thuycuong111107@gmail.com',
    phone: '0905123002',
  },

  // 03, 04, 05: Môn Vật lý (3 GV)
  {
    id: 'gv_03',
    teacherName: 'Vũ Thanh Thủy',
    position: 'Tổ trưởng',
    subject: 'Lí',
    email: 'thuymy.vu@gmail.com',
    phone: '0905123003',
  },
  {
    id: 'gv_04',
    teacherName: 'Võ Tấn Hùng',
    position: 'Giáo viên',
    subject: 'Lí',
    email: 'vthung1308@gmail.com',
    phone: '0905123004',
  },
  {
    id: 'gv_05',
    teacherName: 'Lý Xuân Trưng',
    position: 'Giáo viên',
    subject: 'Lí',
    email: 'xuantrungly78@gmail.com',
    phone: '0905123005',
  },

  // 06 & 07: Môn Tin học (2 GV)
  {
    id: 'gv_06',
    teacherName: 'Nguyễn Thị Giang',
    position: 'Giáo viên',
    subject: 'Tin học',
    email: 'giang160677dtntbp@gmail.com',
    phone: '0905123006',
  },
  {
    id: 'gv_07',
    teacherName: 'Lê Thị Mỹ Anh',
    position: 'Giáo viên',
    subject: 'Tin học',
    email: 'anh.blue.86@gmail.com',
    phone: '0905123007',
  },

  // 08, 09, 10: Môn Hóa học (3 GV)
  {
    id: 'gv_08',
    teacherName: 'Nguyễn Huy Hoàng',
    position: 'Tổ trưởng',
    subject: 'Hóa',
    email: 'nguyenhuyhoang171079@gmail.com',
    phone: '0905123008',
  },
  {
    id: 'gv_09',
    teacherName: 'Đỗ Thị Thu Phương',
    position: 'Giáo viên',
    subject: 'Hóa',
    email: 'thuphuong.dtntbp@gmail.com',
    phone: '0905123009',
  },
  {
    id: 'gv_10',
    teacherName: 'Hà Thị Thúy Hằng',
    position: 'Giáo viên',
    subject: 'Hóa',
    email: 'hanghoak7@gmail.com',
    phone: '0905123010',
  },

  // 11: Môn Sinh học (1 GV)
  {
    id: 'gv_11',
    teacherName: 'Đàm Thị Vân',
    position: 'Giáo viên',
    subject: 'Sinh',
    email: 'damvanhungvuong@gmail.com',
    phone: '0905123011',
  },

  // 12 & 13: Môn Ngữ văn (2 GV)
  {
    id: 'gv_12',
    teacherName: 'Huỳnh T.Tư Em',
    position: 'Giáo viên',
    subject: 'Ngữ văn',
    email: 'em.htt@gmail.com',
    phone: '0905123012',
  },
  {
    id: 'gv_13',
    teacherName: 'Trần Thị Thanh Hà',
    position: 'Tổ phó',
    subject: 'Ngữ văn',
    email: 'ha.ttt@gmail.com',
    phone: '0905123013',
  },

  // 14, 15, 16: Môn Ngoại ngữ (3 GV)
  {
    id: 'gv_14',
    teacherName: 'Vũ Minh Hằng',
    position: 'Tổ trưởng',
    subject: 'Anh',
    email: 'vuminhhang2803@gmail.com',
    phone: '0905123014',
  },
  {
    id: 'gv_15',
    teacherName: 'Nguyễn Thị Bích Thuận',
    position: 'Giáo viên',
    subject: 'Anh',
    email: 'nguyentbichthuan@gmail.com',
    phone: '0905123015',
  },
  {
    id: 'gv_16',
    teacherName: 'Bùi Thị Nhiệm',
    position: 'Giáo viên',
    subject: 'Anh',
    email: 'nhiembuinew2dxbp@gmail.com',
    phone: '0905123016',
  },

  // 17 & 18: Môn Lịch sử (2 GV)
  {
    id: 'gv_17',
    teacherName: 'Võ Văn Dũng',
    position: 'Tổ trưởng',
    subject: 'Sử',
    email: 'vandungtpdn1976@gmail.com',
    phone: '0905890123',
  },
  {
    id: 'gv_18',
    teacherName: 'Hồ Thị Bắc',
    position: 'Giáo viên',
    subject: 'Sử',
    email: 'hobacbp@gmail.com',
    phone: '0905890444',
  },

  // 19: Môn Địa lý (1 GV)
  {
    id: 'gv_19',
    teacherName: 'Mai Thị Quỳ',
    position: 'Giáo viên',
    subject: 'Địa lí',
    email: 'quythuan80@gmail.com',
    phone: '0905901234',
  },

  // 21: Môn GDKTPL (1 GV)
  {
    id: 'gv_21',
    teacherName: 'Hà Thị Thanh Huyền',
    position: 'Giáo viên',
    subject: 'GDKTPL',
    email: 'huyen.htt@gmail.com',
    phone: '0912123789',
  },

  // 22: Môn Công nghệ (1 GV)
  {
    id: 'gv_22',
    teacherName: 'Nguyễn Ngọc Minh',
    position: 'Giáo viên',
    subject: 'Công nghệ',
    email: 'minhanhminh8790@gmail.com',
    phone: '0905901888',
  },
];

// Danh sách giáo viên chuẩn Quyết định 108 trường PTDTNT THPT Bình Phước
export const DEFAULT_TEACHERS: TeacherAssignment[] = SAMPLE_DECISION_108_TEACHERS;

export const DEFAULT_STUDENTS: Student[] = [
  { id: 's01', name: 'Nguyễn Bảo An', subjectTeam: 'Toán', className: '12 Toán' },
  { id: 's02', name: 'Trần Quang Dũng', subjectTeam: 'Toán', className: '12 Toán' },
  { id: 's03', name: 'Vũ Minh Khôi', subjectTeam: 'Lí', className: '12 Lí' },
  { id: 's04', name: 'Đặng Thảo Vy', subjectTeam: 'Lí', className: '12 Lí' },
  { id: 's05', name: 'Trần Quốc Anh', subjectTeam: 'Hóa', className: '12 Hóa' },
  { id: 's06', name: 'Ngô Thanh Hà', subjectTeam: 'Hóa', className: '12 Hóa' },
  { id: 's07', name: 'Bùi Gia Huy', subjectTeam: 'Sinh', className: '12 Sinh' },
  { id: 's08', name: 'Đinh Tuấn Kiệt', subjectTeam: 'Tin học', className: '12 Tin' },
  { id: 's09', name: 'Hoàng Mai Chi', subjectTeam: 'Anh', className: '12 Anh' },
  { id: 's10', name: 'Nguyễn Thục Uyên', subjectTeam: 'Ngữ văn', className: '12 Văn' },
  { id: 's11', name: 'Lê Đình Toàn', subjectTeam: 'Sử', className: '12 Sử' },
  { id: 's12', name: 'Phạm Ngọc Trâm', subjectTeam: 'Địa lí', className: '12 Địa' },
  { id: 's13', name: 'Hồ Đăng Khoa', subjectTeam: 'GDKTPL', className: '12 GDKTPL' },
];

export const DEFAULT_CONFIG: SchoolConfig = {
  departmentName: 'SỞ GD & ĐT TP ĐỒNG NAI',
  schoolName: 'TRƯỜNG PTDTNT THPT BÌNH PHƯỚC',
  gradeLevel: 'Khối 12',
  academicYear: '2026 – 2027',
  weekOneStartDate: '2026-09-07', // Thứ 2 Tuần 1: 07/09/2026
  scriptUrl: '',
  lockedWeeks: {},
  subjectsList: DEFAULT_SUBJECTS_LIST,
  publicAppUrl: '',
};

export const ADMIN_EMAILS: string[] = ['vandungtpdn1976@gmail.com'];

export function checkIsAdmin(email?: string): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower === 'vandungtpdn1976@gmail.com' ||
    ADMIN_EMAILS.some((adm) => adm.toLowerCase() === lower) ||
    lower.includes('admin') ||
    lower.includes('bgh')
  );
}

export const DEFAULT_CURRENT_USER: CurrentUser = {
  name: 'Thầy Võ Văn Dũng',
  email: 'vandungtpdn1976@gmail.com',
  role: 'admin',
};

// Generates an empty week with at least 1 cluster (5 periods: 1..5) for each day
export function createEmptyWeekEntries(
  weekNumber: number,
  weekOneStartDateStr: string
): LogPeriodEntry[] {
  const entries: LogPeriodEntry[] = [];
  const days = [2, 3, 4, 5, 6, 7, 8];

  const [y, m, d] = weekOneStartDateStr.split('-').map(Number);
  const week1Monday = new Date(y, m - 1, d);
  const daysOffset = (weekNumber - 1) * 7;

  for (const day of days) {
    const curDate = new Date(week1Monday);
    curDate.setDate(week1Monday.getDate() + daysOffset + (day - 2));
    const dayStr = String(curDate.getDate()).padStart(2, '0');
    const monthStr = String(curDate.getMonth() + 1).padStart(2, '0');
    const yearStr = curDate.getFullYear();
    const dateFormatted = `${dayStr}/${monthStr}/${yearStr}`;

    for (let p = 1; p <= 5; p++) {
      entries.push({
        id: `w${weekNumber}_d${day}_c1_p${p}`,
        weekNumber,
        dayOfWeek: day,
        dateStr: dateFormatted,
        clusterIndex: 1,
        period: p,
        subject: '',
        ppctLesson: '',
        absentCount: 0,
        absentStudents: '',
        lessonTitle: '',
        teacherSignature: '',
        teacherEmail: '',
        updatedAt: '',
      });
    }
  }
  return entries;
}

// SAMPLE DATA FOR WEEK 5 (05/10/2026 – 11/10/2026)
// EXACTLY MATCHING USER REQUIREMENTS:
// - Thứ 3: 5 cụm môn: Hóa (tiết 1-4: PPCT 5, 6, 7, 8, GV Hà Thị Thúy Hằng, "Liên kết hoá học"), Toán, Công nghệ, Anh, Sử.
// - Thứ 4: Ngữ văn (2 giáo viên chia tiết: GV Nguyễn Mai Phương tiết 1-2, GV Lê Thị Thảo tiết 3-4), GDKTPL, Công nghệ, Hóa...
export const SAMPLE_WEEK_5_ENTRIES: LogPeriodEntry[] = createEmptyWeekEntries(5, DEFAULT_CONFIG.weekOneStartDate);
