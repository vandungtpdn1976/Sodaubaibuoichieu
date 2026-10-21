import React, { useState } from 'react';
import { Zap, X, Check, Plus, Calendar, Clock, BookOpen, User, Mail } from 'lucide-react';
import { LogPeriodEntry, SchoolConfig, TeacherAssignment, CurrentUser } from '../types';
import { getDateForDayOfWeek } from '../utils/dateUtils';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  config: SchoolConfig;
  teachers: TeacherAssignment[];
  currentUser: CurrentUser;
  entries: LogPeriodEntry[];
  onApplyBatch: (newEntries: LogPeriodEntry[]) => Promise<void>;
  initialDay?: number;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  config,
  teachers,
  currentUser,
  entries,
  onApplyBatch,
  initialDay = 3, // Default to Thứ 3
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    currentUser.role === 'teacher' && currentUser.assignedSubject
      ? currentUser.assignedSubject
      : 'Hóa'
  );
  const [targetClusterOption, setTargetClusterOption] = useState<string>('new'); // 'new' or cluster index string
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([1, 2, 3, 4]); // Default 1, 2, 3, 4
  const [startPPCT, setStartPPCT] = useState<string>('5');
  const [lessonTitle, setLessonTitle] = useState<string>('Liên kết hoá học');
  const [absentStudents, setAbsentStudents] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>(() => {
    const t = teachers.find((tc) => tc.subject === 'Hóa');
    return t ? t.teacherName : currentUser.name;
  });
  const [teacherEmail, setTeacherEmail] = useState<string>(() => {
    const t = teachers.find((tc) => tc.subject === 'Hóa');
    return t ? t.email : currentUser.email;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dayNames: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ Nhật',
  };

  // Find existing clusters for the selected day
  const existingClustersForDay = React.useMemo(() => {
    const dayEntries = entries.filter((e) => Number(e.dayOfWeek) === Number(selectedDay));
    const indices = Array.from(
      new Set(dayEntries.map((e) => Number(e.clusterIndex) || 1))
    ).sort((a, b) => a - b);
    return indices;
  }, [entries, selectedDay]);

  const subjectTeachers = React.useMemo(() => {
    return teachers.filter((t) => t.subject === selectedSubject);
  }, [teachers, selectedSubject]);

  const handleSubjectChange = (subj: string) => {
    setSelectedSubject(subj);
    const matchedTeachers = teachers.filter((t) => t.subject === subj);
    const currentMatched = matchedTeachers.find(
      (t) => t.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (currentMatched) {
      setTeacherName(currentMatched.teacherName);
      setTeacherEmail(currentMatched.email);
    } else if (matchedTeachers.length > 0) {
      setTeacherName(matchedTeachers[0].teacherName);
      setTeacherEmail(matchedTeachers[0].email);
    }
  };

  const togglePeriod = (p: number) => {
    if (selectedPeriods.includes(p)) {
      setSelectedPeriods(selectedPeriods.filter((item) => item !== p));
    } else {
      setSelectedPeriods([...selectedPeriods, p].sort((a, b) => a - b));
    }
  };

  const handleQuickPreset = (preset: '1-4' | '1-5' | '1-2' | '3-4') => {
    if (preset === '1-4') setSelectedPeriods([1, 2, 3, 4]);
    if (preset === '1-5') setSelectedPeriods([1, 2, 3, 4, 5]);
    if (preset === '1-2') setSelectedPeriods([1, 2]);
    if (preset === '3-4') setSelectedPeriods([3, 4]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPeriods.length === 0) {
      alert('Vui lòng chọn ít nhất một tiết dạy.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { dateStr } = getDateForDayOfWeek(
        currentWeek,
        config.weekOneStartDate,
        selectedDay
      );

      // Determine target cluster index
      let targetClusterIndex: number;
      if (targetClusterOption === 'new') {
        const maxCluster = existingClustersForDay.reduce((max, c) => Math.max(max, c), 0);
        targetClusterIndex = maxCluster + 1;
      } else {
        targetClusterIndex = parseInt(targetClusterOption, 10);
      }

      const finalTeacherEmail = teacherEmail.trim() || (teachers.find((t) => t.teacherName === teacherName)?.email) || currentUser.email;

      // Start PPCT number
      const basePPCTNum = parseInt(startPPCT.trim(), 10);
      const hasPPCTNumber = !isNaN(basePPCTNum);

      // Parse absent count
      const absentCount = absentStudents.trim()
        ? absentStudents.split(',').filter(Boolean).length
        : 0;

      // Make a copy of current entries
      const updatedEntries = [...entries];

      // Ensure 5 periods exist for this cluster (Tiết 1..5)
      for (let p = 1; p <= 5; p++) {
        const existingIdx = updatedEntries.findIndex(
          (e) =>
            Number(e.dayOfWeek) === Number(selectedDay) &&
            (Number(e.clusterIndex) || 1) === Number(targetClusterIndex) &&
            Number(e.period) === Number(p)
        );

        const isChosenPeriod = selectedPeriods.includes(p);
        let ppctForThisPeriod = '';
        if (isChosenPeriod) {
          if (hasPPCTNumber) {
            // Find which index in selectedPeriods this period is
            const orderIndex = selectedPeriods.indexOf(p);
            ppctForThisPeriod = String(basePPCTNum + orderIndex);
          } else {
            ppctForThisPeriod = startPPCT;
          }
        }

        const entryData: LogPeriodEntry = {
          id: `w${currentWeek}_d${selectedDay}_c${targetClusterIndex}_p${p}`,
          weekNumber: Number(currentWeek),
          dayOfWeek: Number(selectedDay),
          dateStr,
          clusterIndex: Number(targetClusterIndex),
          period: Number(p),
          subject: isChosenPeriod ? selectedSubject : '',
          ppctLesson: isChosenPeriod ? ppctForThisPeriod : '',
          absentCount: isChosenPeriod ? absentCount : 0,
          absentStudents: isChosenPeriod ? absentStudents.trim() : '',
          lessonTitle: isChosenPeriod ? lessonTitle.trim() : '',
          teacherSignature: isChosenPeriod ? teacherName.trim() : '',
          teacherEmail: isChosenPeriod ? finalTeacherEmail : '',
          updatedAt: new Date().toLocaleString('vi-VN'),
        };

        if (existingIdx >= 0) {
          if (isChosenPeriod) {
            updatedEntries[existingIdx] = entryData;
          }
        } else {
          updatedEntries.push(entryData);
        }
      }

      await onApplyBatch(updatedEntries);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi nhập nhanh dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-blue-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">
                Nhập Nhanh Tiết Dạy Học Sinh Giỏi
              </h3>
              <p className="text-xs text-blue-200">
                Tự động sinh các tiết dạy và đánh số Tiết PPCT liên tiếp tăng dần
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Day & Cluster */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Chọn Ngày:
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-bold text-blue-950 bg-white"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                  <option key={d} value={d}>
                    {dayNames[d]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Cụm môn học:
              </label>
              <select
                value={targetClusterOption}
                onChange={(e) => setTargetClusterOption(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium"
              >
                <option value="new">+ Thêm cụm môn mới</option>
                {existingClustersForDay.map((c) => (
                  <option key={c} value={c}>
                    Ghi vào Cụm {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject & Teacher */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Môn học:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-bold text-blue-950 bg-white"
              >
                {config.subjectsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Giáo viên ký tên:
                </label>
                {subjectTeachers.length > 1 && (
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {subjectTeachers.length} GV cùng dạy môn này
                  </span>
                )}
              </div>

              {subjectTeachers.length > 1 ? (
                <div className="space-y-1.5">
                  <select
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-2.5 py-2 border border-blue-400 bg-blue-50/50 rounded-lg font-bold text-blue-950 text-xs"
                  >
                    {subjectTeachers.map((t, idx) => (
                      <option key={t.id} value={t.teacherName}>
                        GV {idx + 1}: {t.teacherName} ({t.email})
                      </option>
                    ))}
                    <option value="__custom__">-- Nhập tên giáo viên khác --</option>
                  </select>
                  {teacherName === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Nhập họ và tên giáo viên..."
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800"
                      autoFocus
                    />
                  )}
                  <div className="flex flex-wrap gap-1 items-center pt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Chọn nhanh:</span>
                    {subjectTeachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setTeacherName(t.teacherName); setTeacherEmail(t.email); }}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                          teacherName === t.teacherName
                            ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {t.teacherName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Họ tên đầy đủ"
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-medium"
                />
              )}

              {/* Vị trí điền Gmail giáo viên */}
              <div className="mt-2">
                <label className="block text-[11px] font-bold text-blue-950 uppercase mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-700" />
                  <span>Vị trí điền Gmail giáo viên:</span>
                </label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="Nhập địa chỉ Gmail giáo viên..."
                  className="w-full px-2.5 py-1.5 border border-blue-300 bg-blue-50/50 rounded-lg font-mono text-xs text-blue-950 focus:outline-hidden focus:border-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Periods checkboxes (1 to 5) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Tiết dạy trong cụm (1 đến 5):
              </label>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('1-4')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-800 rounded font-medium"
                >
                  Tiết 1-4
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('1-5')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-800 rounded font-medium"
                >
                  Tiết 1-5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('1-2')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-800 rounded font-medium"
                >
                  Tiết 1-2
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('3-4')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-800 rounded font-medium"
                >
                  Tiết 3-4
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((p) => {
                const isChecked = selectedPeriods.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePeriod(p)}
                    className={`py-2 px-1 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Tiết {p}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              * Tiết không dạy (ví dụ Tiết 5) sẽ tự động giữ dòng trống có viền để ghi tay.
            </p>
          </div>

          {/* Start PPCT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Tiết PPCT bắt đầu:
            </label>
            <input
              type="text"
              value={startPPCT}
              onChange={(e) => setStartPPCT(e.target.value)}
              placeholder="VD: 5"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
            />
            {selectedPeriods.length > 0 && !isNaN(Number(startPPCT)) && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                Tự động sinh các tiết PPCT:{' '}
                {selectedPeriods
                  .map((_, idx) => Number(startPPCT) + idx)
                  .join(', ')}
              </p>
            )}
          </div>

          {/* Lesson Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Tên bài, nội dung công việc:
            </label>
            <textarea
              rows={2}
              required
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="Nhập tên bài học, chuyên đề bồi dưỡng..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed"
            />
          </div>

          {/* Absent Students */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Tên học sinh nghỉ tiết (nếu có, để trống nếu đủ):
            </label>
            <input
              type="text"
              value={absentStudents}
              onChange={(e) => setAbsentStudents(e.target.value)}
              placeholder="VD: Trần Quốc Anh (Ốm)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Áp dụng nhập nhanh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
