import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Users,
  ShieldCheck,
  Database,
  Smartphone,
  Globe,
  X,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Save,
  Download,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Send,
  CheckCircle2,
  BookOpen,
  Calendar,
  Lock,
} from 'lucide-react';
import { SchoolConfig, TeacherAssignment } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  config: SchoolConfig;
  onSaveConfig: (newConfig: SchoolConfig) => void;
  teachers?: TeacherAssignment[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  config,
  onSaveConfig,
  teachers = [],
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedZaloMsg, setCopiedZaloMsg] = useState(false);
  const [shareMode, setShareMode] = useState<'standard' | 'currentWeek' | 'subject'>('standard');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [customUrlInput, setCustomUrlInput] = useState<string>(config.publicAppUrl || '');
  const [isSavedCustomUrl, setIsSavedCustomUrl] = useState(false);
  const [showHowToDeploy, setShowHowToDeploy] = useState(false);

  useEffect(() => {
    setCustomUrlInput(config.publicAppUrl || '');
  }, [config.publicAppUrl]);

  if (!isOpen) return null;

  // Determine current origin from browser window safely
  const currentBrowserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentBrowserPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const fullBrowserUrl = currentBrowserOrigin + (currentBrowserPath !== '/' ? currentBrowserPath : '');

  // Detect if current environment is a private dev sandbox (Google AI Studio preview)
  const isDevPreview =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('ais-dev-') ||
      window.location.hostname.includes('run.app') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  // Base URL to use for sharing: preferred is config.publicAppUrl if set, otherwise current browser URL
  const baseUrl = (config.publicAppUrl && config.publicAppUrl.trim())
    ? config.publicAppUrl.trim().replace(/\/$/, '')
    : (fullBrowserUrl || 'https://ptdtnt-sodaubai.web.app');

  // Generate target URL based on chosen share mode
  let finalTargetUrl = baseUrl;
  if (shareMode === 'currentWeek') {
    finalTargetUrl = `${baseUrl}?week=${currentWeek}`;
  } else if (shareMode === 'subject') {
    finalTargetUrl = `${baseUrl}?week=${currentWeek}&subject=${encodeURIComponent(selectedSubject)}&open=quick`;
  }

  const handleCopyLink = async (textToCopy: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSavePublicUrl = () => {
    const cleaned = customUrlInput.trim().replace(/\/$/, '');
    const updated = {
      ...config,
      publicAppUrl: cleaned,
    };
    onSaveConfig(updated);
    setIsSavedCustomUrl(true);
    setTimeout(() => setIsSavedCustomUrl(false), 2500);
  };

  const handleUseCurrentBrowserUrl = () => {
    setCustomUrlInput(fullBrowserUrl);
    const updated = {
      ...config,
      publicAppUrl: fullBrowserUrl,
    };
    onSaveConfig(updated);
    setIsSavedCustomUrl(true);
    setTimeout(() => setIsSavedCustomUrl(false), 2500);
  };

  // Sample Zalo message for teachers
  const sampleZaloMessage = `KÍNH GỬI QUÝ THẦY / CÔ GIÁO ÔN THI HỌC SINH GIỎI (${config.schoolName})

Ban Giám hiệu gửi đường link Sổ đầu bài điện tử buổi chiều để Quý Thầy/Cô ký sổ và ghi nhận tiết dạy Tuần ${currentWeek}:
👉 Đường link vào app: ${finalTargetUrl}

HƯỚNG DẪN 3 BƯỚC NHẬP DỮ LIỆU ĐƠN GIẢN:
1. Mở link trên (hoạt động tốt trên cả Điện thoại và Máy tính).
2. Ở góc trên, chọn tên của mình hoặc môn dạy.
3. Bấm nút "+ Ghi sổ nhanh" hoặc nhấp cây bút trên dòng tiết dạy để nhập: Tên bài dạy, số tiết PPCT, số HS vắng và ký tên.
💡 NẾU NHẬP LỘN HOẶC NHẦM MÔN: Bấm vào biểu tượng Thùng rác màu đỏ trên dòng đó để xóa trắng dòng và nhập lại ngay lập tức!

Trân trọng cảm ơn Quý Thầy/Cô!`;

  const handleCopyZaloMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sampleZaloMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = sampleZaloMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedZaloMsg(true);
      setTimeout(() => setCopiedZaloMsg(false), 3000);
    } catch (err) {
      console.error('Failed to copy Zalo message', err);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
    finalTargetUrl
  )}`;

  // Available subjects
  const subjectsList = config.subjectsList && config.subjectsList.length > 0
    ? config.subjectsList
    : ['Toán', 'Lí', 'Hóa', 'Sinh', 'Công nghệ', 'Anh', 'Ngữ văn', 'Sử', 'Địa lí', 'GDKTPL', 'Tin học'];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
              <Share2 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Chia Sẻ Sổ Đầu Bài Cho Giáo Viên</span>
                <span className="text-[10px] bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                  Mở mọi thiết bị
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Khắc phục lỗi truy cập & gửi link để bất kỳ giáo viên nào cũng vào nhập được
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors cursor-pointer p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* CRITICAL WARNING & REASON WHY TEACHERS GET ERROR 403 */}
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-3 text-red-950">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                403
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-red-900 flex items-center gap-2">
                  <span>Khắc phục lỗi: "403. Désolé, vous n'avez pas accès à cette page"</span>
                  <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold">
                    Lỗi phân quyền Google
                  </span>
                </h3>
                <p className="text-xs leading-relaxed text-red-900">
                  Đây là trang thông báo lỗi của Google Cloud khi đường link đang bị khóa ở chế độ <strong>riêng tư</strong> (chỉ tài khoản của bạn mới mở được). Người ngoài hoặc giáo viên khi bấm vào chưa được cấp quyền thì Google sẽ trả về trang lỗi <strong>403 (Không có quyền truy cập)</strong> như trong hình.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-red-200 text-xs space-y-2">
              <div className="font-bold text-red-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-700" />
                <span>2 CÁCH KHẮC PHỤC NGAY ĐỂ GIÁO VIÊN VÀO ĐƯỢC 100%:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-800">
                <div className="p-3 bg-white border border-red-200 rounded-lg space-y-1.5">
                  <div className="font-bold text-red-900 text-xs flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    <span>Cấp quyền trên thanh Google AI Studio</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Nhìn lên góc trên cùng bên phải màn hình <strong>Google AI Studio</strong> (thanh tiêu đề web), bấm vào nút <strong>"Share" (Chia sẻ)</strong>. Chuyển quyền sang <strong>"Anyone with the link"</strong> (Bất kỳ ai có liên kết) rồi bấm Save.
                  </p>
                </div>

                <div className="p-3 bg-white border border-red-200 rounded-lg space-y-1.5">
                  <div className="font-bold text-blue-900 text-xs flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                    <span>Nếu giáo viên mở link từ Zalo</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Trình duyệt nội bộ của Zalo không có tài khoản Google nên bị lỗi 403. Thầy cô chỉ cần bấm <strong>dấu 3 chấm (...) ở góc trên Zalo</strong> -&gt; chọn <strong>"Mở bằng trình duyệt" (Chrome / Safari)</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Public App URL Input (Configurable) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-700" />
                <span>Link công khai của trường (Gửi cho giáo viên):</span>
              </label>
              {config.publicAppUrl ? (
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã cấu hình link công khai
                </span>
              ) : (
                <span className="text-[11px] text-amber-700 font-medium">
                  Chưa lưu link công khai
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="Dán link công khai (Ví dụ: https://ptdtnt-sodaubai.web.app hoặc link AI Studio Deploy)..."
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleSavePublicUrl}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu link</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseCurrentBrowserUrl}
                  title="Dùng link hiện tại của trình duyệt"
                  className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Lấy link hiện tại</span>
                </button>
              </div>
            </div>

            {isSavedCustomUrl && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Đã cập nhật link công khai thành công! Mã QR và nút Copy đã được làm mới.
              </p>
            )}
          </div>

          {/* Section: Choose Sharing Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Chọn dạng đường link muốn gửi:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShareMode('standard')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  shareMode === 'standard'
                    ? 'border-blue-700 bg-blue-50/70 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5 text-blue-700" />
                  <span>Link chung toàn trường</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Vào trang chủ sổ đầu bài
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShareMode('currentWeek')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  shareMode === 'currentWeek'
                    ? 'border-blue-700 bg-blue-50/70 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  <span>Mở ngay Tuần {currentWeek}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Tự động chuyển vào tuần đang dạy
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShareMode('subject')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  shareMode === 'subject'
                    ? 'border-blue-700 bg-blue-50/70 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                  <span>Theo từng Bộ môn</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Mở form Ghi sổ nhanh theo môn
                </p>
              </button>
            </div>

            {/* Subject Selector when 'subject' mode is active */}
            {shareMode === 'subject' && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in">
                <span className="text-xs font-semibold text-blue-950">Chọn môn học gửi:</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-blue-300 rounded font-bold text-blue-900"
                >
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>
                      Môn {s}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 italic">
                  (Giáo viên môn này mở ra sẽ vào thẳng form nhập của môn {selectedSubject})
                </span>
              </div>
            )}
          </div>

          {/* Section: The Active Sharing URL with Copy & Test Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Đường link đã tạo sẵn để sao chép:
              </label>
              <a
                href={finalTargetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở thử link này</span>
              </a>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border-2 border-blue-400 rounded-xl p-1.5 focus-within:border-blue-700 transition-colors">
              <div className="pl-2 text-blue-700">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                value={finalTargetUrl}
                className="w-full text-xs font-mono text-slate-800 bg-transparent outline-hidden select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={() => handleCopyLink(finalTargetUrl)}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-900 hover:bg-blue-800 text-white'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép link</span>
                  </>
                )}
              </button>
            </div>
            {copiedLink && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                Đã sao chép vào bộ nhớ tạm! Bạn có thể dán (Ctrl+V) vào nhóm Zalo của trường ngay.
              </p>
            )}
          </div>

          {/* Section: One-Click Zalo Message Generator */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  Zalo
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950 uppercase">
                    Tin nhắn mẫu gửi nhóm Zalo giáo viên:
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Đã soạn sẵn lời chào, link và 3 bước hướng dẫn ngắn gọn cho giáo viên
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyZaloMessage}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  copiedZaloMsg
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                {copiedZaloMsg ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã copy tin nhắn Zalo!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Copy mẫu tin Zalo</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs text-slate-700 whitespace-pre-line font-mono max-h-36 overflow-y-auto leading-relaxed">
              {sampleZaloMessage}
            </div>
          </div>

          {/* Section: QR Code Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-xs shrink-0 text-center">
              <img
                src={qrImageUrl}
                alt="QR Code Sổ đầu bài"
                className="w-36 h-36 rounded-lg mx-auto"
                loading="lazy"
              />
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                Quét bằng Camera hoặc Zalo
              </span>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-xs uppercase">
                <Smartphone className="w-4 h-4 text-blue-700" />
                <span>Quét mã QR để mở trên Điện thoại</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thầy/Cô có thể in mã QR này dán tại bàn giáo viên phòng học hoặc bảng tin. Giáo viên chỉ cần quét mã bằng điện thoại là vào ngay sổ đầu bài điện tử.
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href={qrImageUrl}
                  download="QR_SoDauBai_BuoiChieu.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-600 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>Tải ảnh mã QR</span>
                </a>
                <a
                  href={finalTargetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-300 hover:border-blue-600 text-blue-900 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                  <span>Mở tab mới kiểm tra</span>
                </a>
              </div>
            </div>
          </div>

          {/* Section: How to use & Instructions for Teachers */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-700" />
              <span>Tiện ích cho giáo viên khi vào app:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Chọn tài khoản hoặc môn dạy</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Ở góc trên bên phải, bấm vào tên để chuyển sang môn của mình hoặc ký tên trực tiếp trên từng tiết dạy.
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Nhập nhanh 5 tiết chỉ với 1 thao tác</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Bấm nút <strong>"+ Ghi sổ nhanh"</strong> để tự động điền cả 5 tiết học (tên bài, số tiết PPCT, ký tên) trong 10 giây.
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                <div className="font-bold text-red-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-900 text-[11px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Xóa và sửa khi nhập lộn giáo viên</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Nếu lỡ nhập nhầm giáo viên hoặc sai môn, bấm vào <strong>biểu tượng Thùng rác đỏ</strong> trên dòng đó để xóa trắng và nhập lại ngay.
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold flex items-center justify-center">
                    4
                  </span>
                  <span>Đồng bộ Google Sheet tập trung</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Bấm nút <strong>"Code.gs"</strong> trên thanh menu để kết nối Google Spreadsheet của trường. Dữ liệu từ điện thoại mọi giáo viên sẽ tự lưu về 1 nơi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 shrink-0">
          <span className="text-[11px] text-slate-500">
            Hỗ trợ toàn bộ trình duyệt trên Điện thoại (iOS / Android), Máy tính bảng, PC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
