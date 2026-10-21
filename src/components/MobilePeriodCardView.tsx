import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Save,
  UserX,
  BookOpen,
  Check,
  X,
} from 'lucide-react';
import {
  LogPeriodEntry,
  CurrentUser,
  TeacherAssignment,
} from '../types';
import { DEFAULT_SUBJECTS_LIST, checkIsAdmin } from '../constants/initialData';

interface MobilePeriodCardViewProps {
  entries: LogPeriodEntry[];
  isLocked: boolean;
  currentUser: CurrentUser;
  teachers: TeacherAssignment[];
  onSaveEntry: (entry: LogPeriodEntry) => Promise<void>;
  onDeleteCluster: (dayOfWeek: number, clusterIndex: number) => Promise<void>;
  onAddCluster: (dayOfWeek: number) => void;
  onOpenAbsentModal: (entry: LogPeriodEntry) => void;
}

export const MobilePeriodCardView: React.FC<MobilePeriodCardViewProps> = ({
  entries,
  isLocked,
  currentUser,
  teachers,
  onSaveEntry,
  onDeleteCluster,
  onAddCluster,
  onOpenAbsentModal,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(2); // 2 = Thứ 2
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftEntry, setDraftEntry] = useState<LogPeriodEntry | null>(null);
  const [saving, setSaving] = useState(false);

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

  const canEditEntry = (entry: LogPeriodEntry): boolean => {
    // Admin (vandungtpdn1976@gmail.com) always has full editing rights
    if (currentUser.role === 'admin' || checkIsAdmin(currentUser.email)) return true;
    if (isLocked) return false;
    if (currentUser.role === 'teacher') {
      if (!entry.subject) return true;
      if (entry.subject === currentUser.assignedSubject) return true;
      if (entry.teacherEmail && entry.teacherEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      if (entry.teacherSignature && entry.teacherSignature.toLowerCase() === currentUser.name.toLowerCase()) return true;
      return teachers.some(
        (t) => t.email.toLowerCase() === currentUser.email.toLowerCase() && t.subject === entry.subject
      );
    }
    return false;
  };

  const startEdit = (entry: LogPeriodEntry) => {
    if (!canEditEntry(entry)) return;
    setEditingId(entry.id);
    setDraftEntry({ ...entry });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftEntry(null);
  };

  const saveDraft = async () => {
    if (!draftEntry) return;
    setSaving(true);
    try {
      await onSaveEntry(draftEntry);
      setEditingId(null);
      setDraftEntry(null);
    } finally {
      setSaving(false);
    }
  };

  const handleSubjectChange = (newSubj: string) => {
    if (!draftEntry) return;
    const matched = teachers.filter((t) => t.subject === newSubj);
    const loggedIn = matched.find((t) => t.email.toLowerCase() === currentUser.email.toLowerCase());
    const assigned = loggedIn || matched[0];
    setDraftEntry({
      ...draftEntry,
      subject: newSubj,
      teacherSignature: assigned?.teacherName || (currentUser.role === 'teacher' ? currentUser.name : draftEntry.teacherSignature),
      teacherEmail: assigned?.email || '',
    });
  };

  const dayEntries = entries.filter((e) => e.dayOfWeek === selectedDay);
  const selectedDateStr = dayEntries[0]?.dateStr || '';

  // Group by cluster
  const clusterIndices = Array.from(
    new Set(dayEntries.map((e) => e.clusterIndex || 1))
  ).sort((a, b) => a - b);

  return (
    <div className="w-full space-y-4">
      {/* Day Selector Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
        {days.map((dayNum) => {
          const isSelected = selectedDay === dayNum;
          const isSun = dayNum === 8;
          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDay(dayNum)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? isSun
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-blue-900 text-white shadow-xs'
                  : isSun
                  ? 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{dayNames[dayNum]}</span>
            </button>
          );
        })}
      </div>

      {/* Date Banner */}
      <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
          <Calendar className="w-4 h-4 text-blue-800" />
          <span>
            {dayNames[selectedDay]} · Ngày: <strong className="font-mono">{selectedDateStr}</strong>
          </span>
        </div>
        {!isLocked && (
          <button
            type="button"
            onClick={() => onAddCluster(selectedDay)}
            className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm môn</span>
          </button>
        )}
      </div>

      {/* Clusters */}
      <div className="space-y-4">
        {clusterIndices.map((cIdx) => {
          const cRows = dayEntries.filter((e) => (e.clusterIndex || 1) === cIdx);
          const firstSubj = cRows.find((r) => r.subject)?.subject || 'Chưa chọn môn';

          return (
            <div
              key={cIdx}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-900" />
                  <span className="text-xs font-bold text-blue-950 uppercase">
                    Cụm {cIdx}: {firstSubj}
                  </span>
                </div>
                {!isLocked && clusterIndices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteCluster(selectedDay, cIdx)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa cụm</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((pNum) => {
                  const entry = cRows.find((r) => r.period === pNum);
                  if (!entry) return null;
                  const isEditing = editingId === entry.id;

                  return (
                    <div key={entry.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-900 text-white text-xs font-bold">
                          {pNum}
                        </span>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={saveDraft}
                                disabled={saving}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>{saving ? 'Lưu...' : 'Lưu'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            canEditEntry(entry) && (
                              <button
                                type="button"
                                onClick={() => startEdit(entry)}
                                className="p-1 text-slate-500 hover:text-blue-900 cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {isEditing && draftEntry ? (
                        <div className="space-y-2 pt-1 text-xs">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                              Môn học:
                            </label>
                            <select
                              value={draftEntry.subject}
                              onChange={(e) => handleSubjectChange(e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1.5 font-semibold text-blue-950"
                            >
                              <option value="">-- Chọn môn --</option>
                              {DEFAULT_SUBJECTS_LIST.map((subj) => (
                                <option key={subj} value={subj}>
                                  {subj}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                                Tiết PPCT:
                              </label>
                              <input
                                type="text"
                                value={draftEntry.ppctLesson}
                                onChange={(e) =>
                                  setDraftEntry({ ...draftEntry, ppctLesson: e.target.value })
                                }
                                placeholder="VD: 5"
                                className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                                Ký tên GV:
                              </label>
                              <input
                                type="text"
                                value={draftEntry.teacherSignature}
                                onChange={(e) =>
                                  setDraftEntry({ ...draftEntry, teacherSignature: e.target.value })
                                }
                                placeholder="Họ và tên GV"
                                className="w-full border border-slate-300 rounded px-2 py-1 font-serif"
                              />
                              {(() => {
                                const subjTeachers = teachers.filter((t) => t.subject === draftEntry.subject);
                                if (subjTeachers.length > 1) {
                                  return (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {subjTeachers.map((t) => (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() =>
                                            setDraftEntry({
                                              ...draftEntry,
                                              teacherSignature: t.teacherName,
                                              teacherEmail: t.email,
                                            })
                                          }
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                            draftEntry.teacherSignature === t.teacherName
                                              ? 'bg-blue-900 text-white border-blue-900'
                                              : 'bg-blue-50 text-blue-900 border-blue-200'
                                          }`}
                                        >
                                          {t.teacherName}
                                        </button>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                              Tên HS nghỉ tiết:
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={draftEntry.absentStudents}
                                onChange={(e) =>
                                  setDraftEntry({
                                    ...draftEntry,
                                    absentStudents: e.target.value,
                                    absentCount: e.target.value.trim() ? e.target.value.split(',').length : 0,
                                  })
                                }
                                placeholder="Để trống nếu không ai nghỉ"
                                className="flex-1 border border-slate-300 rounded px-2 py-1 text-red-700"
                              />
                              <button
                                type="button"
                                onClick={() => onOpenAbsentModal(draftEntry)}
                                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Chọn</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                              Tên bài, nội dung công việc:
                            </label>
                            <textarea
                              rows={2}
                              value={draftEntry.lessonTitle}
                              onChange={(e) =>
                                setDraftEntry({ ...draftEntry, lessonTitle: e.target.value })
                              }
                              placeholder="Nhập tên bài hoặc nội dung công việc..."
                              className="w-full border border-slate-300 rounded px-2 py-1 text-slate-800"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-950">
                              {entry.subject || <em className="text-slate-400 font-normal">Trống môn</em>}
                            </span>
                            {entry.ppctLesson && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                PPCT: <strong>{entry.ppctLesson}</strong>
                              </span>
                            )}
                          </div>

                          <p className="text-slate-800 line-clamp-2">
                            {entry.lessonTitle || (
                              <span className="text-slate-400 italic">Chưa có bài dạy</span>
                            )}
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-red-600 font-medium">
                              {entry.absentStudents ? `Vắng: ${entry.absentStudents}` : ''}
                            </span>
                            <span className="font-serif italic text-slate-700">
                              {entry.teacherSignature || 'Chưa ký'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
