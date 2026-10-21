import React from 'react';
import { LogPeriodEntry, SchoolConfig } from '../types';
import { getCurrentDateVietnamese, getDateForDayOfWeek } from '../utils/dateUtils';

interface PrintA4ViewProps {
  currentWeek: number;
  fromDateStr: string;
  toDateStr: string;
  entries: LogPeriodEntry[];
  config: SchoolConfig;
}

export const PrintA4View: React.FC<PrintA4ViewProps> = ({
  currentWeek,
  fromDateStr,
  toDateStr,
  entries,
  config,
}) => {
  const dayNames: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ Nhật',
  };

  const days = [2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="print-page-container font-paper text-black bg-white p-2 sm:p-6 w-full max-w-[1400px] mx-auto text-[11pt]">
      {/* 1. Official Header */}
      <div className="flex items-start justify-between pb-2 border-b-2 border-black">
        <div className="text-center w-5/12">
          <p className="text-xs uppercase tracking-wide font-normal">
            {config.departmentName}
          </p>
          <p className="text-sm uppercase font-bold tracking-tight">
            {config.schoolName}
          </p>
          <div className="w-20 h-[1px] bg-black mx-auto my-0.5" />
          <p className="text-xs italic">Bồi dưỡng Học sinh giỏi {config.gradeLevel}</p>
        </div>

        <div className="text-center w-6/12">
          <p className="text-xs uppercase font-bold tracking-wider">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="text-xs font-bold underline underline-offset-4 decoration-1">
            Độc lập – Tự do – Hạnh phúc
          </p>
          <p className="text-xs italic mt-1 text-slate-700">
            {getCurrentDateVietnamese()}
          </p>
        </div>
      </div>

      {/* 2. Main Title */}
      <div className="text-center my-3">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-black">
          SỔ ĐẦU BÀI HỌC SINH GIỎI {config.gradeLevel.toUpperCase()}
        </h1>
        <div className="flex items-center justify-center gap-6 mt-1 text-sm font-semibold">
          <span>
            NĂM HỌC: <strong>{config.academicYear}</strong>
          </span>
          <span className="text-base font-bold underline">
            TUẦN {currentWeek}
          </span>
          <span>
            (Từ ngày <strong>{fromDateStr}</strong> đến ngày{' '}
            <strong>{toDateStr}</strong>)
          </span>
        </div>
      </div>

      {/* 3. The Official 7-column Table */}
      <table className="print-table w-full border-collapse border border-black text-[11pt] leading-tight my-2">
        <thead>
          <tr className="bg-slate-200 font-bold text-center text-black border-b border-black">
            <th className="border border-black p-1 w-[12%]">Thứ, ngày/tháng</th>
            <th className="border border-black p-1 w-[5%]">Tiết</th>
            <th className="border border-black p-1 w-[11%]">Môn học</th>
            <th className="border border-black p-1 w-[8%]">Tiết PPCT</th>
            <th className="border border-black p-1 w-[16%]">Tên HS nghỉ tiết</th>
            <th className="border border-black p-1 w-[34%]">Tên bài, nội dung công việc</th>
            <th className="border border-black p-1 w-[14%]">Ký tên</th>
          </tr>

          {/* Column Numbering 1 to 7 */}
          <tr className="bg-slate-100 font-bold text-center text-[10pt] border-b border-black">
            <th className="border border-black p-0.5 italic">(1)</th>
            <th className="border border-black p-0.5 italic">(2)</th>
            <th className="border border-black p-0.5 italic">(3)</th>
            <th className="border border-black p-0.5 italic">(4)</th>
            <th className="border border-black p-0.5 italic">(5)</th>
            <th className="border border-black p-0.5 italic">(6)</th>
            <th className="border border-black p-0.5 italic">(7)</th>
          </tr>
        </thead>

        <tbody>
          {days.map((dayNum) => {
            const dayEntries = entries.filter((e) => Number(e.dayOfWeek) === Number(dayNum));

            const clusterMap: Record<number, LogPeriodEntry[]> = {};
            for (const e of dayEntries) {
              const cIdx = Number(e.clusterIndex) || 1;
              if (!clusterMap[cIdx]) clusterMap[cIdx] = [];
              clusterMap[cIdx].push(e);
            }

            const clusterIndices = Object.keys(clusterMap)
              .map(Number)
              .sort((a, b) => a - b);

            if (clusterIndices.length === 0) {
              clusterIndices.push(1);
            }

            const dayTotalRows = clusterIndices.length * 5;
            const fallbackDate = getDateForDayOfWeek(
              currentWeek,
              config.weekOneStartDate,
              dayNum
            ).dateStr;
            const firstEntry = dayEntries[0];
            const dateStr = (firstEntry && firstEntry.dateStr) ? firstEntry.dateStr : fallbackDate;

            let dayRowCounter = 0;

            return clusterIndices.map((cIdx) => {
              const cRows = clusterMap[cIdx] || [];

              return (
                <React.Fragment key={`${dayNum}_cluster_${cIdx}`}>
                  {[1, 2, 3, 4, 5].map((pNum) => {
                    const isDayFirstRow = dayRowCounter === 0;
                    dayRowCounter++;

                    const entry = cRows.find((r) => Number(r.period) === Number(pNum));

                    return (
                      <tr
                        key={`print_${dayNum}_${cIdx}_${pNum}`}
                        className="border-b border-black text-black"
                        style={{ pageBreakInside: 'avoid' }}
                      >
                        {/* Cột 1: Thứ, ngày/tháng (Rowspan toàn bộ dòng trong ngày) */}
                        {isDayFirstRow && (
                          <td
                            rowSpan={dayTotalRows}
                            className="border border-black text-center align-middle p-1 font-bold bg-white"
                          >
                            <div className="text-base">{dayNames[dayNum]}</div>
                            <div className="text-[10pt] font-mono mt-0.5 font-normal">{dateStr}</div>
                          </td>
                        )}

                        {/* Cột 2: Tiết (1, 2, 3, 4, 5) */}
                        <td className="border border-black text-center align-middle p-1 font-bold">
                          {pNum}
                        </td>

                        {/* Cột 3: Môn học */}
                        <td className="border border-black text-center align-middle p-1 font-bold">
                          {entry?.subject || ''}
                        </td>

                        {/* Cột 4: Tiết PPCT */}
                        <td className="border border-black text-center align-middle p-1 font-mono">
                          {entry?.ppctLesson || ''}
                        </td>

                        {/* Cột 5: Tên HS nghỉ tiết */}
                        <td className="border border-black text-left align-middle p-1 text-[10pt]">
                          {entry && entry.absentCount > 0 ? (
                            <span className="font-medium">
                              Vắng: {entry.absentCount}
                              {entry.absentStudents ? ` (${entry.absentStudents})` : ''}
                            </span>
                          ) : (
                            ''
                          )}
                        </td>

                        {/* Cột 6: Tên bài, nội dung công việc */}
                        <td className="border border-black text-left align-middle p-1 leading-snug">
                          {entry?.lessonTitle || ''}
                        </td>

                        {/* Cột 7: Ký tên */}
                        <td className="border border-black text-center align-middle p-1 text-[10.5pt] font-semibold">
                          {entry?.teacherSignature || ''}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            });
          })}
        </tbody>
      </table>

      {/* 4. Official Signatures at bottom */}
      <div className="mt-6 pt-2 grid grid-cols-2 gap-8 text-center text-xs leading-normal">
        <div>
          <p className="font-bold uppercase text-[11pt]">TỔ TRƯỞNG CHUYÊN MÔN</p>
          <p className="italic text-[10pt] text-slate-600">(Ký và ghi rõ họ tên)</p>
          <div className="h-20" />
        </div>

        <div>
          <p className="italic text-[10pt]">
            Bình Phước, {getCurrentDateVietnamese()}
          </p>
          <p className="font-bold uppercase mt-0.5 text-[11pt]">PHÓ HIỆU TRƯỞNG CHUYÊN MÔN</p>
          <p className="italic text-[10pt] text-slate-600">
            (Ký, đóng dấu và ghi rõ họ tên)
          </p>
          <div className="h-20" />
          <p className="font-bold uppercase text-[11pt]">PHẠM THẾ NAM</p>
        </div>
      </div>

      {/* 5. Page number mark */}
      <div className="mt-3 text-right text-[9pt] italic text-slate-600">
        Trang 1/1 · Sổ đầu bài Học sinh giỏi {config.gradeLevel}
      </div>
    </div>
  );
};
