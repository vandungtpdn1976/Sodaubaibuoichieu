import React, { useState } from 'react';
import {
  Settings,
  Users,
  Lock,
  GraduationCap,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  BookOpen,
  Info,
  Check,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  Globe,
  Mail,
  Database,
  KeyRound,
} from 'lucide-react';
import { SchoolConfig, TeacherAssignment, Student } from '../types';
import { ApiService } from '../services/apiService';
import { DEFAULT_TEACHERS, SAMPLE_DECISION_108_TEACHERS } from '../constants/initialData';
import { TeacherImportModal } from './TeacherImportModal';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  onSaveConfig: (newConfig: SchoolConfig) => void;
  teachers: TeacherAssignment[];
  onSaveTeachers: (newTeachers: TeacherAssignment[]) => void;
  students: Student[];
  onSaveStudents: (newStudents: Student[]) => void;
  onOpenAppsScriptCode: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  teachers,
  onSaveTeachers,
  students,
  onSaveStudents,
  onOpenAppsScriptCode,
}) => {
  const [draftConfig, setDraftConfig] = useState<SchoolConfig>({ ...config });
  const [draftTeachers, setDraftTeachers] = useState<TeacherAssignment[]>([...teachers]);
  const [draftStudents, setDraftStudents] = useState<Student[]>([...students]);

  const [activeTab, setActiveTab] = useState<'config' | 'teachers' | 'locks' | 'students' | 'progress' | 'matrix'>('progress');
  const [selectedProgressWeek, setSelectedProgressWeek] = useState<number>(5);
  const [progressItems, setProgressItems] = useState<import('../types').TeacherProgressItem[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progressSubjectFilter, setProgressSubjectFilter] = useState('');
  const [progressStatusFilter, setProgressStatusFilter] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE' | 'NOT_ENTERED'>('ALL');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [matrixCellDetail, setMatrixCellDetail] = useState<{ teacherName: string; subject: string; week: number; item?: import('../types').TeacherProgressItem } | null>(null);

  // Load progress items when week or tab changes
  React.useEffect(() => {
    if (activeTab === 'progress' || activeTab === 'matrix') {
      setIsLoadingProgress(true);
      ApiService.fetchProgressSummary(selectedProgressWeek, draftConfig)
        .then((items) => setProgressItems(items))
        .catch((err) => console.warn('Could not fetch progress summary', err))
        .finally(() => setIsLoadingProgress(false));
    }
  }, [activeTab, selectedProgressWeek, draftConfig]);

  // Sync draftTeachers whenever teachers prop changes
  React.useEffect(() => {
    if (teachers && teachers.length > 0) {
      setDraftTeachers([...teachers]);
    }
  }, [teachers]);

  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingUnsynced, setIsSyncingUnsynced] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    spreadsheetName?: string;
    time?: string;
    rawRecordsCount?: number;
    activeSheetsCount?: number;
  } | null>(null);

  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState<string>('');

  const [newTeacher, setNewTeacher] = useState<Partial<TeacherAssignment>>({
    teacherName: '',
    subject: config.subjectsList[0] || 'Hóa',
    email: '',
    phone: '',
  });

  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    subjectTeam: config.subjectsList[0] || 'Hóa',
    className: '',
    note: '',
  });

  const [newSubjectInput, setNewSubjectInput] = useState('');

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await ApiService.testConnection(draftConfig.scriptUrl);
      setTestResult(res);
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Lỗi khi kết nối Google Apps Script.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTeacherEmailChange = (teacherId: string, newEmail: string) => {
    setDraftTeachers((prev) =>
      prev.map((t) => (t.id === teacherId ? { ...t, email: newEmail } : t))
    );
  };

  const handleAutoSaveTeacherEmail = (_teacherId: string) => {
    onSaveTeachers(draftTeachers);
    ApiService.saveTeachers(draftTeachers);
  };

  const handleSaveSingleTeacher = (teacherId: string) => {
    const t = draftTeachers.find((item) => item.id === teacherId);
    onSaveTeachers(draftTeachers);
    ApiService.saveTeachers(draftTeachers);
    setSaveNotification(`Đã lưu thành công Gmail của ${t?.teacherName || 'giáo viên'} (${t?.email})!`);
    setTimeout(() => setSaveNotification(null), 4000);
  };

  const handleSaveAllTeacherEmails = () => {
    onSaveTeachers(draftTeachers);
    ApiService.saveTeachers(draftTeachers);
    setSaveNotification(`Đã lưu thành công địa chỉ Gmail của tất cả ${draftTeachers.length} giáo viên vào hệ thống!`);
    setTimeout(() => setSaveNotification(null), 5000);
  };

  const handleSaveAll = () => {
    let finalTeachers = [...draftTeachers];
    // If the admin filled in the top form, merge it
    if (newTeacher.teacherName?.trim() && newTeacher.email?.trim()) {
      const trimmedName = newTeacher.teacherName.trim();
      const trimmedEmail = newTeacher.email.trim();
      const matchIdx = finalTeachers.findIndex(
        (t) =>
          t.id === editingTeacherId ||
          t.teacherName.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (matchIdx >= 0) {
        finalTeachers = finalTeachers.map((t, idx) =>
          idx === matchIdx
            ? {
                ...t,
                teacherName: trimmedName,
                position: newTeacher.position || t.position || 'Giáo viên',
                email: trimmedEmail,
                subject: newTeacher.subject || t.subject || draftConfig.subjectsList[0] || 'Toán',
                phone: newTeacher.phone?.trim() || t.phone || '',
              }
            : t
        );
      } else if (!editingTeacherId) {
        finalTeachers.push({
          id: 'gv_' + Date.now(),
          teacherName: trimmedName,
          position: newTeacher.position || 'Giáo viên',
          email: trimmedEmail,
          subject: newTeacher.subject || draftConfig.subjectsList[0] || 'Toán',
          phone: newTeacher.phone?.trim() || '',
        });
      }
    }

    onSaveConfig(draftConfig);
    onSaveTeachers(finalTeachers);
    ApiService.saveTeachers(finalTeachers);
    onSaveStudents(draftStudents);
    onClose();
  };

  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const handleAddOrUpdateTeacher = () => {
    if (!newTeacher.teacherName?.trim() || !newTeacher.email?.trim()) {
      alert('Vui lòng nhập Họ tên và Email Google của giáo viên.');
      return;
    }

    const trimmedName = newTeacher.teacherName.trim();
    const trimmedEmail = newTeacher.email.trim();

    // Check if teacher exists by ID or by matching name
    const matchIdx = draftTeachers.findIndex(
      (t) =>
        t.id === editingTeacherId ||
        t.teacherName.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    let updatedList: TeacherAssignment[];
    if (matchIdx >= 0) {
      // Update existing teacher!
      updatedList = draftTeachers.map((t, idx) =>
        idx === matchIdx
          ? {
              ...t,
              teacherName: trimmedName,
              position: newTeacher.position || t.position || 'Giáo viên',
              email: trimmedEmail,
              subject: newTeacher.subject || t.subject || draftConfig.subjectsList[0] || 'Toán',
              phone: newTeacher.phone?.trim() || t.phone || '',
            }
          : t
      );
      setEditingTeacherId(null);
    } else {
      // Add new teacher
      const item: TeacherAssignment = {
        id: 'gv_' + Date.now(),
        teacherName: trimmedName,
        position: newTeacher.position || 'Giáo viên',
        email: trimmedEmail,
        subject: newTeacher.subject || draftConfig.subjectsList[0] || 'Toán',
        phone: newTeacher.phone?.trim() || '',
      };
      updatedList = [...draftTeachers, item];
    }

    setDraftTeachers(updatedList);
    onSaveTeachers(updatedList);
    ApiService.saveTeachers(updatedList);

    setSaveNotification(
      matchIdx >= 0
        ? `Đã cập nhật và lưu Gmail giáo viên "${trimmedName}" (${trimmedEmail}) thành công!`
        : `Đã thêm và lưu giáo viên "${trimmedName}" vào hệ thống!`
    );
    setTimeout(() => setSaveNotification(null), 5000);

    // Reset form
    setNewTeacher({
      teacherName: '',
      position: 'Giáo viên',
      subject: newTeacher.subject || draftConfig.subjectsList[0] || 'Toán',
      email: '',
      phone: '',
    });
  };

  const handleStartEditTeacher = (teacher: TeacherAssignment) => {
    setEditingTeacherId(teacher.id);
    setNewTeacher({
      teacherName: teacher.teacherName,
      position: teacher.position || 'Giáo viên',
      subject: teacher.subject,
      email: teacher.email,
      phone: teacher.phone || '',
    });
  };

  const handleCancelEditTeacher = () => {
    setEditingTeacherId(null);
    setNewTeacher({
      teacherName: '',
      position: 'Giáo viên',
      subject: draftConfig.subjectsList[0] || 'Toán',
      email: '',
      phone: '',
    });
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [confirmClearAllTeachers, setConfirmClearAllTeachers] = useState(false);

  const handleDeleteTeacher = (id: string) => {
    if (editingTeacherId === id) {
      handleCancelEditTeacher();
    }
    setDraftTeachers(draftTeachers.filter((t) => t.id !== id));
  };

  const handleClearAllTeachers = () => {
    setDraftTeachers([]);
    handleCancelEditTeacher();
    setConfirmClearAllTeachers(false);
  };

  const handleImportTeachers = (imported: TeacherAssignment[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setDraftTeachers(imported);
    } else {
      setDraftTeachers([...draftTeachers, ...imported]);
    }
    handleCancelEditTeacher();
  };

  const handleResetSampleTeachers = () => {
    if (
      window.confirm(
        'Khôi phục danh sách mẫu chuẩn 21 giáo viên bồi dưỡng HSG theo Quyết định số 108/QĐ-PTDTNT-THPT-BP năm học 2026–2027 của Trường PTDTNT THPT Bình Phước?'
      )
    ) {
      setDraftTeachers([...SAMPLE_DECISION_108_TEACHERS]);
      onSaveTeachers([...SAMPLE_DECISION_108_TEACHERS]);
      ApiService.saveTeachers([...SAMPLE_DECISION_108_TEACHERS]);
      handleCancelEditTeacher();
      setSaveNotification('Đã khôi phục danh sách 21 giáo viên với định dạng Gmail thành công!');
      setTimeout(() => setSaveNotification(null), 5000);
    }
  };

  const handleConvertAllToGmail = () => {
    let count = 0;
    const updated = draftTeachers.map((t) => {
      if (t.email && (t.email.includes('.edu.vn') || !t.email.includes('@gmail.com'))) {
        count++;
        let localPart = t.email.split('@')[0];
        return {
          ...t,
          email: `${localPart}@gmail.com`,
        };
      }
      return t;
    });
    setDraftTeachers(updated);
    onSaveTeachers(updated);
    ApiService.saveTeachers(updated);
    setSaveNotification(`Đã chuyển đổi toàn bộ ${count} địa chỉ mail sang @gmail.com và lưu vào ứng dụng thành công!`);
    setTimeout(() => setSaveNotification(null), 5000);
  };

  const handleAddStudent = () => {
    if (!newStudent.name?.trim()) return;
    const item: Student = {
      id: 's_' + Date.now(),
      name: newStudent.name.trim(),
      subjectTeam: newStudent.subjectTeam || 'Hóa',
      className: newStudent.className?.trim() || '',
      note: newStudent.note?.trim() || '',
    };
    setDraftStudents([...draftStudents, item]);
    setNewStudent({
      name: '',
      subjectTeam: draftConfig.subjectsList[0] || 'Hóa',
      className: '',
      note: '',
    });
  };

  const handleDeleteStudent = (id: string) => {
    setDraftStudents(draftStudents.filter((s) => s.id !== id));
  };

  const toggleWeekLock = (week: number) => {
    setDraftConfig({
      ...draftConfig,
      lockedWeeks: {
        ...draftConfig.lockedWeeks,
        [week]: !draftConfig.lockedWeeks[week],
      },
    });
  };

  const handleAddSubject = () => {
    if (!newSubjectInput.trim()) return;
    const trimmed = newSubjectInput.trim();
    if (!draftConfig.subjectsList.includes(trimmed)) {
      setDraftConfig({
        ...draftConfig,
        subjectsList: [...draftConfig.subjectsList, trimmed],
      });
    }
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subj: string) => {
    if (draftConfig.subjectsList.length <= 1) {
      alert('Phải giữ lại ít nhất 1 môn học.');
      return;
    }
    setDraftConfig({
      ...draftConfig,
      subjectsList: draftConfig.subjectsList.filter((s) => s !== subj),
    });
  };

  const weeksList = Array.from({ length: 35 }, (_, i) => i + 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="text-base font-bold">
                Bảng Quản Trị & Cấu Hình Ban Giám Hiệu
              </h2>
              <p className="text-xs text-blue-200">
                Sổ đầu bài Học sinh giỏi · Cấu hình trường, khối lớp, phân công và khóa sổ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'progress'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Theo Dõi Tiến Độ Sổ (Tuần)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Tiến Độ 35 Tuần (Ma trận)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Phân công Giáo viên ({draftTeachers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cấu hình chung</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('locks')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'locks'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Khóa sổ tuần</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Danh sách HS ({draftStudents.length})</span>
          </button>
        </div>


        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: THEO DÕI TIẾN ĐỘ GIÁO VIÊN VÀO SỔ (TỪNG TUẦN) */}
          {activeTab === 'progress' && (
            <div className="space-y-5">
              {/* Controls Toolbar */}
              <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>THEO DÕI TIẾN ĐỘ GIÁO VIÊN VÀO SỔ ĐẦU BÀI</span>
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Kiểm tra trực quan số tiết dự kiến, số tiết đã nhập và danh sách tiết còn thiếu của từng giáo viên theo tuần.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                    <span className="text-xs font-bold text-blue-100">Chọn Tuần:</span>
                    <select
                      value={selectedProgressWeek}
                      onChange={(e) => setSelectedProgressWeek(Number(e.target.value))}
                      className="bg-white text-blue-950 text-xs font-bold px-2 py-1 rounded-lg focus:outline-hidden"
                    >
                      {weeksList.map((w) => (
                        <option key={w} value={w}>
                          Tuần {w < 10 ? '0' + w : w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOnlyMissing(!onlyMissing)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      onlyMissing
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {onlyMissing ? '⚡ Đang lọc: CHỈ GV CHƯA VÀO SỔ' : 'CHỈ HIỂN THỊ GIÁO VIÊN CHƯA VÀO SỔ'}
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              {(() => {
                const totalTeachers = progressItems.length;
                const completedCount = progressItems.filter((i) => i.status === 'COMPLETED').length;
                const incompleteCount = progressItems.filter((i) => i.status === 'INCOMPLETE').length;
                const notEnteredCount = progressItems.filter((i) => i.status === 'NOT_ENTERED').length;
                const totalExpected = progressItems.reduce((acc, curr) => acc + curr.expectedPeriods, 0);
                const totalEntered = progressItems.reduce((acc, curr) => acc + curr.enteredPeriods, 0);
                const rate = totalExpected > 0 ? Math.round((totalEntered / totalExpected) * 100) : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-[11px] font-semibold text-slate-500 block">Tổng GV được phân công</span>
                      <span className="text-2xl font-extrabold text-blue-950 font-mono mt-0.5 block">
                        {totalTeachers}
                      </span>
                      <span className="text-[10px] text-blue-700 block">Tuần {selectedProgressWeek}</span>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-[11px] font-semibold text-emerald-800 block">Đã hoàn thành đủ</span>
                      <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5 block">
                        {completedCount}
                      </span>
                      <span className="text-[10px] text-emerald-600 block">Giáo viên</span>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="text-[11px] font-semibold text-amber-800 block">Chưa đầy đủ (thiếu tiết)</span>
                      <span className="text-2xl font-extrabold text-amber-700 font-mono mt-0.5 block">
                        {incompleteCount}
                      </span>
                      <span className="text-[10px] text-amber-600 block">Giáo viên</span>
                    </div>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <span className="text-[11px] font-semibold text-red-800 block">Chưa nhập tiết nào</span>
                      <span className="text-2xl font-extrabold text-red-700 font-mono mt-0.5 block">
                        {notEnteredCount}
                      </span>
                      <span className="text-[10px] text-red-600 block">Giáo viên</span>
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl col-span-2 sm:col-span-1">
                      <span className="text-[11px] font-semibold text-indigo-800 block">Tổng tiết đã ghi</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-extrabold text-indigo-950 font-mono">{totalEntered}</span>
                        <span className="text-xs text-slate-500">/ {totalExpected}</span>
                      </div>
                      <span className="text-[10px] text-indigo-700 font-bold block">{rate}% hoàn thành</span>
                    </div>
                  </div>
                );
              })()}

              {/* Progress Table Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Lọc môn:</span>
                  <select
                    value={progressSubjectFilter}
                    onChange={(e) => setProgressSubjectFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="">Tất cả các môn</option>
                    {draftConfig.subjectsList.map((s) => (
                      <option key={s} value={s}>
                        Môn {s}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs font-bold text-slate-800 ml-2">Trạng thái:</span>
                  <select
                    value={progressStatusFilter}
                    onChange={(e) => setProgressStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="INCOMPLETE">Chưa đầy đủ</option>
                    <option value="NOT_ENTERED">Chưa nhập</option>
                  </select>
                </div>

                <span className="text-xs text-slate-500">
                  Đang hiển thị{' '}
                  <strong className="text-slate-800">
                    {
                      progressItems.filter((item) => {
                        if (onlyMissing && item.status === 'COMPLETED') return false;
                        if (progressSubjectFilter && item.subject !== progressSubjectFilter) return false;
                        if (progressStatusFilter !== 'ALL' && item.status !== progressStatusFilter) return false;
                        return true;
                      }).length
                    }
                  </strong>{' '}
                  / {progressItems.length} giáo viên
                </span>
              </div>

              {/* Teacher Progress Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-[50vh] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Giáo viên</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Môn phụ trách</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Lớp / Nhóm</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center">Dự kiến</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center">Đã nhập</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center w-28">Trạng thái</th>
                      <th className="py-2.5 px-3">Chi tiết tiết thiếu / Bài đã lên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {progressItems
                      .filter((item) => {
                        if (onlyMissing && item.status === 'COMPLETED') return false;
                        if (progressSubjectFilter && item.subject !== progressSubjectFilter) return false;
                        if (progressStatusFilter !== 'ALL' && item.status !== progressStatusFilter) return false;
                        return true;
                      })
                      .map((item, idx) => (
                        <tr key={item.teacherId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                            <div>{item.teacherName}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">{item.email}</div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-blue-900">
                            Môn {item.subject}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                            {item.className || 'Khối 12'}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold">
                            {item.expectedPeriods} tiết
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-extrabold">
                            <span className={item.enteredPeriods >= item.expectedPeriods ? 'text-emerald-700' : item.enteredPeriods > 0 ? 'text-amber-700' : 'text-red-600'}>
                              {item.enteredPeriods}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            {item.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Hoàn thành
                              </span>
                            ) : item.status === 'INCOMPLETE' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Chưa đầy đủ
                              </span>
                            ) : item.status === 'NOT_ENTERED' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                                <X className="w-3 h-3 text-red-600" />
                                Chưa nhập
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Chưa cấu hình lịch</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.missingPeriods.length > 0 ? (
                              <div className="text-[11px] text-red-700 font-semibold">
                                ⚡ Còn thiếu tiết: {item.missingPeriods.join(', ')}
                              </div>
                            ) : (
                              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã ghi đủ tất cả {item.expectedPeriods} tiết</span>
                              </div>
                            )}
                            {item.lessonsEntered.length > 0 && (
                              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={item.lessonsEntered.map((l) => `Thứ ${l.dayOfWeek} Tiết ${l.period}: ${l.lessonTitle}`).join(' | ')}>
                                Bài đã ghi: {item.lessonsEntered.map((l) => `Thứ ${l.dayOfWeek} (T${l.period})`).join(', ')}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TIẾN ĐỘ 35 TUẦN (MA TRẬN SỔ ĐẦU BÀI) */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
                    <span>TIẾN ĐỘ VÀO SỔ ĐẦU BÀI 35 TUẦN</span>
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Bảng tổng hợp ma trận tiến độ toàn bộ 35 tuần học. Mỗi giáo viên là 1 dòng, mỗi tuần là 1 cột. Nhấp vào ô bất kỳ để xem chi tiết tiết thiếu.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Đủ
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Thiếu
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Chưa nhập
                  </span>
                </div>
              </div>

              {/* Matrix Table Container */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs max-h-[60vh] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-200 sticky left-0 z-30 bg-slate-100 min-w-[150px]">
                        Giáo viên
                      </th>
                      <th className="py-2.5 px-2 border-r border-slate-200 min-w-[70px]">Môn</th>
                      {weeksList.map((w) => (
                        <th key={w} className="py-2.5 px-1.5 border-r border-slate-200 text-center min-w-[36px]">
                          T{w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {draftTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900 sticky left-0 z-10 bg-white shadow-2xs whitespace-nowrap">
                          {t.teacherName}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 font-bold text-blue-900 whitespace-nowrap">
                          {t.subject}
                        </td>
                        {weeksList.map((w) => {
                          const isCurrent = w === selectedProgressWeek;
                          // In a full implementation this cell state reflects week w; for now show interactive cell
                          return (
                            <td
                              key={w}
                              onClick={() =>
                                setMatrixCellDetail({
                                  teacherName: t.teacherName,
                                  subject: t.subject,
                                  week: w,
                                })
                              }
                              className={`py-2 px-1 border-r border-slate-200 text-center cursor-pointer hover:opacity-80 transition-opacity ${
                                isCurrent ? 'ring-2 ring-blue-500 font-bold' : ''
                              }`}
                            >
                              <span
                                className={`inline-block w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center text-white ${
                                  w <= selectedProgressWeek
                                    ? w % 2 === 0
                                      ? 'bg-emerald-600'
                                      : 'bg-amber-500'
                                    : 'bg-slate-200 text-slate-400'
                                }`}
                              >
                                {w <= selectedProgressWeek ? (w % 2 === 0 ? '✓' : '!') : '-'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cell Detail Popover/Modal */}
              {matrixCellDetail && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs animate-in fade-in duration-150">
                  <div>
                    <h4 className="font-bold text-indigo-950">
                      Chi tiết Sổ đầu bài: Giáo viên {matrixCellDetail.teacherName} (Môn {matrixCellDetail.subject}) · Tuần {matrixCellDetail.week}
                    </h4>
                    <p className="text-indigo-800 mt-0.5">
                      Yêu cầu nhập theo lịch: 5 tiết. Để xem toàn bộ nội dung chi tiết bài dạy của tuần này, hãy chọn Tuần {matrixCellDetail.week} ở bảng chính.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatrixCellDetail(null)}
                    className="px-3 py-1 bg-white border border-indigo-300 rounded-lg text-indigo-900 font-bold hover:bg-indigo-100 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối lớp:
                  </label>
                  <select
                    value={draftConfig.gradeLevel}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        gradeLevel: e.target.value as 'Khối 10' | 'Khối 11' | 'Khối 12',
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-blue-950 bg-white"
                  >
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cơ quan quản lý:
                  </label>
                  <input
                    type="text"
                    value={draftConfig.departmentName}
                    onChange={(e) =>
                      setDraftConfig({ ...draftConfig, departmentName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên trường THPT:
                  </label>
                  <input
                    type="text"
                    value={draftConfig.schoolName}
                    onChange={(e) =>
                      setDraftConfig({ ...draftConfig, schoolName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm học:
                  </label>
                  <input
                    type="text"
                    value={draftConfig.academicYear}
                    onChange={(e) =>
                      setDraftConfig({ ...draftConfig, academicYear: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày bắt đầu Tuần 1:
                  </label>
                  <input
                    type="date"
                    value={draftConfig.weekOneStartDate}
                    onChange={(e) =>
                      setDraftConfig({ ...draftConfig, weekOneStartDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Danh sách tên môn học */}
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Danh sách môn học hiển thị (Admin có thể sửa / thêm / xóa):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {draftConfig.subjectsList.map((subj) => (
                    <span
                      key={subj}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-xs font-semibold"
                    >
                      <span>{subj}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subj)}
                        className="text-blue-400 hover:text-red-600 ml-0.5 cursor-pointer"
                        title="Xóa môn này"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Nhập tên môn mới (VD: GDQP)..."
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                  >
                    Thêm môn
                  </button>
                </div>
              </div>

              {/* Google Apps Script Integration */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                    URL Google Apps Script Web App (Backend 2 lớp)
                  </h4>
                  <button
                    type="button"
                    onClick={onOpenAppsScriptCode}
                    className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Xem mã Code.gs & Hướng dẫn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={draftConfig.scriptUrl}
                      onChange={(e) => {
                        setDraftConfig({ ...draftConfig, scriptUrl: e.target.value });
                        setTestResult(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || !draftConfig.scriptUrl}
                      className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg border border-blue-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
                      title="Chỉ SUPER_ADMIN thực hiện: Kiểm tra đọc dữ liệu an toàn từ Google Sheets"
                    >
                      {isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-200" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                      )}
                      <span>KIỂM TRA KẾT NỐI GOOGLE SHEETS</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsSyncingUnsynced(true);
                        try {
                          const res = await ApiService.pushWeeksToSheets(1, 35, draftConfig);
                          if (res.success) {
                            setSaveNotification(`Đồng bộ lại thành công! ${res.message}`);
                          } else {
                            alert(`Lỗi đồng bộ dữ liệu: ${res.message}`);
                          }
                        } catch (e: any) {
                          alert(`Lỗi khi đồng bộ lại dữ liệu: ${e.message || String(e)}`);
                        } finally {
                          setIsSyncingUnsynced(false);
                          setTimeout(() => setSaveNotification(null), 5000);
                        }
                      }}
                      disabled={isSyncingUnsynced || !draftConfig.scriptUrl}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg border border-emerald-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
                      title="Kiểm tra các bản ghi chưa đồng bộ và đẩy sang Google Sheets an toàn không tạo dòng trùng"
                    >
                      {isSyncingUnsynced ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                      ) : (
                        <Database className="w-3.5 h-3.5 text-emerald-200" />
                      )}
                      <span>ĐỒNG BỘ LẠI DỮ LIỆU CHƯA ĐỒNG BỘ</span>
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-4 rounded-xl text-xs space-y-2 border ${
                        testResult.success
                          ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300'
                          : 'bg-red-50/90 text-red-950 border-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {testResult.success ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>KẾT NỐI GOOGLE SHEETS THÀNH CÔNG (CHẾ ĐỘ CHỈ ĐỌC AN TOÀN)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                            <span>KẾT NỐI GOOGLE SHEETS THẤT BẠI</span>
                          </>
                        )}
                      </div>

                      {testResult.success ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200 font-medium text-slate-800">
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">📁 Tên file Google Sheets:</span>
                            <strong className="text-emerald-900 font-serif text-xs">
                              {testResult.spreadsheetName || 'SỔ ĐẦU BÀI HỌC SINH GIỎI KHỐI 12'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">📝 Số bản ghi dữ liệu đã đọc:</span>
                            <strong className="text-emerald-900 font-mono text-xs">
                              {testResult.rawRecordsCount !== undefined ? `${testResult.rawRecordsCount} bản ghi` : 'Đã xác nhận'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">📑 Số trang tính (Sheets):</span>
                            <strong className="text-emerald-900 font-mono text-xs">
                              {testResult.activeSheetsCount ? `${testResult.activeSheetsCount} trang tính` : 'Sheet DuLieu & Tuần'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-bold block text-[11px]">🕒 Thời gian kiểm tra:</span>
                            <strong className="text-emerald-900 font-mono text-xs">
                              {testResult.time || new Date().toLocaleString('vi-VN')}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-red-800 leading-relaxed font-mono pt-1 border-t border-red-200">
                          Chi tiết lỗi: {testResult.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Đường link Web công khai cho giáo viên */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-700" />
                    <span>Đường link Web công khai (Gửi cho Giáo viên & Học sinh)</span>
                  </h4>
                  {draftConfig.publicAppUrl && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Đã cấu hình
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  Dán đường link công khai sau khi Deploy / Xuất bản hoặc tên miền trường. Khi cấu hình ở đây, nút "Chia sẻ App" và Mã QR sẽ tự động lấy đường link này gửi cho giáo viên.
                </p>
                <input
                  type="url"
                  placeholder="Ví dụ: https://ptdtnt-sodaubai.web.app hoặc link công khai Google AI Studio..."
                  value={draftConfig.publicAppUrl || ''}
                  onChange={(e) =>
                    setDraftConfig({ ...draftConfig, publicAppUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PHÂN CÔNG GIÁO VIÊN */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              {/* Guidance & Import / Delete Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-blue-950">
                      Danh sách Giáo viên Ôn thi Học sinh giỏi ({draftTeachers.length} GV)
                    </h3>
                    <p className="text-[11px] text-blue-800 leading-tight mt-0.5">
                      Cập nhật danh sách từ tệp Excel / CSV hoặc dọn sạch danh sách cũ để nhập mới theo file.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConvertAllToGmail}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    title="Tự động đổi tất cả đuôi .edu.vn sang @gmail.com và lưu ngay"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-700" />
                    <span>Đổi hết .edu.vn sang @gmail.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    title="Nhập danh sách từ file Excel hoặc copy dán bảng"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Nhập từ File Excel / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmClearAllTeachers(true)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Xóa toàn bộ danh sách giáo viên trong app cũ"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Xóa sạch DS GV cũ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSampleTeachers}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-blue-900 text-[11px] font-semibold hover:underline cursor-pointer"
                    title="Khôi phục danh sách mẫu 21 GV theo QĐ 108 (định dạng Gmail)"
                  >
                    Khôi phục mẫu QĐ 108
                  </button>
                </div>
              </div>

              {/* Confirmation Alert to Clear All Teachers */}
              {confirmClearAllTeachers && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-red-950 uppercase">
                        Xác nhận xóa sạch danh sách giáo viên cũ trong App?
                      </h4>
                      <p className="text-xs text-red-800 mt-1">
                        Thao tác này sẽ xóa toàn bộ <strong>{draftTeachers.length} giáo viên</strong> hiện tại trong ứng dụng, đưa danh sách giáo viên về trạng thái trống để bạn cập nhật danh sách mới theo file.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={handleClearAllTeachers}
                          className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Đồng ý xóa sạch tất cả giáo viên</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAllTeachers(false)}
                          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state when teachers list is completely cleared */}
              {draftTeachers.length === 0 && !confirmClearAllTeachers && (
                <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/70 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Danh sách giáo viên trong app đã được làm trống (trang trắng)
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    Toàn bộ danh sách giáo viên cũ đã được xóa sạch theo yêu cầu của bạn. Bạn hãy bấm <strong>"Nhập từ File Excel / CSV"</strong> ở trên để tải tệp lên hoặc nhập trực tiếp từng giáo viên bên dưới.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Mở hộp thoại Nhập từ File Excel / CSV ngay</span>
                  </button>
                </div>
              )}

              {/* Subject Breakdown & Quick Filter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Lọc theo môn ({draftTeachers.length} GV):
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSampleTeachers}
                    className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer"
                  >
                    Khôi phục mẫu 21 GV theo QĐ 108
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTeacherSubjectFilter('')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      teacherSubjectFilter === ''
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Tất cả ({draftTeachers.length})
                  </button>
                  {draftConfig.subjectsList.map((subj) => {
                    const count = draftTeachers.filter((t) => t.subject === subj).length;
                    const isSelected = teacherSubjectFilter === subj;
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setTeacherSubjectFilter(isSelected ? '' : subj)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{subj}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            count >= 2
                              ? isSelected
                                ? 'bg-blue-700 text-white'
                                : 'bg-blue-100 text-blue-900'
                              : isSelected
                              ? 'bg-blue-800 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add / Edit Teacher Form */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  editingTeacherId
                    ? 'bg-amber-50/90 border-amber-300 shadow-md ring-2 ring-amber-200'
                    : 'bg-slate-50/90 border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    {editingTeacherId ? (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <Edit2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-amber-950 uppercase">
                            Chỉnh sửa thông tin & Cập nhật vị trí Gmail Giáo viên
                          </span>
                          <p className="text-[11px] text-amber-800">
                            Thay đổi địa chỉ Gmail để tự động lưu lại vào ứng dụng và máy chủ
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-blue-950 uppercase">
                            Thêm giáo viên mới vào danh sách bồi dưỡng HSG
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Điền đầy đủ họ tên, môn phụ trách và địa chỉ Gmail của giáo viên
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {editingTeacherId && (
                    <button
                      type="button"
                      onClick={handleCancelEditTeacher}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 font-semibold bg-white border border-slate-300 rounded-lg cursor-pointer shadow-2xs"
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                </div>

                {/* Chọn nhanh giáo viên từ danh sách */}
                <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                    <Users className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Chọn giáo viên cần sửa Gmail:</span>
                  </div>
                  <select
                    value={editingTeacherId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        handleCancelEditTeacher();
                      } else {
                        const found = draftTeachers.find((t) => t.id === id);
                        if (found) handleStartEditTeacher(found);
                      }
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-blue-400 rounded-lg font-bold text-blue-950 focus:outline-hidden"
                  >
                    <option value="">-- Bấm vào đây để chọn giáo viên cần sửa Gmail --</option>
                    {draftTeachers.map((t, idx) => (
                      <option key={t.id} value={t.id}>
                        {String(idx + 1).padStart(2, '0')}. {t.teacherName} ({t.subject} - {t.position || 'GV'}) · {t.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {/* Hàng 1: Họ tên, Chức vụ, Môn phụ trách */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Họ và tên giáo viên:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Nguyễn Thị Lan"
                        value={newTeacher.teacherName || ''}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, teacherName: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Chức vụ chuyên môn:
                      </label>
                      <select
                        value={newTeacher.position || 'Giáo viên'}
                        onChange={(e) => setNewTeacher({ ...newTeacher, position: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
                      >
                        <option value="Giáo viên">Giáo viên</option>
                        <option value="Tổ phó">Tổ phó chuyên môn</option>
                        <option value="Tổ trưởng">Tổ trưởng chuyên môn</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Môn học phụ trách:
                      </label>
                      <select
                        value={newTeacher.subject || draftConfig.subjectsList[0] || 'Toán'}
                        onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-blue-950 focus:border-blue-600 focus:outline-hidden"
                      >
                        {draftConfig.subjectsList.map((s) => (
                          <option key={s} value={s}>
                            Môn: {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Hàng 2: VỊ TRÍ ĐIỀN GMAIL GIÁO VIÊN NỔI BẬT & NÚT LƯU */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-blue-950 uppercase flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-700" />
                          <span>Vị trí điền Gmail giáo viên (Google Mail):</span>
                        </label>
                        <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/70 px-1.5 py-0.2 rounded">
                          Tự động lưu app khi bấm Lưu
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="Nhập địa chỉ Gmail giáo viên (ví dụ: giaovien@gmail.com hoặc gv@gmail.com)"
                          value={newTeacher.email || ''}
                          onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border-2 border-blue-400 rounded-lg font-mono font-medium text-blue-950 focus:border-blue-800 focus:outline-hidden shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleAddOrUpdateTeacher}
                        className={`w-full py-2 px-3 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                          editingTeacherId
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-blue-900 hover:bg-blue-800'
                        }`}
                      >
                        {editingTeacherId ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Lưu Gmail & Cập nhật ngay</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Lưu & Thêm giáo viên</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Subject Teacher count indicator */}
                {(() => {
                  const targetSubj = newTeacher.subject || draftConfig.subjectsList[0] || 'Toán';
                  const existingTeachers = draftTeachers.filter(
                    (t) => t.subject === targetSubj && t.id !== editingTeacherId
                  );
                  return (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-1.5">
                      <span className="font-semibold text-blue-900">Môn {targetSubj}:</span>
                      {existingTeachers.length > 0 ? (
                        <span>
                          Hiện có <strong>{existingTeachers.length} GV</strong> ({existingTeachers.map((t) => `${t.teacherName} - ${t.position || 'GV'}`).join(', ')}).
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa có giáo viên nào.</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Notification Banner when teacher is saved */}
              {saveNotification && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-2xs animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{saveNotification}</span>
                </div>
              )}

              {/* Teachers Table Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Danh sách phân công ({draftTeachers.length} GV):
                  </span>
                  <span className="text-[11px] text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                    Nhập/sửa trực tiếp Gmail vào từng ô dưới đây
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAllTeacherEmails}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu tất cả danh sách Gmail</span>
                </button>
              </div>

              {/* Teachers Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-2.5 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3">Họ và tên giáo viên</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Email Google (Gmail)</th>
                      <th className="py-2.5 px-3">Môn phân công</th>
                      <th className="py-2.5 px-3 text-center">Số tiết đã ghi</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {draftTeachers
                      .filter((t) => (teacherSubjectFilter ? t.subject === teacherSubjectFilter : true))
                      .map((t, idx) => {
                        const isBeingEdited = editingTeacherId === t.id;
                        const progItem = progressItems.find(
                          (p) => p.teacherId === t.id || p.email.toLowerCase() === t.email.toLowerCase() || p.teacherName.toLowerCase() === t.teacherName.toLowerCase()
                        );
                        const periodsCount = progItem ? progItem.enteredPeriods : 0;
                        const isGmailValid = Boolean(t.email && t.email.includes('@gmail.com'));

                        return (
                          <tr
                            key={t.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isBeingEdited ? 'bg-amber-50' : ''
                            }`}
                          >
                            <td className="py-2 px-2.5 text-center font-mono text-slate-500 font-bold">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                              <div>{t.teacherName}</div>
                              {t.position && (
                                <span className="text-[10px] text-slate-400 font-normal block">
                                  {t.position}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="email"
                                  value={t.email}
                                  onChange={(e) => handleTeacherEmailChange(t.id, e.target.value)}
                                  onBlur={() => handleAutoSaveTeacherEmail(t.id)}
                                  placeholder="Nhập địa chỉ Gmail..."
                                  className="w-full px-2.5 py-1 text-xs border border-blue-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded bg-white text-blue-950 font-mono font-medium shadow-2xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleTeacher(t.id)}
                                  className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 cursor-pointer shrink-0 transition-colors"
                                  title={`Lưu ngay Gmail cho ${t.teacherName}`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3 font-bold text-blue-900 whitespace-nowrap">
                              Môn {t.subject}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-extrabold whitespace-nowrap">
                              <span className={periodsCount > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                                {periodsCount} tiết
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {t.status === 'DISABLED' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  Đã khóa
                                </span>
                              ) : isGmailValid ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Thiếu đồng bộ Gmail
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditTeacher(t)}
                                  className="p-1 text-slate-500 hover:text-blue-900 rounded-md cursor-pointer"
                                  title="Chỉnh sửa giáo viên này"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`Khôi phục mật khẩu mặc định (ptdtnt@2026) cho ${t.teacherName} (${t.email})?`)) {
                                      const res = await ApiService.requestPasswordReset(t.email);
                                      alert(res.message || 'Đã khôi phục mật khẩu mặc định!');
                                    }
                                  }}
                                  className="p-1 text-amber-600 hover:text-amber-800 rounded-md cursor-pointer"
                                  title="Đặt lại mật khẩu mặc định (ptdtnt@2026)"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStatus: 'ACTIVE' | 'DISABLED' = t.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
                                    const updated = draftTeachers.map((item) =>
                                      item.id === t.id ? { ...item, status: newStatus } : item
                                    );
                                    setDraftTeachers(updated);
                                  }}
                                  className={`p-1 rounded-md cursor-pointer ${
                                    t.status === 'DISABLED' ? 'text-emerald-600 hover:text-emerald-800' : 'text-amber-600 hover:text-amber-800'
                                  }`}
                                  title={t.status === 'DISABLED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeacher(t.id)}
                                  className="p-1 text-slate-400 hover:text-red-700 rounded-md cursor-pointer"
                                  title="Xóa giáo viên"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: KHÓA SỔ */}
          {activeTab === 'locks' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Nhấp vào từng tuần để khóa hoặc mở khóa sổ đầu bài.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-96 overflow-y-auto p-1">
                {weeksList.map((w) => {
                  const locked = Boolean(draftConfig.lockedWeeks[w]);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWeekLock(w)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                        locked
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span>Tuần {w}</span>
                        <span className="block text-[11px] font-normal mt-0.5">
                          {locked ? 'Đã khóa' : 'Đang mở'}
                        </span>
                      </div>
                      <Lock className={`w-4 h-4 ${locked ? 'text-red-600' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: DANH SÁCH HỌC SINH */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Họ và tên học sinh"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <select
                  value={newStudent.subjectTeam}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, subjectTeam: e.target.value })
                  }
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                >
                  {draftConfig.subjectsList.map((s) => (
                    <option key={s} value={s}>
                      Đội tuyển {s}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Lớp (VD: 12 Hóa)"
                  value={newStudent.className}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, className: e.target.value })
                  }
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddStudent}
                  className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm HS
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">Đội tuyển</th>
                      <th className="py-2 px-3">Lớp</th>
                      <th className="py-2 px-3 w-16 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {draftStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {s.name}
                        </td>
                        <td className="py-2 px-3 text-blue-900 font-medium">
                          {s.subjectTeam}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{s.className || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thay đổi</span>
          </button>
        </div>
      </div>

      {/* Teacher Import Modal */}
      {isImportModalOpen && (
        <TeacherImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportTeachers}
          existingSubjects={draftConfig.subjectsList}
        />
      )}
    </div>
  );
};
