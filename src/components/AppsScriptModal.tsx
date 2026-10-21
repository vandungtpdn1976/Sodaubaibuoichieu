import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  X,
  ExternalLink,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  APPS_SCRIPT_SOURCE_CODE,
  APPS_SCRIPT_INSTRUCTIONS,
} from '../utils/googleAppsScriptCode';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                Mã Nguồn Google Apps Script (Code.gs) & Hướng Dẫn Cài Đặt
              </h2>
              <p className="text-xs text-blue-200">
                Tự động tạo Sheet từng tuần, kẻ khung bảng điểm, đồng bộ hai chiều thời gian thực
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Quick Notice */}
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong className="block font-bold mb-1">
                Hoàn toàn miễn phí, lưu trữ vĩnh viễn trên Google Drive của trường:
              </strong>
              Bạn chỉ cần tạo một bảng tính Google Sheets mới, mở Apps Script và dán đoạn mã
              này vào. Hệ thống sẽ tự động tạo các sheet theo tên{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded-sm border border-emerald-200">
                Tuan_01, Tuan_02...
              </code>
              , kẻ khung viền, tô màu xanh tiêu đề và định dạng căn giữa số liệu chuẩn chỉ.
            </div>
          </div>

          {/* Step by step guide */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-800" />
              <span>Các bước thiết lập trong 3 phút (Dành cho người không rành lập trình):</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {APPS_SCRIPT_INSTRUCTIONS.map((item) => (
                <div
                  key={item.step}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      {item.step}
                    </span>
                    <strong className="text-slate-900 font-bold">{item.title}</strong>
                  </div>
                  <p className="text-slate-600 pl-7 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Code Viewer & Copy button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Nội dung tệp Code.gs:
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Đã sao chép vào bộ nhớ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép toàn bộ mã</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative border border-slate-700 rounded-xl overflow-hidden bg-slate-950 text-slate-200">
              <pre className="p-4 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
                <code>{APPS_SCRIPT_SOURCE_CODE}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Mở Google Sheets mới (sheets.new)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Đóng hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
