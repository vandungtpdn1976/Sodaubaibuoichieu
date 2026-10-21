import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { LogPeriodEntry, SchoolConfig } from '../types';
import { getWeekDateRange, getDateForDayOfWeek } from './dateUtils';

const DAY_NAMES: Record<number, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ Nhật',
};

/**
 * Builds a single week worksheet in an ExcelJS workbook matching the exact school template
 */
export function buildWeekWorksheet(
  workbook: ExcelJS.Workbook,
  weekNumber: number,
  entries: LogPeriodEntry[],
  config: SchoolConfig
) {
  const sheetName = `Tuần ${weekNumber}`;
  const ws = workbook.addWorksheet(sheetName, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
      printTitlesRow: '2:4',
    },
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  // Column widths: Thứ 14, Tiết 6, Môn 14, PPCT 10, HS nghỉ 22, Tên bài 55, Ký tên 24
  ws.columns = [
    { key: 'col1', width: 14 }, // Thứ, ngày/tháng
    { key: 'col2', width: 6 },  // Tiết
    { key: 'col3', width: 14 }, // Môn học
    { key: 'col4', width: 10 }, // Tiết PPCT
    { key: 'col5', width: 22 }, // Tên HS nghỉ tiết
    { key: 'col6', width: 55 }, // Tên bài, nội dung công việc
    { key: 'col7', width: 24 }, // Ký tên
  ];

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  // Row 1: Title "Tuần n" (bold, 14pt)
  const row1 = ws.getRow(1);
  row1.getCell(1).value = `Tuần ${weekNumber}`;
  row1.getCell(1).font = { name: 'Times New Roman', size: 14, bold: true };
  row1.height = 28;

  // Header Titles (Rows 2 & 3 merged vertically per column)
  const headers = [
    'Thứ, ngày/tháng',
    'Tiết',
    'Môn học',
    'Tiết PPCT',
    'Tên HS nghỉ tiết',
    'Tên bài, nội dung công việc',
    'Ký tên',
  ];

  const row2 = ws.getRow(2);
  const row3 = ws.getRow(3);
  row2.height = 22;
  row3.height = 22;

  for (let c = 1; c <= 7; c++) {
    const colLetter = String.fromCharCode(64 + c);
    ws.mergeCells(`${colLetter}2:${colLetter}3`);

    const cell = ws.getCell(`${colLetter}2`);
    cell.value = headers[c - 1];
    cell.font = { name: 'Times New Roman', size: 12, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }, // Light gray
    };
    cell.border = borderThin;
    ws.getCell(`${colLetter}3`).border = borderThin;
  }

  // Row 4: Column Numbering 1 to 7
  const row4 = ws.getRow(4);
  row4.height = 18;
  for (let c = 1; c <= 7; c++) {
    const cell = row4.getCell(c);
    cell.value = c;
    cell.font = { name: 'Times New Roman', size: 11, bold: true, italic: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
    cell.border = borderThin;
  }

  // From Row 5: Grouped by day (Thứ 2 to Chủ Nhật)
  let currentRowIdx = 5;
  const days = [2, 3, 4, 5, 6, 7, 8];

  for (const dayNum of days) {
    const dayEntries = entries.filter((e) => Number(e.dayOfWeek) === Number(dayNum));
    // Find unique clusters for this day
    const clusterIndices = Array.from(
      new Set(dayEntries.map((e) => Number(e.clusterIndex) || 1))
    ).sort((a, b) => a - b);

    if (clusterIndices.length === 0) {
      clusterIndices.push(1);
    }

    const startRowForDay = currentRowIdx;
    const fallbackDate = getDateForDayOfWeek(weekNumber, config.weekOneStartDate, dayNum).dateStr;
    const dateStr = (dayEntries[0] && dayEntries[0].dateStr) ? dayEntries[0].dateStr : fallbackDate;

    // Each cluster has exactly 5 periods: 1..5
    for (const cIdx of clusterIndices) {
      for (let p = 1; p <= 5; p++) {
        const entry = dayEntries.find(
          (e) => (Number(e.clusterIndex) || 1) === cIdx && Number(e.period) === p
        );

        const r = ws.getRow(currentRowIdx);
        r.height = 24;

        // Col 2: Tiết
        const c2 = r.getCell(2);
        c2.value = p;
        c2.alignment = { vertical: 'middle', horizontal: 'center' };
        c2.font = { name: 'Times New Roman', size: 12, bold: true };
        c2.border = borderThin;

        // Col 3: Môn học
        const c3 = r.getCell(3);
        c3.value = entry?.subject || '';
        c3.alignment = { vertical: 'middle', horizontal: 'center' };
        c3.font = { name: 'Times New Roman', size: 12, bold: Boolean(entry?.subject) };
        c3.border = borderThin;

        // Col 4: Tiết PPCT
        const c4 = r.getCell(4);
        c4.value = entry?.ppctLesson ? Number(entry.ppctLesson) || entry.ppctLesson : '';
        c4.alignment = { vertical: 'middle', horizontal: 'center' };
        c4.font = { name: 'Times New Roman', size: 12 };
        c4.border = borderThin;

        // Col 5: Tên HS nghỉ tiết
        const c5 = r.getCell(5);
        if (entry && entry.absentCount > 0) {
          c5.value = `Vắng: ${entry.absentCount}${entry.absentStudents ? ` (${entry.absentStudents})` : ''}`;
        } else {
          c5.value = '';
        }
        c5.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        c5.font = { name: 'Times New Roman', size: 12 };
        c5.border = borderThin;

        // Col 6: Tên bài, nội dung công việc (widest)
        const c6 = r.getCell(6);
        c6.value = entry?.lessonTitle || '';
        c6.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        c6.font = { name: 'Times New Roman', size: 12 };
        c6.border = borderThin;

        // Col 7: Ký tên
        const c7 = r.getCell(7);
        c7.value = entry?.teacherSignature || '';
        c7.alignment = { vertical: 'middle', horizontal: 'center' };
        c7.font = { name: 'Times New Roman', size: 12 };
        c7.border = borderThin;

        // Col 1 default border
        const c1 = r.getCell(1);
        c1.border = borderThin;

        currentRowIdx++;
      }
    }

    const endRowForDay = currentRowIdx - 1;

    // Merge Column A for this day
    if (endRowForDay >= startRowForDay) {
      ws.mergeCells(`A${startRowForDay}:A${endRowForDay}`);
      const mergedDayCell = ws.getCell(`A${startRowForDay}`);
      mergedDayCell.value = `${DAY_NAMES[dayNum]}\n${dateStr}`;
      mergedDayCell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      mergedDayCell.font = { name: 'Times New Roman', size: 12, bold: true };
      mergedDayCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' },
      };

      for (let ri = startRowForDay; ri <= endRowForDay; ri++) {
        ws.getCell(`A${ri}`).border = borderThin;
      }
    }
  }

  // Footer: Signatures
  currentRowIdx += 2;
  const sigRow = ws.getRow(currentRowIdx);
  sigRow.height = 20;

  // Left: Tổ trưởng chuyên môn
  sigRow.getCell(2).value = 'TỔ TRƯỞNG CHUYÊN MÔN';
  sigRow.getCell(2).font = { name: 'Times New Roman', size: 12, bold: true };
  sigRow.getCell(2).alignment = { horizontal: 'center' };

  // Right: Phó Hiệu trưởng chuyên môn
  sigRow.getCell(6).value = 'PHÓ HIỆU TRƯỞNG CHUYÊN MÔN';
  sigRow.getCell(6).font = { name: 'Times New Roman', size: 12, bold: true };
  sigRow.getCell(6).alignment = { horizontal: 'center' };

  const subSigRow = ws.getRow(currentRowIdx + 1);
  subSigRow.getCell(2).value = '(Ký và ghi rõ họ tên)';
  subSigRow.getCell(2).font = { name: 'Times New Roman', size: 11, italic: true };
  subSigRow.getCell(2).alignment = { horizontal: 'center' };

  subSigRow.getCell(6).value = '(Ký, đóng dấu và ghi rõ họ tên)';
  subSigRow.getCell(6).font = { name: 'Times New Roman', size: 11, italic: true };
  subSigRow.getCell(6).alignment = { horizontal: 'center' };

  // Name row after signature spacing
  const nameRow = ws.getRow(currentRowIdx + 5);
  nameRow.getCell(6).value = 'PHẠM THẾ NAM';
  nameRow.getCell(6).font = { name: 'Times New Roman', size: 12, bold: true };
  nameRow.getCell(6).alignment = { horizontal: 'center' };
}

