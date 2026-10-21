import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  BookOpen,
  Calendar,
  Lock,
  Unlock,
  ArrowRight,
  Database,
  HardDrive,
  FileSpreadsheet,
  RefreshCw,
  Search,
} from 'lucide-react';
import { LogPeriodEntry, SchoolConfig } from '../types';
import { SUBJECT_LIST } from '../constants/initialData';

interface WeekOverviewItem {
  weekNumber: number;
  isLocked: boolean;
  totalSlots: number;
  filledPeriods: number;
  teachers: string[];
  subjects: string[];
  totalAbsent: number;
  hasData: boolean;
}

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  fromDateStr: string;
  toDateStr: string;
  entries: LogPeriodEntry[];
  config: SchoolConfig;
  onSelectWeek?: (weekNumber: number) => void;
  initialTab?: 'currentWeek' | 'allWeeks' | 'storageInfo';
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  fromDateStr,
  toDateStr,
  entries,
  config,
  onSelectWeek,
  initialTab = 'currentWeek',
}) => {
  const [activeTab, setActiveTab] = useState<'currentWeek' | 'allWeeks' | 'storageInfo'>(initialTab);
  const [allWeeksData, setAllWeeksData] = useState<WeekOverviewItem[]>([]);
  const [isLoadingAllWeeks, setIsLoadingAllWeeks] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch overview of all weeks when switching to allWeeks tab
  useEffect(() => {
    if (isOpen && activeTab === 'allWeeks') {
      setIsLoadingAllWeeks(true);
      fetch('/api/overview')
        .then((res) => res.json())
        .then((json) => {
          if (json && json.success && Array.isArray(json.data)) {
            setAllWeeksData(json.data);
          }
        })
        .catch((err) => console.warn('Could not fetch overview', err))
        .finally(() => setIsLoadingAllWeeks(false));
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const taughtPeriods = entries.filter((e) =>
    Boolean(e.subject || e.ppctLesson || e.lessonTitle || e.teacherSignature)
  ).length;
  const totalAbsent = entries.reduce((acc, curr) => acc + (curr.absentCount || 0), 0);
  const activeSubjects = Array.from(new Set(entries.filter((e) => e.subject).map((e) => e.subject)));
  const uniqueTeachers = Array.from(
    new Set(entries.map((e) => e.teacherSignature).filter(Boolean))
  );

  const dayNames: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ Nhật',
  };

  const dayStats = [2, 3, 4, 5, 6, 7, 8].map((d) => {
    const dEntries = entries.filter((e) => Number(e.dayOfWeek) === d);
    const clusters = Array.from(new Set(dEntries.map((e) => Number(e.clusterIndex) || 1)));
    const filled = dEntries.filter((e) =>
      Boolean(e.subject || e.ppctLesson || e.lessonTitle || e.teacherSignature)
    );
    const subjs = Array.from(new Set(filled.map((e) => e.subject).filter(Boolean)));
    const tchrs = Array.from(new Set(filled.map((e) => e.teacherSignature).filter(Boolean)));
    return {
      dayNum: d,
      dayName: dayNames[d],
      clustersCount: clusters.length,
      filledCount: filled.length,
      subjects: subjs,
      teachers: tchrs,
    };
  });

  // Breakdown by subject for current week
  const subjectList = config.subjectsList && config.subjectsList.length > 0 ? config.subjectsList : SUBJECT_LIST;
  const subjectStats = subjectList
    .map((subj) => {
      const subjEntries = entries.filter((e) => e.subject === subj);
      const count = subjEntries.length;
      const absent = subjEntries.reduce((acc, curr) => acc + (curr.absentCount || 0), 0);
      const filledLessons = subjEntries.filter((e) =>
        Boolean(e.lessonTitle || e.ppctLesson || e.teacherSignature)
      ).length;
      const teacherNames = Array.from(
        new Set(subjEntries.map((e) => e.teacherSignature).filter(Boolean))
      ).join(', ');

      return {
        subject: subj,
        count,
        absent,
        filledLessons,
        teachers: teacherNames || '-',
      };
    })
    .filter((s) => s.count > 0);

  // Filtered all weeks list
  const filteredWeeks = allWeeksData.filter((w) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const matchWeek = `tuần ${w.weekNumber}`.includes(q);
    const matchTeacher = w.teachers.some((t) => t.toLowerCase().includes(q));
    const matchSubject = w.subjects.some((s) => s.toLowerCase().includes(q));
    return matchWeek || matchTeacher || matchSubject;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
              <BarChart3 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Thống Kê & Theo Dõi Tiến Độ Sổ Đầu Bài</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                  Toàn trường
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                {config.schoolName} · Năm học {config.academicYear} · {config.gradeLevel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors cursor-pointer p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('currentWeek')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'currentWeek'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>Chi tiết Tuần {currentWeek}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('allWeeks')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'allWeeks'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-700" />
            <span>Tiến độ nhập của Giáo viên (Tất cả 35 tuần)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storageInfo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'storageInfo'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Dữ liệu lưu ở đâu?</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: CURRENT WEEK DETAIL */}
          {activeTab === 'currentWeek' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-slate-500 text-xs block">Tiết đã lên bài</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-blue-950 font-mono">
                      {taughtPeriods}
                    </span>
                    <span className="text-xs text-slate-500">tiết</span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">
                    {entries.length > 0
                      ? `${Math.round((taughtPeriods / entries.length) * 100)}% hoàn thành`
                      : '0%'}
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-slate-500 text-xs block">Tổng lượt HS vắng</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-amber-950 font-mono">
                      {totalAbsent}
                    </span>
                    <span className="text-xs text-slate-500">lượt</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                    Trong Tuần {currentWeek}
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-slate-500 text-xs block">Môn học đã dạy</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-emerald-950 font-mono">
                      {activeSubjects.length}
                    </span>
                    <span className="text-xs text-slate-500">môn</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                    {activeSubjects.slice(0, 3).join(', ') || 'Chưa có môn'}
                  </span>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-slate-500 text-xs block">Giáo viên đã ký sổ</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-indigo-950 font-mono">
                      {uniqueTeachers.length}
                    </span>
                    <span className="text-xs text-slate-500">thầy cô</span>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-semibold block mt-0.5">
                    Đã ký duyệt tiết
                  </span>
                </div>
              </div>

              {/* Day-by-Day Inspection (Thứ 2 đến Chủ Nhật) */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <span>Tiến độ nhập theo từng ngày trong Tuần {currentWeek} (Thứ 2 - Chủ Nhật):</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  {dayStats.map((ds) => {
                    const isSat = ds.dayNum === 7;
                    const isSun = ds.dayNum === 8;
                    return (
                      <div
                        key={ds.dayNum}
                        className={`p-3 rounded-xl border transition-all ${
                          isSun
                            ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                            : isSat
                            ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold ${isSun ? 'text-rose-950 font-sans' : isSat ? 'text-amber-950 font-sans' : 'text-slate-900'}`}>
                            {ds.dayName}
                          </span>
                          {isSun ? (
                            <span className="text-[9px] bg-rose-200 text-rose-900 font-bold px-1 rounded">
                              Chủ Nhật
                            </span>
                          ) : isSat ? (
                            <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1 rounded">
                              Thứ 7
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1.5">
                          <div className="text-base font-bold text-blue-950 font-mono">
                            {ds.filledCount} <span className="text-xs text-slate-500 font-sans font-normal">tiết</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {ds.clustersCount} cụm môn
                          </div>
                        </div>

                        {ds.subjects.length > 0 ? (
                          <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-1">
                            <div className="text-[10px] font-semibold text-blue-900 line-clamp-1" title={ds.subjects.join(', ')}>
                              {ds.subjects.join(', ')}
                            </div>
                            <div className="text-[10px] text-slate-600 line-clamp-1 italic" title={ds.teachers.join(', ')}>
                              GV: {ds.teachers.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 pt-2 border-t border-slate-200/80 text-[10px] text-slate-400 italic">
                            Chưa có tiết
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>Chi tiết các bộ môn trong Tuần {currentWeek}:</span>
                </h3>
                {subjectStats.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                    Tuần {currentWeek} chưa có tiết dạy nào được nhập. Giáo viên có thể bấm nút <strong>"+ Ghi sổ nhanh"</strong> để lên bài.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 border-r border-slate-200">Môn học</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center">Tổng số tiết</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center">Tiết đã lên bài</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center">HS vắng</th>
                          <th className="py-2.5 px-3">Giáo viên đã ký tên</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {subjectStats.map((st) => (
                          <tr key={st.subject} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-blue-950">
                              Môn {st.subject}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-semibold">
                              {st.count}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-emerald-700 font-bold">
                              {st.filledLessons} / {st.count}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-amber-700 font-semibold">
                              {st.absent}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-semibold">
                              {st.teachers}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ALL WEEKS MONITORING */}
          {activeTab === 'allWeeks' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Tiến độ nhập sổ đầu bài của giáo viên (Tuần 1 đến Tuần 35)
                  </h3>
                  <p className="text-xs text-slate-500">
                    BGH có thể kiểm tra xem tuần nào giáo viên đã nhập bài, môn nào đã ký và mở nhanh tuần đó
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tuần, môn, tên giáo viên..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {isLoadingAllWeeks ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-700 mb-2" />
                  <span>Đang tổng hợp dữ liệu toàn bộ các tuần từ máy chủ...</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-24">Tuần</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-center w-28">Trạng thái</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-center w-28">Tiết đã nhập</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Môn học đã dạy</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Giáo viên đã ký tên</th>
                        <th className="py-2.5 px-3 text-center w-28">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredWeeks.map((wk) => (
                        <tr
                          key={wk.weekNumber}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            wk.weekNumber === currentWeek ? 'bg-blue-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-blue-950 whitespace-nowrap">
                            <span>Tuần {wk.weekNumber < 10 ? '0' + wk.weekNumber : wk.weekNumber}</span>
                            {wk.weekNumber === currentWeek && (
                              <span className="ml-1 text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-bold">
                                Đang chọn
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            {wk.isLocked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" />
                                Đã khóa sổ
                              </span>
                            ) : wk.filledPeriods > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Đang ghi chép
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Chưa có tiết
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono">
                            {wk.filledPeriods > 0 ? (
                              <strong className="text-blue-950 font-bold">{wk.filledPeriods} tiết</strong>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">
                            {wk.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {wk.subjects.map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] text-slate-800">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 italic">(Trống)</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800">
                            {wk.teachers.length > 0 ? (
                              <span className="font-semibold text-blue-900">
                                {wk.teachers.join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">(Chưa ai ký)</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectWeek) {
                                  onSelectWeek(wk.weekNumber);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <span>Vào xem</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WHERE IS DATA STORED? */}
          {activeTab === 'storageInfo' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-700" />
                  <span>Cơ chế lưu trữ dữ liệu Sổ đầu bài điện tử:</span>
                </h3>
                <p className="text-slate-600">
                  Hệ thống được thiết kế theo mô hình đa tầng (Multi-tier Storage) để đảm bảo dữ liệu không bao giờ bị mất và mọi giáo viên, Ban Giám hiệu đều nhìn thấy dữ liệu đồng nhất.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Máy chủ Server */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase">
                    <HardDrive className="w-4 h-4 text-blue-700" />
                    <span>1. Máy chủ trung tâm (Server Backend)</span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Nơi lưu:</strong> Thư mục <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-900">data/weeks/</code> trên máy chủ ứng dụng.
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Mỗi tuần là một tệp JSON độc lập (<code className="font-mono">week_1.json</code>, <code className="font-mono">week_5.json</code>...). Khi bất kỳ giáo viên nào nhập tiết PPCT từ điện thoại, dữ liệu sẽ được gửi thẳng lên máy chủ này. Nhờ đó Admin ngồi ở máy tính mở app là nhìn thấy ngay lập tức.
                  </p>
                </div>

                {/* 2. Trình duyệt LocalStorage */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase">
                    <Database className="w-4 h-4 text-indigo-700" />
                    <span>2. Bộ nhớ đệm Trình duyệt (LocalStorage)</span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Nơi lưu:</strong> Bộ nhớ trình duyệt Chrome, Safari, Cốc Cốc trên máy của bạn.
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Lưu trữ các bản sao (<code className="font-mono">sdb_week_5</code>, <code className="font-mono">sdb_config</code>). Giúp bạn mở app là nội dung hiện ra ngay trong 0.1 giây mà không phải chờ tải qua mạng, đồng thời hỗ trợ xem khi mạng chập chờn.
                  </p>
                </div>

                {/* 3. Google Sheets */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>3. Google Spreadsheet (Google Trang tính)</span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Nơi lưu:</strong> File Google Sheets trên tài khoản Google Drive của BGH (khi bật Code.gs).
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Mỗi khi giáo viên lưu hoặc ký tên, hệ thống tự động đẩy dữ liệu sang Google Sheet của trường. BGH có thể mở Google Drive xem hoặc chia sẻ bảng tính trực tiếp cho cấp trên.
                  </p>
                </div>

                {/* 4. Xuất file Excel */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                    <Award className="w-4 h-4 text-amber-700" />
                    <span>4. Tải file Excel lưu máy tính</span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Nơi lưu:</strong> Thư mục Downloads trên máy tính cá nhân của thầy/cô.
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Bấm <strong>"Xuất Excel (tuần này)"</strong> hoặc <strong>"Xuất Excel (cả học kỳ)"</strong> để tải toàn bộ dữ liệu 18 tuần chuẩn mẫu in đóng sổ lưu trữ cuối kỳ.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 shrink-0">
          <span className="text-[11px] text-slate-500">
            Dữ liệu được bảo toàn tự động và đồng bộ trực tuyến giữa tất cả thiết bị
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
