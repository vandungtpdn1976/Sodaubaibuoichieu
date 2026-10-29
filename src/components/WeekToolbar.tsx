import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  Zap,
  Download,
  Calendar,
  Users,
} from 'lucide-react';
import { SchoolConfig, CurrentUser, TeacherAssignment } from '../types';

interface WeekToolbarProps {
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  fromDateStr: string;
  toDateStr: string;
  config: SchoolConfig;
  isLocked: boolean;
  onToggleLock: () => void;
  currentUser: CurrentUser;
  selectedSubjectFilter: string;
  onSelectSubjectFilter: (subj: string) => void;
  teachers?: TeacherAssignment[];
  selectedTeacherFilter?: string;
  onSelectTeacherFilter?: (teacher: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenQuickEntry: () => void;
  onOpenPrintPreview: () => void;
  onPrintNative: () => void;
  onExportWeekExcel: () => void;
  onExportSemesterExcel: () => void;
  onOpenAllWeeksOverview?: () => void;
  onSyncFromSheets?: () => void;
  onPushWeeks1To7?: () => void;
}

export const WeekToolbar: React.FC<WeekToolbarProps> = ({
  currentWeek,
  onSelectWeek,
  fromDateStr,
  toDateStr,
  config,
  isLocked,
  onToggleLock,
  currentUser,
  selectedSubjectFilter,
  onSelectSubjectFilter,
  teachers = [],
  selectedTeacherFilter = '',
  onSelectTeacherFilter,
  searchQuery,
  onSearchChange,
  onOpenQuickEntry,
  onOpenPrintPreview,
  onPrintNative,
  onExportWeekExcel,
  onExportSemesterExcel,
  onOpenAllWeeksOverview,
  onSyncFromSheets,
  onPushWeeks1To7,
}) => {
  const weeksList = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="no-print bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Row 1: Week Navigation, Grade Badge, Lock, and Export Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Week Selector Cluster */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => onSelectWeek(Math.max(1, currentWeek - 1))}
                disabled={currentWeek <= 1}
                title="Tuần trước"
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors rounded-l-lg cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="px-3 py-1 border-x border-slate-200 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tuần:
                </span>
                <select
                  value={currentWeek}
                  onChange={(e) => onSelectWeek(Number(e.target.value))}
                  className="text-sm font-bold text-blue-950 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  {weeksList.map((w) => (
                    <option key={w} value={w}>
                      Tuần {w}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => onSelectWeek(Math.min(35, currentWeek + 1))}
                disabled={currentWeek >= 35}
                title="Tuần sau"
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors rounded-r-lg cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Button Xem tất cả các tuần */}
            {onOpenAllWeeksOverview && (
              <button
                type="button"
                onClick={onOpenAllWeeksOverview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Bấm để xem danh sách tiến độ nhập sổ đầu bài của tất cả giáo viên từ Tuần 1 đến Tuần 35"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>Xem tất cả các tuần (35 tuần)</span>
              </button>
            )}

            {/* Grade level and date range */}
            <div className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hidden md:flex items-center gap-2">
              <span className="font-bold text-blue-900">{config.gradeLevel}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Từ:</span>
              <strong className="text-slate-900 font-mono">{fromDateStr}</strong>
              <span className="text-slate-500">Đến:</span>
              <strong className="text-slate-900 font-mono">{toDateStr}</strong>
            </div>

            {/* Lock Status */}
            {isLocked ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 border border-red-300 text-red-700">
                <Lock className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-xs sm:text-sm font-extrabold uppercase">
                  Sổ đầu bài đã bị khoá
                </span>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={onToggleLock}
                    className="ml-2 text-xs font-semibold text-red-700 underline hover:text-red-900 cursor-pointer"
                  >
                    Mở khoá
                  </button>
                )}
              </div>
            ) : (
              currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={onToggleLock}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Khóa tuần này</span>
                </button>
              )
            )}
          </div>

          {/* Action Buttons: Nhập nhanh, Đồng bộ, Lưu Tuần 1-7, Excel, Print */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Batch Entry button */}
            {!isLocked && (
              <button
                type="button"
                onClick={onOpenQuickEntry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Nhập nhanh các tiết dạy kèm PPCT tự tăng dần"
              >
                <Zap className="w-4 h-4 text-amber-200" />
                <span>Nhập nhanh</span>
              </button>
            )}

            {/* Button Push Weeks 1 to 7 to Google Sheets */}
            {onPushWeeks1To7 && (
              <button
                type="button"
                onClick={onPushWeeks1To7}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-2xs transition-all cursor-pointer ring-1 ring-emerald-500"
                title="Bấm để lưu toàn bộ dữ liệu giáo viên nhập từ Tuần 1 đến Tuần 7 sang Google Sheet"
              >
                <span>📊</span>
                <span>Lưu Tuần 1 - 7 sang Google Sheet</span>
              </button>
            )}

            {/* Sync from Google Sheets button */}
            {onSyncFromSheets && (
              <button
                type="button"
                onClick={onSyncFromSheets}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Đồng bộ lấy toàn bộ dữ liệu mới nhất từ Google Sheets theo link đã kết nối"
              >
                <span className="text-blue-700">🔄</span>
                <span>Lấy dữ liệu từ Sheets</span>
              </button>
            )}

            {/* Push Weeks 1 to 7 to Google Sheets */}
            {onPushWeeks1To7 && (
              <button
                type="button"
                onClick={onPushWeeks1To7}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Lưu và đẩy đồng loạt toàn bộ dữ liệu từ Tuần 1 đến Tuần 7 của tất cả môn học sang Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                <span>Đẩy Tuần 1 - 7 sang Sheets</span>
              </button>
            )}

            {/* Excel Tuần này */}
            <button
              type="button"
              onClick={onExportWeekExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Xuất file Excel Tuần này đúng chuẩn biểu mẫu trường"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Xuất Excel (tuần này)</span>
            </button>

            {/* Excel Cả học kỳ */}
            <button
              type="button"
              onClick={onExportSemesterExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Xuất file Excel gồm tất cả các tuần (Tuần 1 -> Tuần 18)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Xuất Excel (cả học kỳ)</span>
            </button>

            {/* Print Preview */}
            <button
              type="button"
              onClick={onOpenPrintPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-700" />
              <span>Xem trước A4</span>
            </button>

            {/* Direct Print */}
            <button
              type="button"
              onClick={onPrintNative}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In / Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search & Subject Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm môn học, tên bài, giáo viên..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-800 bg-slate-50 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Teacher Filter */}
            {onSelectTeacherFilter && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span className="font-medium">Giáo viên:</span>
                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => onSelectTeacherFilter(e.target.value)}
                  className={`px-2.5 py-1 border rounded-lg text-xs font-semibold focus:outline-hidden cursor-pointer ${
                    selectedTeacherFilter
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-300'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="">Tất cả giáo viên (Toàn trường)</option>
                  <option value="my_periods">
                    ⭐ Tiết của tôi ({currentUser.name}{currentUser.assignedSubject ? ` - Môn ${currentUser.assignedSubject}` : ''})
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.teacherName}>
                      {t.teacherName} ({t.subject})
                    </option>
                  ))}
                </select>
                {selectedTeacherFilter && (
                  <button
                    type="button"
                    onClick={() => onSelectTeacherFilter('')}
                    title="Bỏ lọc giáo viên, xem tất cả"
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    ✕ Hiện tất cả
                  </button>
                )}
              </div>
            )}

            {/* Subject Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">Lọc môn:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => onSelectSubjectFilter(e.target.value)}
                className={`px-2.5 py-1 border rounded-lg text-xs font-medium focus:outline-hidden cursor-pointer ${
                  selectedSubjectFilter
                    ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-300'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="">Tất cả các môn</option>
                {config.subjectsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {selectedSubjectFilter && (
                <button
                  type="button"
                  onClick={() => onSelectSubjectFilter('')}
                  title="Bỏ lọc môn"
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
