import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword === 'ptdtnt@2026') {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu mặc định (ptdtnt@2026).');
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
        alert('Đã đổi mật khẩu cá nhân thành công!');
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
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-5 text-center relative">
          <div className="inline-flex items-center justify-center p-2.5 bg-white/20 rounded-2xl mb-2 text-white">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-base font-extrabold uppercase tracking-wide">
            {isFirstLogin ? 'BẮT BUỘC ĐỔI MẬT KHẨU LẦN ĐẦU' : 'ĐỔI MẬT KHẨU CÁ NHÂN'}
          </h2>
          <p className="text-xs text-amber-100 font-medium mt-1">
            Tài khoản: <strong className="text-white">{userName}</strong> ({userEmail})
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isFirstLogin && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-medium leading-relaxed">
              <strong>Lưu ý bảo mật:</strong> Bạn đang đăng nhập bằng mật khẩu mặc định tạm thời (<code>ptdtnt@2026</code>). Để đảm bảo an toàn tài khoản, Ban Giám hiệu yêu cầu bạn đổi sang mật khẩu riêng trước khi sử dụng Sổ đầu bài.
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
                placeholder="ptdtnt@2026"
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-600 bg-slate-50 focus:bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-600 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-600 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {!isFirstLogin && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`${
                !isFirstLogin && onCancel ? 'w-1/2' : 'w-full'
              } py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
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
