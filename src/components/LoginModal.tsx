import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  HelpCircle,
  Loader2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { CurrentUser } from '../types';
import { ApiService } from '../services/apiService';
import { googleSignIn, googleSignOut } from '../services/googleAuthService';

interface LoginModalProps {
  onLoginSuccess: (user: CurrentUser, isFirstLogin?: boolean) => void;
  configSchoolName?: string;
  configAcademicYear?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  configSchoolName = 'TRƯỜNG PTDTNT THPT BÌNH PHƯỚC',
  configAcademicYear = '2026 – 2027',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  // Handle standard Gmail + Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiService.loginWithPassword(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user, res.user.isFirstLogin);
      } else {
        setErrorMessage(
          res.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại Gmail và mật khẩu.'
        );
      }
    } catch (err: any) {
      console.error('Login error', err);
      setErrorMessage('Có lỗi xảy ra khi kết nối máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth Sign-in Option
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsSigningInGoogle(true);
    try {
      const res = await googleSignIn();
      if (!res) return;

      if (!res.user?.email) {
        setErrorMessage('Không thể xác minh địa chỉ Gmail từ Google Sign-In.');
        return;
      }

      const googleEmail = res.user.email;
      const verifyRes = await fetch('/api/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, uid: res.user.uid }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.allowed && verifyData.user) {
        const loggedUser: CurrentUser = {
          uid: res.user.uid,
          name: verifyData.user.name,
          email: verifyData.user.email,
          role: verifyData.user.role === 'SUPER_ADMIN' ? 'admin' : 'teacher',
          assignedSubject: verifyData.user.assignedSubject,
          position: verifyData.user.position,
          status: 'ACTIVE',
        };
        ApiService.saveCurrentUser(loggedUser);
        ApiService.setAuthenticatedSession(true);
        onLoginSuccess(loggedUser, false);
      } else {
        await googleSignOut();
        setErrorMessage(
          verifyData.error ||
            'Bạn không có quyền đăng nhập ứng dụng Sổ đầu bài. Vui lòng liên hệ quản trị viên.'
        );
      }
    } catch (err: any) {
      console.error('Google login error', err);
      const errStr = String(err?.message || err);
      if (
        errStr.includes('403') ||
        errStr.includes('access_denied') ||
        errStr.includes('restricted') ||
        errStr.includes('popup-closed')
      ) {
        setErrorMessage(
          'Google Sign-In bị chặn (Lỗi 403: access_denied từ Google Cloud do chưa duyệt domain OAuth). VUI LÒNG ĐĂNG NHẬP TRỰC TIẾP ở ô trên bằng Gmail: vovandungdx@gmail.com và Mật khẩu: ptdtnt@2026 (hoặc vandung@2026) để vào ứng dụng ngay!'
        );
      } else {
        setErrorMessage('Lỗi đăng nhập Google Auth: ' + errStr);
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccessMessage(null);
    setErrorMessage(null);

    if (!forgotEmail.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail cần khôi phục.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiService.requestPasswordReset(forgotEmail.trim());
      if (res.success) {
        setForgotSuccessMessage(res.message || 'Yêu cầu khôi phục mật khẩu đã được gửi thành công.');
      } else {
        setErrorMessage(res.error || 'Không tìm thấy tài khoản Gmail này trong hệ thống.');
      }
    } catch (err: any) {
      setErrorMessage('Lỗi kết nối đặt lại mật khẩu: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all my-8">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 text-center relative border-b border-blue-900/50">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-3 shadow-inner text-blue-200 border border-white/10">
            <BookOpen className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1">
            {configSchoolName}
          </p>
          <h1 className="text-xl font-extrabold uppercase font-serif tracking-tight text-white mb-1">
            SỔ ĐẦU BÀI BUỔI CHIỀU
          </h1>
          <h2 className="text-sm font-medium text-amber-300 font-sans">
            ÔN THI HỌC SINH GIỎI – NĂM HỌC {configAcademicYear}
          </h2>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hệ thống bảo mật & Phân quyền giáo viên</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {!showForgotPassword ? (
            /* Standard Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  Đăng Nhập Tài Khoản Giáo Viên
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng sử dụng Gmail được Ban Giám hiệu cấp quyền
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2.5 text-xs text-red-950 font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Gmail Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Địa chỉ Gmail</span>
                  <span className="text-[11px] font-normal text-slate-400">Bắt buộc</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setErrorMessage(null);
                    }}
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-slate-50 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Initial Password Hint */}
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Mật khẩu mặc định lần đầu cho giáo viên:</strong>{' '}
                  <code className="bg-amber-100 text-amber-900 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-300 select-all">
                    ptdtnt@2026
                  </code>
                  <br />
                  <span className="text-slate-600 font-normal">
                    (Yêu cầu bắt buộc đổi mật khẩu cá nhân ở lần đăng nhập đầu tiên).
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isSigningInGoogle}
                className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                    <span>Đang xác thực tài khoản...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-300" />
                    <span>ĐĂNG NHẬP SỔ ĐẦU BÀI</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold">
                    Hoặc xác thực bằng Google
                  </span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading || isSigningInGoogle}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {isSigningInGoogle ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Đăng nhập qua Google (Gmail)</span>
              </button>
            </form>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-center pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  Khôi Phục Mật Khẩu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập địa chỉ Gmail được cấp quyền để gửi yêu cầu đặt lại mật khẩu
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2 text-xs text-red-950 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {forgotSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2 text-xs text-emerald-950 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{forgotSuccessMessage}</div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Gmail cá nhân</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setErrorMessage(null);
                    setForgotSuccessMessage(null);
                  }}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Gửi Yêu Cầu</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
            <p>
              Nếu chưa có tài khoản hoặc bị khóa, vui lòng liên hệ Ban Giám hiệu / Thầy Võ Văn Dũng (
              <strong className="text-slate-800">vandungtpdn1976@gmail.com</strong>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
