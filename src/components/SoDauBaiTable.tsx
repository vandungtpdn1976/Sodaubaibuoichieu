import React, { useState } from 'react';
import {
  Save,
  Edit2,
  Trash2,
  Plus,
  Zap,
  Sparkles,
  UserX,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  Calendar,
  Mail,
} from 'lucide-react';
import {
  LogPeriodEntry,
  SchoolConfig,
  TeacherAssignment,
  CurrentUser,
} from '../types';
import { checkIsAdmin } from '../constants/initialData';
import { getDateForDayOfWeek } from '../utils/dateUtils';

interface SoDauBaiTableProps {
  entries: LogPeriodEntry[];
  currentWeek: number;
  fromDateStr: string;
  toDateStr: string;
  config: SchoolConfig;
  isLocked: boolean;
  currentUser: CurrentUser;
  teachers: TeacherAssignment[];
  onSaveEntry: (entry: LogPeriodEntry) => Promise<void>;
  onDeleteCluster: (dayOfWeek: number, clusterIndex: number) => Promise<void>;
  onAddCluster: (dayOfWeek: number) => void;
  onOpenQuickEntryForDay: (dayOfWeek: number) => void;
  onOpenAbsentModal: (entry: LogPeriodEntry) => void;
  filteredEntries: LogPeriodEntry[];
}

