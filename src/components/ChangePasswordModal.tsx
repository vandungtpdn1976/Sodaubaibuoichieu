import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface ChangePasswordModalProps {
  userEmail: string;
  userName: string;
  isFirstLogin?: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  userEmail,
  userName,
  isFirstLogin = false,
  onSuccess,
  onCancel,
}) => {
  const [currentPassword, setCurrentPassword] = useState(isFirstLogin ? 'ptdtnt@2026' : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Strong password checks
  const hasMinLength = newPassword.length >= 12;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const isNotDefault = newPassword !== 'ptdtnt@2026' && newPassword !== 'vandung@2026';
  const isStrong = hasMinLength && hasLetter && (hasNumber || hasSpecial) && isNotDefault;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 12) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 12 ký tự theo quy định bảo mật.');
      return;
    }

    if (!isNotDefault) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu khởi tạo mặc định.');
      return;
    }

    if (!hasLetter || (!hasNumber && !hasSpecial)) {
      setErrorMessage('Mật khẩu mới phải bao gồm cả chữ cái và chữ số hoặc ký tự đặc biệt.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiService.changePassword(
        userEmail,
        currentPassword,
        newPassword
      );

      if (res.success) {
        alert('Đã đổi mật khẩu cá nhân thành công! Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.');
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
      }
    } catch (err: any) {
      setErrorMessage('Lỗi hệ thống khi đổi mật khẩu: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white p-5 text-center relative border-b border-blue-900">
          <div className="inline-flex items-center justify-center p-2.5 bg-white/10 rounded-2xl mb-2 text-blue-200 border border-white/10">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-wide">
            {isFirstLogin ? 'ĐỔI MẬT KHẨU LẦN ĐẦU' : 'ĐỔI MẬT KHẨU CÁ NHÂN'}
          </h2>
          <p className="text-xs text-blue-200 font-medium mt-1">
            Tài khoản: <strong className="text-white">{userName}</strong> ({userEmail})
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isFirstLogin && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-medium leading-relaxed">
              <strong>Yêu cầu bắt buộc:</strong> Bạn đang đăng nhập bằng mật khẩu mặc định tạm thời. Vì lý do an toàn, hệ thống yêu cầu bạn thiết lập mật khẩu cá nhân mới (tối thiểu 12 ký tự) trước khi truy cập Sổ đầu bài.
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2 text-xs text-red-950 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Mật khẩu hiện tại</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại..."
                className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-800 bg-slate-50 focus:bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Mật khẩu mới (Tối thiểu 12 ký tự)</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (ít nhất 12 ký tự)..."
                className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-800 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Password strength criteria checklist */}
            {newPassword.length > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-1 mt-1.5">
                <div className="font-semibold text-slate-600 mb-1">Kiểm tra độ mạnh mật khẩu:</div>
                <div className="flex items-center gap-1.5 text-xs">
                  {hasMinLength ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                    Tối thiểu 12 ký tự ({newPassword.length}/12)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  {hasLetter && (hasNumber || hasSpecial) ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className={hasLetter && (hasNumber || hasSpecial) ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                    Bao gồm cả chữ cái và chữ số / ký tự đặc biệt
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  {isNotDefault ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className={isNotDefault ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                    Khác với mật khẩu mặc định khởi tạo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-800 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {!isFirstLogin && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || (newPassword.length > 0 && !isStrong)}
              className={`${
                !isFirstLogin && onCancel ? 'w-1/2' : 'w-full'
              } py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-300" />
                  <span>XÁC NHẬN ĐỔI MẬT KHẨU</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

