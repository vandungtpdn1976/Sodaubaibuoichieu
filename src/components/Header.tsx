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
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 pb-3 border-b border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Tài khoản đang đăng nhập
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-blue-800 font-mono mt-0.5">
                        {currentUser.email}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-md">
                          {currentUser.role === 'admin' ? 'SUPER_ADMIN' : 'TEACHER'}
                        </span>
                        {currentUser.assignedSubject && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-md">
                            Môn {currentUser.assignedSubject}
                          </span>
                        )}
                        {currentUser.position && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md">
                            {currentUser.position}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 px-3 space-y-1">
                      {onChangePasswordClick && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onChangePasswordClick();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-800 font-bold hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-600" />
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
                          className="w-full text-left px-3 py-2 text-xs text-red-700 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-600" />
                          <span>Đăng xuất / Chuyển tài khoản khác</span>
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
    </>
  );
};
