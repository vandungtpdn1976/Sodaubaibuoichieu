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
  LogOut,
  KeyRound,
} from 'lucide-react';
import { CurrentUser, TeacherAssignment, SchoolConfig } from '../types';
import { checkIsAdmin } from '../constants/initialData';
import { googleSignIn, googleSignOut } from '../services/googleAuthService';

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
  onLogout?: () => void;
  onChangePasswordClick?: () => void;
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
  onLogout,
  onChangePasswordClick,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const hasScriptUrl = Boolean(config.scriptUrl && config.scriptUrl.trim());

  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningInGoogle(true);
    try {
      const res = await googleSignIn();
      
      // If user closed the popup window or cancelled, res is null
      if (!res) {
        return;
      }

      if (!res.user?.email) {
        alert('Không thể xác minh thông tin tài khoản Google.');
        return;
      }

      const email = res.user.email;

      // Verify user against backend roster / Supreme Admin
      const verifyRes = await fetch('/api/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.allowed && verifyData.user) {
        onSelectUser({
          uid: res.user.uid,
          name: verifyData.user.name,
          email: verifyData.user.email,
          role: verifyData.user.role === 'SUPER_ADMIN' ? 'admin' : 'teacher',
          assignedSubject: verifyData.user.assignedSubject,
          position: verifyData.user.position,
          status: 'ACTIVE',
        });
        setShowUserDropdown(false);
      } else {
        await googleSignOut();
        alert(
          verifyData.error ||
            `Tài khoản Gmail (${email}) chưa được Ban Giám hiệu cấp quyền sử dụng Sổ đầu bài. Vui lòng liên hệ quản trị viên.`
        );
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        // User intentionally closed the popup — no error alert needed
        return;
      }
      if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked')) {
        alert('Cửa sổ đăng nhập Google bị trình duyệt chặn (Popup blocked). Vui lòng cho phép mở cửa sổ bật lên (popup) trên trình duyệt và thử lại.');
        return;
      }
      console.error('Google Auth Error:', err);
      alert('Lỗi đăng nhập Google: ' + (err.message || String(err)));
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    const emailTrimmed = customEmail.trim();
    const emailLower = emailTrimmed.toLowerCase();
    const isAdmin = checkIsAdmin(emailLower);

    if (isAdmin) {
      const isDung = emailLower === 'vandungtpdn1976@gmail.com';
      onSelectUser({
        name: isDung ? 'Thầy Võ Văn Dũng' : 'Quản trị viên (BGH)',
        email: emailTrimmed,
        role: 'admin',
        assignedSubject: isDung ? 'Sử' : undefined,
        position: isDung ? 'Tổ trưởng' : undefined,
      });
    } else {
      // Check if matching teacher email
      const matchedTeacher = teachers.find(
        (t) => t.email.toLowerCase() === emailLower
      );

      if (matchedTeacher) {
        if (matchedTeacher.status === 'DISABLED') {
          alert('Tài khoản Gmail này đã bị Ban Giám hiệu khóa. Vui lòng liên hệ quản trị viên.');
          return;
        }
        onSelectUser({
          name: matchedTeacher.teacherName,
          email: matchedTeacher.email,
          role: 'teacher',
          assignedSubject: matchedTeacher.subject,
        });
      } else {
        alert(`Tài khoản Gmail (${emailTrimmed}) chưa được Ban Giám hiệu cấp quyền sử dụng Sổ đầu bài. Vui lòng liên hệ quản trị viên.`);
        return;
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

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningInGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Đăng nhập bằng Google qua Firebase Authentication"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">
                  {isSigningInGoogle ? 'Đang xác thực...' : 'Đăng nhập Google'}
                </span>
              </button>

              {/* User Switcher & Logout Dropdown */}
              <div className="relative flex items-center gap-2">
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
                  <div className="text-left max-w-[140px] sm:max-w-[210px] truncate">
                    <span className="block truncate font-bold text-slate-900">
                      {currentUser.name || 'Thầy Võ Văn Dũng'}
                    </span>
                    <span className="text-[11px] text-blue-700 block truncate font-medium">
                      {currentUser.email.toLowerCase() === 'vandungtpdn1976@gmail.com'
                        ? 'SUPER_ADMIN & GV Sử'
                        : currentUser.role === 'admin'
                        ? 'SUPER_ADMIN (Ban Giám Hiệu)'
                        : `TEACHER: ${currentUser.assignedSubject || 'Bộ môn'}`}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                </button>

                {/* Direct Logout Button */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                    title="Đăng xuất khỏi hệ thống và quay về màn hình đăng nhập"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ĐĂNG XUẤT</span>
                  </button>
                )}

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                            assignedSubject: 'Sử',
                            position: 'Tổ trưởng',
                          });
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-xs flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                            Thầy Võ Văn Dũng
                            <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-indigo-100 text-indigo-900">
                              Quản trị viên & GV Sử
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Quản trị viên (BGH) kiêm Tổ trưởng Môn Sử · vandungtpdn1976@gmail.com
                          </div>
                        </div>
                        {currentUser.email.toLowerCase() === 'vandungtpdn1976@gmail.com' && (
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
                          const isDung = teacher.email.toLowerCase() === 'vandungtpdn1976@gmail.com';
                          const isCurrent = currentUser.email.toLowerCase() === teacher.email.toLowerCase();
                          const isMulti = teachers.filter((t) => t.subject === teacher.subject).length > 1;

                        return (
                          <button
                            key={teacher.id}
                            type="button"
                            onClick={() => {
                              onSelectUser({
                                name: isDung ? 'Thầy Võ Văn Dũng' : teacher.teacherName,
                                email: teacher.email,
                                role: isDung ? 'admin' : 'teacher',
                                assignedSubject: teacher.subject,
                                position: teacher.position || (isDung ? 'Tổ trưởng' : undefined),
                              });
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-1.5 hover:bg-blue-50 text-xs flex items-center justify-between text-slate-700 transition-colors ${
                              isDung ? 'bg-indigo-50/60 font-semibold' : ''
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-semibold ${isDung ? 'text-indigo-950 font-bold' : 'text-slate-900'}`}>
                                  {teacher.teacherName}
                                </span>
                                {isDung ? (
                                  <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-indigo-200 text-indigo-900">
                                    ⭐ Quản trị & Tổ trưởng Sử
                                  </span>
                                ) : teacher.position && teacher.position !== 'Giáo viên' ? (
                                  <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                                    teacher.position === 'Tổ trưởng' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {teacher.position}
                                  </span>
                                ) : null}
                                <span className="text-blue-900 font-medium">
                                  ({teacher.subject})
                                </span>
                                {isMulti && !isDung && (
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

                    <div className="border-t border-slate-100 pt-1.5 px-3 space-y-1">
                      {onChangePasswordClick && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onChangePasswordClick();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-amber-900 font-bold hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          <span>Đổi mật khẩu cá nhân</span>
                        </button>
                      )}

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onLogout();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-700 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-600" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      )}
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
