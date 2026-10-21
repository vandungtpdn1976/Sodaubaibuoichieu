import React, { useState } from 'react';
import { X, Printer, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { LogPeriodEntry, SchoolConfig } from '../types';
import { PrintA4View } from './PrintA4View';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: number;
  fromDateStr: string;
  toDateStr: string;
  entries: LogPeriodEntry[];
  config: SchoolConfig;
  onPrintNative: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  fromDateStr,
  toDateStr,
  entries,
  config,
  onPrintNative,
}) => {
  const [scale, setScale] = useState<number>(0.9);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs">
      {/* Top action toolbar */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <Printer className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Xem trước bản in A4 · Tuần {currentWeek < 10 ? '0' + currentWeek : currentWeek}
            </h3>
            <p className="text-xs text-slate-400">
              Khổ giấy: A4 Nằm ngang (Landscape) · Chuẩn sổ đầu bài giấy
            </p>
          </div>
        </div>

        {/* Zoom & Print Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale(Math.min(1.4, scale + 0.1))}
              className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(0.9)}
              className="p-1 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white ml-1"
              title="Đặt lại tỉ lệ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onPrintNative}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In / Xuất PDF ngay</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-800/60">
        <div
          className="bg-white shadow-2xl rounded-xs origin-top transition-transform"
          style={{
            transform: `scale(${scale})`,
            width: '1200px',
            minHeight: '850px',
          }}
        >
          <PrintA4View
            currentWeek={currentWeek}
            fromDateStr={fromDateStr}
            toDateStr={toDateStr}
            entries={entries}
            config={config}
          />
        </div>
      </div>
    </div>
  );
};
