import React, { useState } from 'react';
import {
  FileText,
  Printer,
  BarChart2,
  Settings,
  Code2,
  User,
  ShieldCheck,
  ChevronDown,
  Check,
  Globe,
  Database,
  CloudOff,
  Share2,
} from 'lucide-react';
import { CurrentUser, TeacherAssignment, SchoolConfig } from '../types';
import { checkIsAdmin } from '../constants/initialData';

interface HeaderProps {
  currentUser: CurrentUser;
  onSelectUser: (user: CurrentUser) => void;
  teachers: TeacherAssignment[];
  config: SchoolConfig;
  onOpenPrintPreview: () => void;
  onOpenStatistics: () => void;
  onOpenAdmin: () => void;
  onOpenAppsScript: () => void;
  onOpenShare: () => void;
  activeTab: 'table' | 'mobile';
  setActiveTab: (tab: 'table' | 'mobile') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  teachers,
  config,
  onOpenPrintPreview,
  onOpenStatistics,
  onOpenAdmin,
  onOpenAppsScript,
  onOpenShare,
  activeTab,
  setActiveTab,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const hasScriptUrl = Boolean(config.scriptUrl && config.scriptUrl.trim());

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const emailTrimmed = customEmail.trim();
    const emailLower = emailTrimmed.toLowerCase();
    const isAdmin = checkIsAdmin(emailLower);