/**
 * Export current week to Excel (.xlsx) using ExcelJS
 */
export async function exportCurrentWeekToExcelJS(
  weekNumber: number,
  entries: LogPeriodEntry[],
  config: SchoolConfig
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.schoolName;
  workbook.lastModifiedBy = 'Sổ đầu bài HSG';
  workbook.created = new Date();
  workbook.modified = new Date();

  buildWeekWorksheet(workbook, weekNumber, entries, config);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `SỔ ĐẦU BÀI HỌC SINH GIỎI ${config.gradeLevel.toUpperCase()} - TUẦN ${weekNumber}.xlsx`);
}

/**
 * Export full semester (weeks 1 to 18) to a single multi-sheet Excel (.xlsx)
 */
export async function exportSemesterToExcelJS(
  currentWeekEntries: LogPeriodEntry[],
  currentWeekNum: number,
  config: SchoolConfig
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = config.schoolName;
  workbook.created = new Date();

  // Export weeks 1 to 18
  for (let w = 1; w <= 18; w++) {
    let weekData: LogPeriodEntry[] = [];
    if (w === currentWeekNum) {
      weekData = currentWeekEntries;
    } else {
      // Load cached from localStorage or generate
      const stored = localStorage.getItem(`sdb_week_${w}`);
      if (stored) {
        try {
          weekData = JSON.parse(stored);
        } catch (e) {
          weekData = [];
        }
      }
    }
    buildWeekWorksheet(workbook, w, weekData, config);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `SỔ ĐẦU BÀI HỌC SINH GIỎI ${config.gradeLevel.toUpperCase()} - CẢ HỌC KỲ.xlsx`);
}