export const SoDauBaiTable: React.FC<SoDauBaiTableProps> = ({
  entries,
  currentWeek,
  fromDateStr,
  toDateStr,
  config,
  isLocked,
  currentUser,
  teachers,
  onSaveEntry,
  onDeleteCluster,
  onAddCluster,
  onOpenQuickEntryForDay,
  onOpenAbsentModal,
  filteredEntries,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftEntry, setDraftEntry] = useState<LogPeriodEntry | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Modals for clear and re-entry confirmation
  const [confirmClearEntry, setConfirmClearEntry] = useState<LogPeriodEntry | null>(null);
  const [confirmClusterAction, setConfirmClusterAction] = useState<{ dayOfWeek: number; clusterIndex: number } | null>(null);
  const [isClearingBatch, setIsClearingBatch] = useState(false);

  const dayNames: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ Nhật',
  };

  const days = [2, 3, 4, 5, 6, 7, 8];
  const [selectedDayTab, setSelectedDayTab] = useState<'all' | number>('all');

  const canEditEntry = (_entry: LogPeriodEntry): boolean => {
    // Admin always has full editing & clearing rights
    if (currentUser.role === 'admin' || checkIsAdmin(currentUser.email)) return true;
    // If the week is locked by the Vice Principal, editing is frozen
    if (isLocked) return false;
    // When the week is open, allow any teacher to edit or clear so that
    // accidental entries (e.g. wrong teacher or wrong subject) can be deleted and re-entered
    return true;
  };

  const handleStartEdit = (entry: LogPeriodEntry) => {
    if (!canEditEntry(entry)) return;
    setEditingId(entry.id);
    setDraftEntry({ ...entry });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftEntry(null);
  };

  const handleSaveDraft = async () => {
    if (!draftEntry) return;
    setSavingId(draftEntry.id);
    try {
      await onSaveEntry(draftEntry);
      setEditingId(null);
      setDraftEntry(null);
    } finally {
      setSavingId(null);
    }
  };

  const handleSubjectChange = (subj: string) => {
    if (!draftEntry) return;
    const matchedTeachers = teachers.filter((t) => t.subject === subj);
    const loggedInTeacher = matchedTeachers.find(
      (t) => t.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const teacher = loggedInTeacher || matchedTeachers[0];
    const signature = teacher ? teacher.teacherName : (currentUser.name || '');
    const email = teacher ? teacher.email : (currentUser.email || '');

    setDraftEntry({
      ...draftEntry,
      subject: subj,
      teacherSignature: signature,
      teacherEmail: email,
    });
  };

  // Clear single entry and optionally re-open for editing immediately
  const handleConfirmClearRow = async (reopenForEdit: boolean) => {
    if (!confirmClearEntry) return;
    const target = confirmClearEntry;
    setConfirmClearEntry(null);
    setSavingId(target.id);

    const cleared: LogPeriodEntry = {
      ...target,
      subject: '',
      ppctLesson: '',
      absentCount: 0,
      absentStudents: '',
      lessonTitle: '',
      teacherSignature: '',
      teacherEmail: '',
      updatedAt: new Date().toLocaleString('vi-VN'),
    };

    try {
      await onSaveEntry(cleared);
      if (reopenForEdit) {
        setEditingId(cleared.id);
        setDraftEntry({ ...cleared });
      }
    } finally {
      setSavingId(null);
    }
  };

  // Clear all 5 periods of a cluster to empty rows (keep cluster intact for re-entry)
  const handleClearClusterContent = async (dayOfWeek: number, clusterIndex: number) => {
    setConfirmClusterAction(null);
    setIsClearingBatch(true);
    try {
      const clusterRows = entries.filter(
        (e) =>
          Number(e.dayOfWeek) === Number(dayOfWeek) &&
          (Number(e.clusterIndex) || 1) === Number(clusterIndex)
      );
      for (const row of clusterRows) {
        const cleared: LogPeriodEntry = {
          ...row,
          subject: '',
          ppctLesson: '',
          absentCount: 0,
          absentStudents: '',
          lessonTitle: '',
          teacherSignature: '',
          teacherEmail: '',
          updatedAt: new Date().toLocaleString('vi-VN'),
        };
        await onSaveEntry(cleared);
      }
    } finally {
      setIsClearingBatch(false);
    }
  };

  // Delete cluster permanently (5 rows)
  const handleDeleteClusterPermanently = async (dayOfWeek: number, clusterIndex: number) => {
    setConfirmClusterAction(null);
    await onDeleteCluster(dayOfWeek, clusterIndex);
  };

  return (
    <div className="w-full space-y-3">
      {/* Table Header Metadata: Tuần n | Khối 12 | Từ ngày ... Đến ngày ... */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-blue-950 font-serif">
            Tuần {currentWeek}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-bold">
            {config.gradeLevel}
          </span>
          <span className="text-xs text-slate-600 font-medium">
            (Từ ngày <strong className="font-mono text-slate-900">{fromDateStr}</strong> đến ngày{' '}
            <strong className="font-mono text-slate-900">{toDateStr}</strong>)
          </span>
        </div>

        <div className="text-xs text-slate-500 italic">
          * Chuẩn biểu mẫu Sổ đầu bài Học sinh giỏi: 7 cột · Mỗi cụm 5 tiết
        </div>
      </div>

      {/* Day Filter Tabs: Cho phép Quản trị viên và Giáo viên chọn xem tất cả hoặc bấm xem riêng Thứ 7 */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedDayTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedDayTab === 'all'
                ? 'bg-blue-950 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Toàn bộ Tuần {currentWeek} (Thứ 2 - Chủ Nhật)
          </button>

          {days.map((d) => {
            const dEntries = entries.filter((e) => Number(e.dayOfWeek) === d);
            const dClusters = Array.from(new Set(dEntries.map((e) => Number(e.clusterIndex) || 1)));
            const dFilled = dEntries.filter((e) => Boolean(e.subject || e.ppctLesson || e.lessonTitle || e.teacherSignature));
            const isSat = d === 7;
            const isSun = d === 8;

            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDayTab(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedDayTab === d
                    ? isSun
                      ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400'
                      : isSat
                      ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                      : 'bg-blue-900 text-white shadow-2xs'
                    : isSun
                    ? 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100'
                    : isSat
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title={`Bấm xem chi tiết các tiết dạy ${dayNames[d]}`}
              >
                <span>{dayNames[d]}</span>
                {dFilled.length > 0 ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedDayTab === d
                        ? 'bg-white/20 text-white'
                        : isSun
                        ? 'bg-rose-200 text-rose-950'
                        : isSat
                        ? 'bg-amber-200 text-amber-950'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {dClusters.length > 1 ? `${dClusters.length} cụm (${dFilled.length} tiết)` : `${dFilled.length} tiết`}
                  </span>
                ) : (
                  <span className="text-[10px] opacity-60">(0)</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDayTab !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedDayTab('all')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer ml-auto"
          >
            ← Xem lại toàn bộ các thứ
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="w-full bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px] font-paper">
            {/* Rows 2 & 3: Columns Title (Merged vertically) */}
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-400">
                <th className="py-2.5 px-2 border-r border-slate-300 w-28">
                  Thứ, ngày/tháng
                </th>
                <th className="py-2.5 px-1 border-r border-slate-300 w-12">
                  Tiết
                </th>
                <th className="py-2.5 px-2 border-r border-slate-300 w-28">
                  Môn học
                </th>
                <th className="py-2.5 px-1 border-r border-slate-300 w-20">
                  Tiết PPCT
                </th>
                <th className="py-2.5 px-2 border-r border-slate-300 w-44">
                  Tên HS nghỉ tiết
                </th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[340px]">
                  Tên bài, nội dung công việc
                </th>
                <th className="py-2.5 px-2 border-r border-slate-300 w-36">
                  Ký tên
                </th>
                <th className="no-print py-2.5 px-2 w-24 bg-slate-300 text-slate-800 font-sans">
                  Thao tác
                </th>
              </tr>

              {/* Row 4: Column Numbering 1 to 7 */}
              <tr className="bg-slate-100 text-slate-700 font-bold text-center text-[11px] border-b-2 border-slate-400">
                <th className="py-1 px-1 border-r border-slate-300 italic">(1)</th>
                <th className="py-1 px-1 border-r border-slate-300 italic">(2)</th>
                <th className="py-1 px-1 border-r border-slate-300 italic">(3)</th>
                <th className="py-1 px-1 border-r border-slate-300 italic">(4)</th>
                <th className="py-1 px-1 border-r border-slate-300 italic">(5)</th>
                <th className="py-1 px-1 border-r border-slate-300 italic">(6)</th>
                <th className="py-1 px-1 border-r border-slate-300 italic">(7)</th>
                <th className="no-print py-1 px-1 bg-slate-200 text-slate-500 font-sans italic">
                  -
                </th>
              </tr>
            </thead>

            <tbody>
              {(selectedDayTab === 'all' ? days : [selectedDayTab]).map((dayNum) => {
                const dayEntries = entries.filter((e) => Number(e.dayOfWeek) === Number(dayNum));

                // Cluster map
                const clusterMap: Record<number, LogPeriodEntry[]> = {};
                for (const e of dayEntries) {
                  const cIdx = Number(e.clusterIndex) || 1;
                  if (!clusterMap[cIdx]) clusterMap[cIdx] = [];
                  clusterMap[cIdx].push(e);
                }

                const clusterIndices = Object.keys(clusterMap)
                  .map(Number)
                  .sort((a, b) => a - b);

                if (clusterIndices.length === 0) {
                  clusterIndices.push(1);
                }

                // Total rows for this day = total clusters * 5
                const dayTotalRows = clusterIndices.length * 5;
                const fallbackDate = getDateForDayOfWeek(
                  currentWeek,
                  config.weekOneStartDate,
                  dayNum
                ).dateStr;
                const firstEntry = dayEntries[0];
                const dateDisplay = (firstEntry && firstEntry.dateStr) ? firstEntry.dateStr : fallbackDate;

                let dayRowCounter = 0;

                return clusterIndices.map((cIdx) => {
                  const cRows = clusterMap[cIdx] || [];

                  return [1, 2, 3, 4, 5].map((pNum) => {
                    const isDayFirstRow = dayRowCounter === 0;
                    const isClusterFirstRow = pNum === 1;
                    dayRowCounter++;

                    // Find entry or create fallback
                    const entry: LogPeriodEntry = cRows.find((r) => Number(r.period) === Number(pNum)) || {
                      id: `w${currentWeek}_d${dayNum}_c${cIdx}_p${pNum}`,
                      weekNumber: currentWeek,
                      dayOfWeek: dayNum,
                      dateStr: dateDisplay,
                      clusterIndex: cIdx,
                      period: pNum,
                      subject: '',
                      ppctLesson: '',
                      absentCount: 0,
                      absentStudents: '',
                      lessonTitle: '',
                      teacherSignature: '',
                      teacherEmail: '',
                      updatedAt: '',
                    };

                    const isEditing = editingId === entry.id;
                    const active = isEditing && draftEntry ? draftEntry : entry;
                    const editable = canEditEntry(entry);
                    const isSaving = savingId === entry.id;

                    const dayBg =
                      dayNum % 2 === 0
                        ? 'bg-white hover:bg-slate-50/70'
                        : 'bg-slate-50/50 hover:bg-slate-100/60';

                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-slate-300 transition-colors ${dayBg} ${
                          isEditing
                            ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/40'
                            : ''
                        }`}
                      >
                        {/* Cột 1: Thứ, ngày/tháng (Rowspan toàn bộ các dòng của ngày) */}
                        {isDayFirstRow && (
                          <td
                            rowSpan={dayTotalRows}
                            className="py-3 px-2 border-r-2 border-slate-400 text-center font-bold text-slate-900 bg-slate-100/80 align-middle select-none"
                          >
                            <div className={`text-base font-extrabold ${dayNum === 8 ? 'text-rose-800' : 'text-blue-950'}`}>
                              {dayNames[dayNum]}
                            </div>
                            <div className="text-xs font-mono text-slate-600 mt-1 whitespace-nowrap">
                              {dateDisplay}
                            </div>
                            {clusterIndices.length > 1 && (
                              <div className="mt-2 text-[10px] text-blue-800 font-semibold bg-blue-100 px-1.5 py-0.5 rounded-md inline-block font-sans">
                                {clusterIndices.length} cụm môn
                              </div>
                            )}

                            {/* Quick batch entry button for this day */}
                            {!isLocked && (
                              <div className="no-print mt-3 flex flex-col gap-1 items-center">
                                <button
                                  type="button"
                                  onClick={() => onOpenQuickEntryForDay(dayNum)}
                                  className="w-full px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[11px] font-sans font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                  title="Mở bảng nhập nhanh các tiết cho ngày này"
                                >
                                  <Zap className="w-3 h-3 text-amber-300" />
                                  <span>Nhập nhanh</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAddCluster(dayNum)}
                                  className="w-full px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[10px] font-sans font-medium flex items-center justify-center gap-1 cursor-pointer"
                                  title="Thêm một cụm 5 tiết mới cho ngày này"
                                >
                                  <Plus className="w-3 h-3 text-emerald-600" />
                                  <span>+ Cụm môn</span>
                                </button>
                              </div>
                            )}
                          </td>
                        )}

                        {/* Cột 2: Tiết (1, 2, 3, 4, 5) */}
                        <td className="py-2.5 px-1 border-r border-slate-300 text-center font-bold text-slate-900 align-middle">
                          {pNum}
                        </td>

                        {/* Cột 3: Môn học */}
                        <td className="py-2 px-2 border-r border-slate-300 align-middle">
                          {isEditing ? (
                            <select
                              value={active.subject}
                              onChange={(e) => handleSubjectChange(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-semibold text-blue-950 focus:outline-hidden font-sans"
                            >
                              <option value="">-- Trống --</option>
                              {config.subjectsList.map((subj) => (
                                <option key={subj} value={subj}>
                                  {subj}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`font-bold ${
                                entry.subject
                                  ? 'text-blue-950'
                                  : 'text-slate-300 italic text-[11px]'
                              }`}
                            >
                              {entry.subject || '(Trống)'}
                            </span>
                          )}
                        </td>

                        {/* Cột 4: Tiết PPCT */}
                        <td className="py-2 px-1 border-r border-slate-300 text-center align-middle font-mono">
                          {isEditing ? (
                            <input
                              type="text"
                              value={active.ppctLesson}
                              placeholder="5"
                              onChange={(e) =>
                                setDraftEntry({
                                  ...draftEntry!,
                                  ppctLesson: e.target.value,
                                })
                              }
                              className="w-full text-center px-1 py-1 bg-white border border-blue-400 rounded text-xs font-sans"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {entry.ppctLesson || ''}
                            </span>
                          )}
                        </td>

                        {/* Cột 5: Tên HS nghỉ tiết */}
                        <td className="py-2 px-2 border-r border-slate-300 align-middle">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={active.absentStudents}
                                placeholder="Tên HS vắng (nếu có)..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const cnt = val.trim() ? val.split(',').filter(Boolean).length : 0;
                                  setDraftEntry({
                                    ...draftEntry!,
                                    absentStudents: val,
                                    absentCount: cnt,
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-sans"
                              />
                            </div>
                          ) : (
                            <div className="text-xs">
                              {entry.absentCount > 0 ? (
                                <span className="text-red-700 font-semibold">
                                  Vắng: {entry.absentCount}
                                  {entry.absentStudents ? ` (${entry.absentStudents})` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Cột 6: Tên bài, nội dung công việc (cột rộng nhất) */}
                        <td className="py-2 px-3 border-r border-slate-300 align-middle leading-relaxed">
                          {isEditing ? (
                            <textarea
                              rows={2}
                              value={active.lessonTitle}
                              placeholder="Nhập tên bài, nội dung giảng dạy..."
                              onChange={(e) =>
                                setDraftEntry({
                                  ...draftEntry!,
                                  lessonTitle: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-sans resize-y"
                            />
                          ) : (
                            <div className="text-slate-900 text-xs whitespace-pre-wrap">
                              {entry.lessonTitle || (
                                <span className="text-slate-300 italic">
                                  (Trống - viết tay khi dạy)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Cột 7: Ký tên */}
                        <td className="py-2 px-2 border-r border-slate-300 text-center align-middle">
                          {isEditing ? (
                            <div className="space-y-1.5 min-w-[140px]">
                              {(() => {
                                const subjectTeachers = teachers.filter((t) => t.subject === active.subject);
                                const otherTeachers = teachers.filter((t) => t.subject !== active.subject);

                                return (
                                  <>
                                    <select
                                      value={
                                        teachers.some((t) => t.teacherName === active.teacherSignature)
                                          ? active.teacherSignature
                                          : active.teacherSignature
                                          ? '__custom__'
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '__custom__') {
                                          // Keep current for typing
                                        } else if (val === '__clear__') {
                                          setDraftEntry({
                                            ...draftEntry!,
                                            teacherSignature: '',
                                            teacherEmail: '',
                                          });
                                        } else if (val) {
                                          const matched = teachers.find((t) => t.teacherName === val);
                                          setDraftEntry({
                                            ...draftEntry!,
                                            teacherSignature: val,
                                            teacherEmail: matched?.email || '',
                                          });
                                        } else {
                                          setDraftEntry({
                                            ...draftEntry!,
                                            teacherSignature: '',
                                            teacherEmail: '',
                                          });
                                        }
                                      }}
                                      className="w-full text-xs py-1 px-1.5 bg-white border border-blue-400 rounded font-semibold text-blue-950 focus:outline-hidden"
                                    >
                                      <option value="">-- Chọn GV ký --</option>
                                      {subjectTeachers.length > 0 && (
                                        <optgroup label={`GV Môn ${active.subject} (${subjectTeachers.length} GV)`}>
                                          {subjectTeachers.map((t, idx) => (
                                            <option key={t.id} value={t.teacherName}>
                                              GV {idx + 1}: {t.teacherName} · {t.email}
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                      {otherTeachers.length > 0 && (
                                        <optgroup label="Tất cả GV khác trong trường">
                                          {otherTeachers.map((t) => (
                                            <option key={t.id} value={t.teacherName}>
                                              {t.teacherName} ({t.subject}) · {t.email}
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                      <option value="__custom__">-- Tự nhập tên khác --</option>
                                      <option value="__clear__">-- Xóa trống người ký --</option>
                                    </select>

                                    <input
                                      type="text"
                                      value={active.teacherSignature}
                                      placeholder="Họ tên GV ký"
                                      onChange={(e) => {
                                        const name = e.target.value;
                                        const matched = teachers.find(
                                          (t) => t.teacherName.toLowerCase() === name.trim().toLowerCase()
                                        );
                                        setDraftEntry({
                                          ...draftEntry!,
                                          teacherSignature: name,
                                          teacherEmail: matched ? matched.email : (draftEntry?.teacherEmail || ''),
                                        });
                                      }}
                                      className="w-full text-center px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-sans font-medium"
                                    />

                                    {/* Vị trí điền Gmail giáo viên */}
                                    <div className="flex items-center gap-1 bg-blue-50/70 border border-blue-300 rounded px-1.5 py-1">
                                      <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                      <input
                                        type="email"
                                        value={active.teacherEmail || ''}
                                        placeholder="Gmail giáo viên..."
                                        title="Địa chỉ Gmail của giáo viên ký tên tiết dạy này (được lưu lại app khi bấm Lưu dòng)"
                                        onChange={(e) =>
                                          setDraftEntry({
                                            ...draftEntry!,
                                            teacherEmail: e.target.value.trim(),
                                          })
                                        }
                                        className="w-full text-center text-xs font-mono text-blue-950 placeholder:text-slate-400 focus:outline-hidden"
                                      />
                                    </div>

                                    {subjectTeachers.length > 0 && (
                                      <div className="flex flex-wrap gap-1 justify-center pt-0.5">
                                        {subjectTeachers.map((t) => (
                                          <button
                                            key={t.id}
                                            type="button"
                                            title={`Chọn ${t.teacherName} (${t.email})`}
                                            onClick={() =>
                                              setDraftEntry({
                                                ...draftEntry!,
                                                teacherSignature: t.teacherName,
                                                teacherEmail: t.email,
                                              })
                                            }
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                              active.teacherSignature === t.teacherName
                                                ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                                                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                                            }`}
                                          >
                                            {t.teacherName}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="text-center py-0.5">
                              <div className="font-semibold text-slate-800 text-xs">
                                {entry.teacherSignature || (
                                  <span className="text-slate-300">-</span>
                                )}
                              </div>
                              {(() => {
                                const currentEmail = entry.teacherSignature
                                  ? teachers.find(
                                      (t) =>
                                        t.teacherName.trim().toLowerCase() ===
                                        entry.teacherSignature.trim().toLowerCase()
                                    )?.email || entry.teacherEmail
                                  : entry.teacherEmail;

                                return currentEmail ? (
                                  <div
                                    className="text-[10px] text-blue-700 font-mono truncate max-w-[130px] mx-auto mt-0.5"
                                    title={'Gmail GV: ' + currentEmail}
                                  >
                                    {currentEmail}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </td>

                        {/* Cột Thao tác (chỉ hiện trên web, ẩn khi in/xuất) */}
                        <td className="no-print py-2 px-1 text-center align-middle font-sans">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                                title="Lưu dòng này"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftEntry({
                                    ...draftEntry!,
                                    subject: '',
                                    ppctLesson: '',
                                    absentCount: 0,
                                    absentStudents: '',
                                    lessonTitle: '',
                                    teacherSignature: '',
                                    teacherEmail: '',
                                  });
                                }}
                                className="p-1.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                                title="Xóa trắng các ô của dòng này để nhập lại từ đầu"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="p-1.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Hủy bỏ"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {editable && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(entry)}
                                  className="p-1 text-blue-700 hover:bg-blue-100 rounded cursor-pointer"
                                  title="Chỉnh sửa dòng tiết này"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {editable && (entry.subject || entry.lessonTitle || entry.teacherSignature || entry.ppctLesson || entry.absentStudents) && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmClearEntry(entry)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                  title="Xóa trắng nội dung dòng này để nhập lại"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Nút Xóa cụm ở dòng đầu tiên của cụm */}
                              {isClusterFirstRow && editable && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmClusterAction({ dayOfWeek: dayNum, clusterIndex: cIdx })}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer ml-1 text-xs font-semibold"
                                  title={`Tùy chọn xóa cụm môn ${cIdx} của ${dayNames[dayNum]}`}
                                >
                                  Xóa cụm
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  });
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: XÁC NHẬN XÓA NỘI DUNG DÒNG TIẾT ĐỂ NHẬP LẠI */}
      {confirmClearEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Xóa nội dung Tiết {confirmClearEntry.period} ({dayNames[confirmClearEntry.dayOfWeek]})?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bạn có thể xóa trắng thông tin tiết này nếu nhập lộn giáo viên hoặc bài dạy để nhập lại từ đầu.
                </p>
              </div>
            </div>

            {/* Thông tin hiện tại của dòng bị nhập nhầm */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Môn học:</span>
                <span className="font-bold text-blue-950">
                  {confirmClearEntry.subject || '(Chưa có)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiết PPCT:</span>
                <span className="font-semibold text-slate-800">
                  {confirmClearEntry.ppctLesson || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giáo viên ký tên:</span>
                <span className="font-bold text-amber-900">
                  {confirmClearEntry.teacherSignature || '(Chưa có)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nội dung bài dạy:</span>
                <span className="font-medium text-slate-800 truncate max-w-[200px]" title={confirmClearEntry.lessonTitle}>
                  {confirmClearEntry.lessonTitle || '(Trống)'}
                </span>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmClearRow(true)}
                className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Xóa trắng & Mở nhập lại ngay</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmClearRow(false)}
                className="w-full py-2 px-4 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Chỉ xóa trắng về ô trống (viết tay khi dạy)</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmClearEntry(null)}
                className="w-full py-2 px-4 text-slate-600 hover:text-slate-800 font-medium text-xs rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TÙY CHỌN XÓA CỤM MÔN */}
      {confirmClusterAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Tùy chọn Cụm {confirmClusterAction.clusterIndex} ({dayNames[confirmClusterAction.dayOfWeek]})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn hành động bạn muốn thực hiện đối với cụm 5 tiết này:
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isClearingBatch}
                onClick={() => handleClearClusterContent(confirmClusterAction.dayOfWeek, confirmClusterAction.clusterIndex)}
                className="w-full text-left p-3.5 border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 rounded-xl transition-all cursor-pointer group"
              >
                <div className="font-bold text-blue-950 text-xs flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-700 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Xóa trắng 5 tiết của cụm này để nhập lại</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 pl-6">
                  Giữ nguyên cụm, dọn sạch môn, bài học và giáo viên ở cả 5 tiết về trống để giáo viên nhập lại thông tin chuẩn.
                </div>
              </button>

              {/* Chỉ cho xóa bỏ hoàn toàn cụm nếu ngày đó có từ 2 cụm trở lên */}
              {(() => {
                const dayEntries = entries.filter((e) => e.dayOfWeek === confirmClusterAction.dayOfWeek);
                const count = new Set(dayEntries.map((e) => e.clusterIndex || 1)).size;
                if (count > 1) {
                  return (
                    <button
                      type="button"
                      onClick={() => handleDeleteClusterPermanently(confirmClusterAction.dayOfWeek, confirmClusterAction.clusterIndex)}
                      className="w-full text-left p-3.5 border border-red-200 bg-red-50 hover:bg-red-100/90 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="font-bold text-red-900 text-xs flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span>Xóa bỏ hoàn toàn cụm này khỏi {dayNames[confirmClusterAction.dayOfWeek]}</span>
                      </div>
                      <div className="text-[11px] text-red-700 mt-1 pl-6">
                        Xóa hẳn 5 dòng của cụm này (ngày sẽ bớt đi 5 dòng).
                      </div>
                    </button>
                  );
                }
                return null;
              })()}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setConfirmClusterAction(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
