import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Clipboard,
  Trash2,
  Check,
  X,
  AlertCircle,
  FileText,
  Download,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { TeacherAssignment } from '../types';

interface TeacherImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedTeachers: TeacherAssignment[], mode: 'replace' | 'append') => void;
  existingSubjects: string[];
}

// Helper to normalize Vietnamese strings for flexible column matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Map various subject aliases to standard subject names
function matchSubject(raw: string, validSubjects: string[]): string {
  const norm = normalizeText(raw);
  for (const s of validSubjects) {
    if (normalizeText(s) === norm) return s;
  }
  if (norm.includes('toan')) return 'Toán';
  if (norm.includes('vat li') || norm.includes('vat ly') || norm.includes('li') || norm.includes('ly')) return 'Lí';
  if (norm.includes('hoa')) return 'Hóa';
  if (norm.includes('sinh')) return 'Sinh';
  if (norm.includes('tin') || norm.includes('cntt')) return 'Tin học';
  if (norm.includes('van') || norm.includes('ngu van')) return 'Ngữ văn';
  if (norm.includes('anh') || norm.includes('tieng anh') || norm.includes('ngoai ngu')) return 'Anh';
  if (norm.includes('su') || norm.includes('lich su')) return 'Sử';
  if (norm.includes('dia') || norm.includes('dia ly') || norm.includes('dia li')) return 'Địa lí';
  if (norm.includes('ktpl') || norm.includes('gdktpl') || norm.includes('phap luat') || norm.includes('kinh te')) return 'GDKTPL';
  if (norm.includes('cong nghe')) return 'Công nghệ';

  return validSubjects[0] || 'Toán';
}

function normalizePosition(raw: string): string {
  const norm = normalizeText(raw);
  if (norm.includes('to truong') || norm === 'tt') return 'Tổ trưởng';
  if (norm.includes('to pho') || norm === 'tp') return 'Tổ phó';
  return 'Giáo viên';
}