    if (isAdmin) {
      onSelectUser({
        name: emailLower === 'vandungtpdn1976@gmail.com' ? 'Thầy Võ Văn Dũng' : 'Quản trị viên (BGH)',
        email: emailTrimmed,
        role: 'admin',
      });
    } else {
      // Check if matching teacher email
      const matchedTeacher = teachers.find(
        (t) => t.email.toLowerCase() === emailLower
      );

      if (matchedTeacher) {
        onSelectUser({
          name: matchedTeacher.teacherName,
          email: matchedTeacher.email,
          role: 'teacher',
          assignedSubject: matchedTeacher.subject,
        });
      } else {
        onSelectUser({
          name: emailTrimmed.split('@')[0],
          email: emailTrimmed,
          role: 'teacher',
        });
      }
    }
    setShowCustomModal(false);
    setShowUserDropdown(false);
    setCustomEmail('');
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Zone 1: Brand single text element */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold shadow-xs">
                <FileText className="w-5 h-5 text-blue-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-blue-950 whitespace-nowrap">
                  SỔ ĐẦU BÀI BUỔI CHIỀU
                </span>
                <span className="text-xs font-medium text-blue-700 hidden sm:inline-block">
                  Ôn thi học sinh giỏi · Năm học {config.academicYear}
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links (Clean, Single-line, No Pills) */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                  activeTab === 'table'
                    ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                    : 'hover:text-blue-900'
                }`}
              >
                Bảng ghi chép
              </button>

              <button
                type="button"
                onClick={onOpenPrintPreview}
                className="hover:text-blue-900 transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Xem bản in A4</span>
              </button>

              <button
                type="button"
                onClick={onOpenStatistics}
                className="hover:text-blue-900 transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 cursor-pointer"
              >
                <BarChart2 className="w-4 h-4 text-slate-500" />
                <span>Thống kê</span>
              </button>

              <button
                type="button"
                onClick={onOpenAppsScript}
                className="hover:text-blue-900 transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 cursor-pointer text-emerald-700 font-medium"
              >
                <Code2 className="w-4 h-4" />
                <span>Code.gs Google Sheet</span>
              </button>

              <button
                type="button"
                onClick={onOpenAdmin}
                className="hover:text-blue-900 transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Cấu hình & BGH</span>
              </button>
            </nav>

            {/* Zone 3: Primary Action & User Identity */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Share App Button */}
              <button
                type="button"
                onClick={onOpenShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Chia sẻ link app và mã QR để bất kỳ ai cũng vào xem và nhập được"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-200" />
                <span className="hidden sm:inline">Chia sẻ App</span>
              </button>

              {/* Central Server & Google Sheet Sync Status Indicator */}
              <div
                title="Dữ liệu được lưu máy chủ trung tâm: Khi giáo viên nhập tiết PPCT và bài dạy, admin và các giáo viên khác đều nhìn thấy ngay lập tức."
                className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border text-emerald-800 bg-emerald-50 border-emerald-200"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-900">Máy chủ trung tâm (Trực tuyến)</span>
                {hasScriptUrl && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1 rounded">
                    + Sheet
                  </span>
                )}
              </div>

              {/* User Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-800 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div className="text-left max-w-[140px] sm:max-w-[190px] truncate">
                    <span className="block truncate font-bold text-slate-900">
                      {currentUser.name || 'Thầy Võ Văn Dũng'}
                    </span>
                    <span className="text-[11px] text-blue-700 block truncate font-medium">
                      {currentUser.role === 'admin'
                        ? 'Quản trị viên (Ban Giám Hiệu)'
                        : `GV: ${currentUser.assignedSubject || 'Bộ môn'}`}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Đổi tài khoản đăng nhập
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1">
                      {/* BGH Admin */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectUser({
                            name: 'Thầy Võ Văn Dũng',
                            email: 'vandungtpdn1976@gmail.com',
                            role: 'admin',
                          });
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-xs flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                            Thầy Võ Văn Dũng
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Quản trị viên (BGH) · vandungtpdn1976@gmail.com
                          </div>
                        </div>
                        {currentUser.role === 'admin' && (
                          <Check className="w-4 h-4 text-blue-700" />
                        )}
                      </button>

                      <div className="my-1 border-t border-slate-100" />
                      <div className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                        Giáo viên ôn thi HSG ({teachers.length} GV)
                      </div>

                      {teachers.length === 0 ? (
                        <div className="px-4 py-3 text-center text-xs text-slate-500 bg-slate-50 mx-2 my-1 rounded-xl border border-dashed border-slate-200">
                          <p className="font-semibold text-slate-700">Chưa có giáo viên nào</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">DS cũ đã được xóa sạch để bạn nhập mới</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserDropdown(false);
                              onOpenAdmin();
                            }}
                            className="mt-2 py-1 px-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] rounded-lg cursor-pointer block w-full transition-colors"
                          >
                            + Mở Quản trị để Nhập từ File
                          </button>
                        </div>
                      ) : (
                        teachers.map((teacher) => {
                          const isCurrent =
                            currentUser.role === 'teacher' &&
                            currentUser.email.toLowerCase() === teacher.email.toLowerCase();
                          const isMulti = teachers.filter((t) => t.subject === teacher.subject).length > 1;

                        return (
                          <button
                            key={teacher.id}
                            type="button"
                            onClick={() => {
                              onSelectUser({
                                name: teacher.teacherName,
                                email: teacher.email,
                                role: 'teacher',
                                assignedSubject: teacher.subject,
                              });
                              setShowUserDropdown(false);
                            }}
                            className="w-full text-left px-4 py-1.5 hover:bg-blue-50 text-xs flex items-center justify-between text-slate-700 transition-colors"
                          >
                            <div className="truncate pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900">
                                  {teacher.teacherName}
                                </span>
                                {teacher.position && teacher.position !== 'Giáo viên' && (
                                  <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                                    teacher.position === 'Tổ trưởng' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {teacher.position}
                                  </span>
                                )}
                                <span className="text-blue-900 font-medium">
                                  ({teacher.subject})
                                </span>
                                {isMulti && (
                                  <span className="text-[10px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded font-medium">
                                    Đồng dạy
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono truncate">
                                {teacher.email}
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                    <div className="border-t border-slate-100 pt-1.5 px-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomModal(true);
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-center py-1.5 text-xs text-blue-700 font-medium hover:bg-blue-50 rounded-md transition-colors"
                      >
                        Đăng nhập bằng Email Google khác...
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Đăng nhập Email tùy chỉnh */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Đăng nhập tài khoản Google
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Nhập email Google của giáo viên để tự động nhận diện môn phụ trách theo phân công chuyên môn.
            </p>
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Email Google
                </label>
                <input
                  type="email"
                  required
                  placeholder="ví dụ: gv.toan@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
                >
                  Xác nhận đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
