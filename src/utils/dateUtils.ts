/**
 * Date utility functions for School Logbook weeks and dates
 */

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getWeekDateRange(weekNumber: number, weekOneStartDateStr: string) {
  const week1Start = parseISODate(weekOneStartDateStr);
  const daysOffset = (weekNumber - 1) * 7;
  
  const monday = new Date(week1Start);
  monday.setDate(week1Start.getDate() + daysOffset);

  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    monday,
    saturday,
    sunday,
    fromStr: formatDDMMYYYY(monday),
    toStr: formatDDMMYYYY(sunday),
    toSaturdayStr: formatDDMMYYYY(saturday),
  };
}

export function getDateForDayOfWeek(
  weekNumber: number,
  weekOneStartDateStr: string,
  dayOfWeek: number // 2 = Thứ Hai, 3 = Thứ Ba, ..., 7 = Thứ Bảy, 8 = Chủ Nhật
): { date: Date; dateStr: string; dayName: string; dayShort: string } {
  const { monday } = getWeekDateRange(weekNumber, weekOneStartDateStr);
  const targetDate = new Date(monday);
  // dayOfWeek: 2 -> offset 0; 3 -> offset 1 ... 7 -> offset 5; 8 -> offset 6 (Chủ Nhật)
  const offset = Math.max(0, Math.min(6, dayOfWeek - 2));
  targetDate.setDate(monday.getDate() + offset);

  const dayNames: Record<number, string> = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
    8: 'Chủ Nhật',
  };

  return {
    date: targetDate,
    dateStr: formatDDMMYYYY(targetDate),
    dayName: dayNames[dayOfWeek] || (dayOfWeek === 8 ? 'Chủ Nhật' : `Thứ ${dayOfWeek}`),
    dayShort: dayOfWeek === 8 ? 'CN' : String(dayOfWeek),
  };
}

export function getCurrentDateVietnamese(): string {
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  return `ngày ${d < 10 ? '0' + d : d} tháng ${m < 10 ? '0' + m : m} năm ${y}`;
}

/**
 * Calculates the current academic week number (1 to 35) based on school start date (YYYY-MM-DD)
 * and the current local date (Vietnam time).
 */
export function calculateCurrentWeekFromStartDate(weekOneStartDateStr: string): number {
  try {
    const week1Start = parseISODate(weekOneStartDateStr);
    const now = new Date();
    // Normalize both to midnight
    const startMidnight = new Date(week1Start.getFullYear(), week1Start.getMonth(), week1Start.getDate());
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = todayMidnight.getTime() - startMidnight.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 1; // Before start date, default to Week 1
    }

    const calculatedWeek = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(35, calculatedWeek));
  } catch (err) {
    console.warn('Could not calculate current week from start date', err);
    return 5; // Fallback
  }
}