export const TeacherImportModal: React.FC<TeacherImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingSubjects,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [rawText, setRawText] = useState('');
  const [parsedTeachers, setParsedTeachers] = useState<TeacherAssignment[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Process rows from SheetJS or parsed table
  const processRawRows = (rows: any[][], sourceName: string) => {
    setErrorMsg(null);
    if (!rows || rows.length === 0) {
      setErrorMsg('Tệp hoặc dữ liệu trống, không tìm thấy thông tin.');
      return;
    }

    // Filter out completely empty rows
    const nonEmptyRows = rows.filter((r) => r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''));
    if (nonEmptyRows.length === 0) {
      setErrorMsg('Không tìm thấy dòng dữ liệu nào hợp lệ.');
      return;
    }

    // Find header row or assume first row
    let headerIdx = -1;
    let nameCol = -1;
    let subjectCol = -1;
    let positionCol = -1;
    let emailCol = -1;
    let phoneCol = -1;

    for (let i = 0; i < Math.min(nonEmptyRows.length, 6); i++) {
      const row = nonEmptyRows[i].map((cell) => normalizeText(String(cell || '')));
      for (let j = 0; j < row.length; j++) {
        const val = row[j];
        if (val.includes('ho va ten') || val.includes('ho ten') || val === 'ten' || val.includes('giao vien') || val.includes('gv')) {
          if (nameCol === -1) nameCol = j;
        }
        if (val.includes('mon') || val.includes('bo mon') || val.includes('doi tuyen')) {
          if (subjectCol === -1) subjectCol = j;
        }
        if (val.includes('chuc vu') || val.includes('nhiem vu')) {
          if (positionCol === -1) positionCol = j;
        }
        if (val.includes('email') || val.includes('mail')) {
          if (emailCol === -1) emailCol = j;
        }
        if (val.includes('sdt') || val.includes('dien thoai') || val.includes('phone') || val.includes('lien he')) {
          if (phoneCol === -1) phoneCol = j;
        }
      }
      if (nameCol !== -1) {
        headerIdx = i;
        break;
      }
    }

    // If no header found, guess by typical columns:
    // Col 0: STT, Col 1: Name, Col 2: Position/Subject, Col 3: Subject/Position, Col 4: Email, Col 5: Phone
    const startRow = headerIdx !== -1 ? headerIdx + 1 : 0;
    if (nameCol === -1) {
      // Look at first row with data: if cell 0 is a number, cell 1 is probably name
      nameCol = 1;
      subjectCol = 2;
    }

    const results: TeacherAssignment[] = [];
    for (let r = startRow; r < nonEmptyRows.length; r++) {
      const row = nonEmptyRows[r];
      const rawName = String(row[nameCol] || '').trim();
      // Skip empty names, or header-like repetition
      if (!rawName || normalizeText(rawName).includes('ho va ten') || normalizeText(rawName).includes('giao vien')) {
        continue;
      }

      // Subject
      let rawSubject = subjectCol !== -1 && row[subjectCol] ? String(row[subjectCol]).trim() : '';
      if (!rawSubject && row.length > 2) {
        // try to find subject anywhere in row
        for (const cell of row) {
          const match = matchSubject(String(cell || ''), existingSubjects);
          if (match !== existingSubjects[0]) {
            rawSubject = match;
            break;
          }
        }
      }
      const subject = matchSubject(rawSubject, existingSubjects);

      // Position
      const rawPosition = positionCol !== -1 && row[positionCol] ? String(row[positionCol]).trim() : 'Giáo viên';
      const position = normalizePosition(rawPosition);

      // Email
      let email = emailCol !== -1 && row[emailCol] ? String(row[emailCol]).trim() : '';
      if (!email) {
        // Look for cell containing @
        const emailCell = row.find((cell) => String(cell || '').includes('@'));
        if (emailCell) {
          email = String(emailCell).trim();
        } else {
          // generate standardized placeholder email from teacher name
          const slug = normalizeText(rawName).replace(/\s+/g, '.');
          email = `${slug}@gmail.com`;
        }
      }

      // Phone
      let phone = phoneCol !== -1 && row[phoneCol] ? String(row[phoneCol]).trim() : '';
      if (!phone) {
        const phoneCell = row.find((cell) => /^[0-9]{9,11}$/.test(String(cell || '').replace(/[\s.-]/g, '')));
        if (phoneCell) {
          phone = String(phoneCell).trim();
        }
      }

      results.push({
        id: `gv_${Date.now()}_${r}`,
        teacherName: rawName,
        subject,
        position,
        email,
        phone,
      });
    }

    if (results.length === 0) {
      setErrorMsg('Không thể trích xuất được giáo viên nào từ tệp. Vui lòng kiểm tra lại định dạng cột.');
      return;
    }

    setFileName(sourceName);
    setParsedTeachers(results);
  };

  // Handle file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processRawRows(jsonData, file.name);
      } catch (err: any) {
        console.error('Error parsing file', err);
        setErrorMsg('Không thể đọc file Excel/CSV: ' + (err.message || 'Lỗi không xác định'));
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input so same file can be re-uploaded
    e.target.value = '';
  };

  // Handle paste parse
  const handleParseText = () => {
    if (!rawText.trim()) {
      setErrorMsg('Vui lòng dán nội dung danh sách vào ô trước.');
      return;
    }

    // Split into lines and then split tabs or commas or semicolons
    const lines = rawText.trim().split(/\r?\n/);
    const rows: string[][] = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(',')) return line.split(',');
      if (line.includes(';')) return line.split(';');
      if (line.includes(' - ')) return line.split(' - ');
      return line.split(/\s{2,}/); // 2 or more spaces
    });

    processRawRows(rows, 'Dữ liệu dán từ bảng');
  };

  // Remove a row from parsed preview
  const handleRemoveParsedRow = (idx: number) => {
    setParsedTeachers(parsedTeachers.filter((_, i) => i !== idx));
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (parsedTeachers.length === 0) return;
    onImport(parsedTeachers, importMode);
    onClose();
  };

  // Download template Excel file
  const handleDownloadTemplate = () => {
    const templateData = [
      ['STT', 'Họ và tên giáo viên', 'Chức vụ', 'Môn phụ trách', 'Email Google', 'Số điện thoại'],
      ['1', 'Võ Văn Dũng', 'Tổ trưởng', 'Sử', 'vandungtpdn1976@gmail.com', '0905890123'],
      ['2', 'Mai Thị Quỳ', 'Giáo viên', 'Địa lí', 'quy.mt@gmail.com', '0905901234'],
      ['3', 'Nguyễn Anh Tuấn', 'Tổ phó', 'Toán', 'tuan.na@gmail.com', '0905123001'],
      ['4', 'Nguyễn Thị Thúy', 'Giáo viên', 'Toán', 'thuy.nt@gmail.com', '0905123002'],
      ['5', 'Vũ Thanh Thủy', 'Tổ trưởng', 'Lí', 'thuy.vt@gmail.com', '0905123003'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachGV_HSG');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_Giao_Vien_HSG.xlsx');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-base font-bold">
                Cập Nhật Danh Sách Giáo Viên Ôn Thi HSG Từ File
              </h2>
              <p className="text-xs text-blue-200">
                Nhập từ tệp Excel (.xlsx, .xls), CSV hoặc dán trực tiếp bảng danh sách
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Template Download */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-blue-900 text-blue-950 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4 text-blue-700" />
              <span>1. Chọn File Excel / CSV (.xlsx, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'border-blue-900 text-blue-950 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clipboard className="w-4 h-4 text-amber-600" />
              <span>2. Dán Bảng Dữ Liệu Từ Excel / Word</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer py-1.5"
            title="Tải file mẫu Excel chuẩn"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải mẫu Excel chuẩn</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Bấm vào đây để chọn tệp Excel hoặc CSV từ máy tính
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ định dạng: <strong>.xlsx, .xls, .csv, .txt</strong>
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Gợi ý:</strong> File Excel có thể chứa các cột: <em>Họ và tên, Môn (Toán, Lí, Hóa, Sinh, Văn, Sử, Địa...), Chức vụ (Tổ trưởng, Tổ phó, GV), Email Google, Số điện thoại</em>. Hệ thống sẽ tự động nhận diện tiêu đề cột.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dán nội dung bảng danh sách giáo viên (Ctrl + V):
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Dán dữ liệu copy từ Excel hoặc Word vào đây, ví dụ:\n1\tNguyễn Anh Tuấn\tTổ phó\tToán\ttuan.na@gmail.com\t0905123001\n2\tVũ Thanh Thủy\tTổ trưởng\tLí\tthuy.vt@gmail.com\t0905123003\n3\tVõ Văn Dũng\tTổ trưởng\tSử\tvandungtpdn1976@gmail.com\t0905890123`}
                  className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900 bg-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Xử lý & Xem trước danh sách</span>
                </button>
              </div>
            </div>
          )}

          {/* Preview Parsed Results */}
          {parsedTeachers.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Đã nhận diện thành công: <strong className="text-blue-900">{parsedTeachers.length} giáo viên</strong> {fileName ? `(từ ${fileName})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setParsedTeachers([])}
                  className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Xóa kết quả đọc này
                </button>
              </div>

              {/* Mode Selection */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                <span className="font-bold text-amber-950 block">
                  Lựa chọn cách cập nhật danh sách vào app:
                </span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-blue-900"
                    />
                    <span>
                      Xóa các danh sách giáo viên trong app cũ & thay mới bằng danh sách này (Khuyên dùng)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-900"
                    />
                    <span>Thêm nối tiếp vào danh sách giáo viên hiện tại</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5 w-10 text-center">STT</th>
                      <th className="py-2 px-3">Họ và tên giáo viên</th>
                      <th className="py-2 px-3">Chức vụ</th>
                      <th className="py-2 px-3">Môn phụ trách</th>
                      <th className="py-2 px-3">Email Google</th>
                      <th className="py-2 px-3">Số ĐT</th>
                      <th className="py-2 px-2 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedTeachers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">
                          {t.teacherName}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className="text-[11px] text-slate-700">{t.position || 'Giáo viên'}</span>
                        </td>
                        <td className="py-1.5 px-3 font-bold text-blue-900">
                          {t.subject}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-slate-600 text-[11px]">
                          {t.email}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-slate-600 text-[11px]">
                          {t.phone || '-'}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveParsedRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-700 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Đóng
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={parsedTeachers.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                parsedTeachers.length > 0
                  ? 'bg-blue-900 hover:bg-blue-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {importMode === 'replace'
                  ? `Xóa danh sách cũ & Lưu ${parsedTeachers.length} GV mới vào App`
                  : `Thêm ${parsedTeachers.length} GV mới vào App`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
