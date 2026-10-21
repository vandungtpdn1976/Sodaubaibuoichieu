import React, { useState } from 'react';
import { Copy, X, Check, ArrowRight } from 'lucide-react';
import { LogPeriodEntry, SchoolConfig } from '../types';
import { ApiService } from '../services/apiService';

interface CopyWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetWeek: number;
  config: SchoolConfig;
  onApplyCopiedEntries: (entries: LogPeriodEntry[]) => void;
}

export const CopyWeekModal: React.FC<CopyWeekModalProps> = ({
  isOpen,
  onClose,
  targetWeek,
  config,
  onApplyCopiedEntries,
}) => {
  const defaultSource = targetWeek > 1 ? targetWeek - 1 : 1;
  const [sourceWeek, setSourceWeek] = useState<number>(defaultSource);
  const [copyLessons, setCopyLessons] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    setLoading(true);
    setError(null);
    try {
      const sourceEntries = await ApiService.loadWeekData(sourceWeek, config);
      if (!sourceEntries || sourceEntries.length === 0) {
        setError(`Tuần ${sourceWeek} chưa có dữ liệu để sao chép.`);
        setLoading(false);
        return;
      }

      // Load current target week structure to get the exact dates for target week
      const targetEntries = await ApiService.loadWeekData(targetWeek, config);

      // Create new copied entries
      const newEntries: LogPeriodEntry[] = targetEntries.map((targetE) => {
        const matchingSource = sourceEntries.find(
          (s) => s.dayOfWeek === targetE.dayOfWeek && s.period === targetE.period
        );

        if (!matchingSource || !matchingSource.subject) {
          return targetE;
        }

        return {
          ...targetE,
          subject: matchingSource.subject,
          ppctLesson: matchingSource.ppctLesson ? String(Number(matchingSource.ppctLesson) + 2) : '',
          absentCount: 0,
          absentStudents: '',
          lessonTitle: copyLessons ? matchingSource.lessonTitle : '',
          testScore: '',
          teacherNote: '',
          classification: '',
          teacherSignature: matchingSource.teacherSignature,
          teacherEmail: matchingSource.teacherEmail,
          updatedAt: new Date().toLocaleString('vi-VN'),
        };
      });

      onApplyCopiedEntries(newEntries);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError('Lỗi khi sao chép tuần: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const weeksList = Array.from({ length: 35 }, (_, i) => i + 1).filter(
    (w) => w !== targetWeek
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-blue-900 text-white">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-blue-200" />
            <h3 className="text-sm font-bold">
              Sao Chép Thời Khóa Biểu Từ Tuần Khác
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Hệ thống sẽ sao chép cấu trúc môn học, giáo viên phụ trách từ tuần nguồn sang{' '}
            <strong className="text-blue-900 font-bold">Tuần {targetWeek}</strong> để tiết kiệm
            thời gian nhập liệu.
          </p>

          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tuần nguồn:
              </label>
              <select
                value={sourceWeek}
                onChange={(e) => setSourceWeek(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                {weeksList.map((w) => (
                  <option key={w} value={w}>
                    Tuần {w < 10 ? '0' + w : w}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 mt-4 shrink-0" />

            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tuần đích:
              </label>
              <div className="px-2.5 py-1.5 bg-blue-100/70 border border-blue-300 rounded-lg font-bold text-blue-950 text-center">
                Tuần {targetWeek}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
              <input
                type="checkbox"
                checked={copyLessons}
                onChange={(e) => setCopyLessons(e.target.checked)}
                className="rounded-sm border-slate-300 text-blue-900 focus:ring-blue-800 w-4 h-4"
              />
              <span>Sao chép cả Tên bài / Nội dung công việc (mặc định xóa trống)</span>
            </label>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-300 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận sao chép</span>
          </button>
        </div>
      </div>
    </div>
  );
};
