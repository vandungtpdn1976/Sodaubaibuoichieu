import React, { useState } from 'react';
import { UserX, Check, Plus, Trash2, X } from 'lucide-react';
import { Student } from '../types';

interface AbsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayName: string;
  periodNumber: number;
  subjectName: string;
  initialAbsentCount: number;
  initialAbsentStudents: string;
  studentsList: Student[];
  onSave: (absentCount: number, absentStudentsStr: string) => void;
}

export const AbsentModal: React.FC<AbsentModalProps> = ({
  isOpen,
  onClose,
  dayName,
  periodNumber,
  subjectName,
  initialAbsentCount,
  initialAbsentStudents,
  studentsList,
  onSave,
}) => {
  // Parse existing names
  const [selectedNames, setSelectedNames] = useState<string[]>(() => {
    if (!initialAbsentStudents || !initialAbsentStudents.trim()) return [];
    return initialAbsentStudents
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  });

  const [customInput, setCustomInput] = useState('');

  const toggleStudent = (name: string) => {
    if (selectedNames.some((n) => n.startsWith(name))) {
      setSelectedNames(selectedNames.filter((n) => !n.startsWith(name)));
    } else {
      setSelectedNames([...selectedNames, name]);
    }
  };

  const addCustomStudent = () => {
    if (!customInput.trim()) return;
    const names = customInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setSelectedNames([...selectedNames, ...names]);
    setCustomInput('');
  };

  const handleClearAll = () => {
    setSelectedNames([]);
  };

  const handleSave = () => {
    const finalStr = selectedNames.join(', ');
    const count = selectedNames.length;
    onSave(count, finalStr);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-blue-900 text-white">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="text-sm font-bold">
                Ghi nhận Học sinh nghỉ tiết
              </h3>
              <p className="text-[11px] text-blue-200">
                {dayName} · Tiết {periodNumber} {subjectName ? `· Môn: ${subjectName}` : ''}
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Summary Count Bar */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs">
              <span className="text-slate-600 font-medium">Tổng số học sinh vắng:</span>{' '}
              <strong className="text-sm text-red-600 font-bold ml-1">
                {selectedNames.length}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              Đặt lại: Vắng 0
            </button>
          </div>

          {/* Current Absent List Tagged */}
          {selectedNames.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Danh sách HS vắng tiết này ({selectedNames.length} em):
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-red-50/50 border border-red-200 rounded-lg max-h-24 overflow-y-auto">
                {selectedNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white border border-red-300 text-red-800 rounded-md shadow-2xs font-medium"
                  >
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedNames(selectedNames.filter((_, i) => i !== idx))
                      }
                      className="text-red-400 hover:text-red-700 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Select from Roster */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn nhanh từ danh sách đội tuyển:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto border border-slate-200 p-2 rounded-lg bg-slate-50/50">
              {studentsList.map((st) => {
                const isSelected = selectedNames.some((n) => n.startsWith(st.name));
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleStudent(st.name)}
                    className={`px-2 py-1.5 text-xs text-left rounded-md border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-50 border-red-400 text-red-800 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{st.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-red-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom name / note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hoặc nhập tên khác kèm lý do:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: Nguyễn Văn A (ốm), Lê Thị B (có phép)..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomStudent();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-800"
              />
              <button
                type="button"
                onClick={addCustomStudent}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Lưu danh sách vắng
          </button>
        </div>
      </div>
    </div>
  );
};
