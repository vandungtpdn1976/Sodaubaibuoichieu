/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LogPeriodEntry,
  SchoolConfig,
  TeacherAssignment,
  Student,
  CurrentUser,
} from './types';
import {
  DEFAULT_CONFIG,
  DEFAULT_TEACHERS,
  DEFAULT_STUDENTS,
  DEFAULT_CURRENT_USER,
  checkIsAdmin,
} from './constants/initialData';
import {
  getWeekDateRange,
  getDateForDayOfWeek,
  calculateCurrentWeekFromStartDate,
} from './utils/dateUtils';
import { ApiService } from './services/apiService';
import { exportCurrentWeekToExcelJS, exportSemesterToExcelJS } from './utils/excelExport';

import { Header } from './components/Header';
import { WeekToolbar } from './components/WeekToolbar';
import { SoDauBaiTable } from './components/SoDauBaiTable';
import { QuickEntryModal } from './components/QuickEntryModal';
import { AbsentModal } from './components/AbsentModal';
import { PrintA4View } from './components/PrintA4View';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { StatisticsModal } from './components/StatisticsModal';
import { ShareModal } from './components/ShareModal';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';

import {
  AlertCircle,
  CheckCircle,
  FileText,
  Lock,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SchoolConfig>(() => ApiService.loadConfig());
  const [currentWeek, setCurrentWeek] = useState<number>(() =>
    calculateCurrentWeekFromStartDate(ApiService.loadConfig().weekOneStartDate)
  );
  const [teachers, setTeachers] = useState<TeacherAssignment[]>(() =>
    ApiService.loadTeachers()
  );
  const [students, setStudents] = useState<Student[]>(() =>
    ApiService.loadStudents()
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() =>
    ApiService.loadCurrentUser()
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    ApiService.checkIsAuthenticated()
  );
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [isFirstLoginChange, setIsFirstLoginChange] = useState<boolean>(false);

  const handleLogout = useCallback(() => {
    ApiService.logout();
    setIsAuthenticated(false);
  }, []);

  const [entries, setEntries] = useState<LogPeriodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickEntryInitialDay, setQuickEntryInitialDay] = useState<number>(3); // Default Thứ 3

  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [statisticsInitialTab, setStatisticsInitialTab] = useState<'currentWeek' | 'allWeeks' | 'storageInfo'>('currentWeek');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAppsScriptOpen, setIsAppsScriptOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [absentModalEntry, setAbsentModalEntry] = useState<LogPeriodEntry | null>(
    null
  );

  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ type, message });
      setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  const handleSelectUser = useCallback(
    (user: CurrentUser) => {
      const isDung = user.email.toLowerCase() === 'vandungtpdn1976@gmail.com';
      const isAdminUser = checkIsAdmin(user.email);
      const updated: CurrentUser = isAdminUser
        ? {
            ...user,
            name: isDung ? 'Thầy Võ Văn Dũng' : user.name,
            role: 'admin',
            assignedSubject: isDung ? (user.assignedSubject || 'Sử') : user.assignedSubject,
            position: isDung ? (user.position || 'Tổ trưởng') : user.position,
          }
        : user;

      setCurrentUser(updated);
      ApiService.saveCurrentUser(updated);

      // Reset filters when switching to SUPER_ADMIN / Admin to ensure full visibility
      if (isAdminUser) {
        setSelectedTeacherFilter('');
        setSelectedSubjectFilter('');
        setSearchQuery('');
      }

      showToast(
        `Đã kích hoạt tài khoản: ${updated.name} (${
          isDung
            ? 'Quản trị viên BGH & GV Môn Sử (Hiển thị toàn trường)'
            : updated.role === 'admin'
            ? 'Phó Hiệu trưởng chuyên môn / Quản trị viên'
            : `GV Môn ${updated.assignedSubject || ''}`
        })`,
        'success'
      );
    },
    [showToast]
  );

  const weekDates = useMemo(() => {
    return getWeekDateRange(currentWeek, config.weekOneStartDate);
  }, [currentWeek, config.weekOneStartDate]);

  const isCurrentWeekLocked = Boolean(config.lockedWeeks[currentWeek]);

  const loadCurrentWeek = useCallback(
    async (weekNum: number) => {
      setLoading(true);
      try {
        const data = await ApiService.loadWeekData(weekNum, config);
        setEntries(data);
      } catch (e) {
        console.error('Error loading week data', e);
        showToast('Không thể tải dữ liệu tuần, vui lòng thử lại', 'error');
      } finally {
        setLoading(false);
      }
    },
    [config, showToast]
  );

  useEffect(() => {
    loadCurrentWeek(currentWeek);
    // Reset filters for Admin when switching weeks so no teacher entries are hidden
    if (currentUser.role === 'admin' || checkIsAdmin(currentUser.email)) {
      setSelectedTeacherFilter('');
      setSelectedSubjectFilter('');
      setSearchQuery('');
    }
  }, [currentWeek, loadCurrentWeek, currentUser.email, currentUser.role]);

  // Sync initial config & teachers from central server
  useEffect(() => {
    ApiService.fetchServerConfig().then((serverCfg) => {
      if (serverCfg) setConfig(serverCfg);
    });
    ApiService.fetchServerTeachers().then((serverTeachers) => {
      if (serverTeachers && serverTeachers.length > 0) setTeachers(serverTeachers);
    });
  }, []);

  // Real-time automatic background polling so Admin and all teachers see newly entered PPCT & lessons instantly
  useEffect(() => {
    let isSubscribed = true;

    const syncLatest = async () => {
      try {
        const remoteEntries = await ApiService.pollWeekData(currentWeek);
        if (!isSubscribed || !remoteEntries) return;
        setEntries((prev) => {
          // Only update if changed to avoid unnecessary re-renders
          if (JSON.stringify(prev) !== JSON.stringify(remoteEntries)) {
            return remoteEntries;
          }
          return prev;
        });
      } catch {
        // Ignore background polling errors
      }
    };

    // Poll every 4 seconds
    const intervalId = setInterval(syncLatest, 4000);

    // Sync immediately when browser window regains focus
    const handleFocus = () => syncLatest();
    window.addEventListener('focus', handleFocus);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentWeek]);

  // Handle URL query parameters (e.g. ?week=5, ?subject=Toán, ?open=quick, ?teacher=...)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const weekParam = params.get('week');
      if (weekParam) {
        const w = parseInt(weekParam, 10);
        if (w >= 1 && w <= 35) {
          setCurrentWeek(w);
        }
      }

      const subjectParam = params.get('subject');
      if (subjectParam) {
        setSelectedSubjectFilter(subjectParam);
      }

      const teacherParam = params.get('teacher');
      if (teacherParam && teachers.length > 0) {
        const found = teachers.find(
          (t) =>
            t.teacherName.toLowerCase() === teacherParam.toLowerCase() ||
            t.email.toLowerCase() === teacherParam.toLowerCase()
        );
        if (found) {
          handleSelectUser({
            name: found.teacherName,
            email: found.email,
            role: 'teacher',
            assignedSubject: found.subject,
          });
        }
      }

      const openParam = params.get('open');
      if (openParam === 'quick') {
        const dayParam = params.get('day');
        if (dayParam) {
          const d = parseInt(dayParam, 10);
          if (d >= 2 && d <= 7) setQuickEntryInitialDay(d);
        }
        setIsQuickEntryOpen(true);
      }
    } catch (e) {
      console.warn('Could not parse query parameters', e);
    }
  }, [teachers, handleSelectUser]);

  // Handle saving 1 period entry
  const handleSaveEntry = async (updatedEntry: LogPeriodEntry) => {
    let finalEntry = { ...updatedEntry };
    if (finalEntry.teacherSignature && !finalEntry.teacherEmail) {
      const matched = teachers.find(
        (t) => t.teacherName.toLowerCase() === finalEntry.teacherSignature.trim().toLowerCase()
      );
      if (matched) {
        finalEntry.teacherEmail = matched.email;
      }
    }

    setEntries((prev) => {
      const uDay = Number(finalEntry.dayOfWeek);
      const uCluster = Number(finalEntry.clusterIndex || 1);
      const uPeriod = Number(finalEntry.period);
      const idx = prev.findIndex(
        (e) =>
          e.id === finalEntry.id ||
          (Number(e.dayOfWeek) === uDay &&
            Number(e.clusterIndex || 1) === uCluster &&
            Number(e.period) === uPeriod)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = finalEntry;
        return next;
      }
      return [...prev, finalEntry];
    });

    const res = await ApiService.savePeriodEntry(finalEntry, config);
    if (res.error) {
      showToast(res.error, 'info');
    } else {
      showToast(
        `Đã lưu Tiết ${finalEntry.period} (${
          finalEntry.subject ? `Môn ${finalEntry.subject}` : 'Thành công'
        })!`,
        'success'
      );
    }
  };

  // Handle adding a new 5-period cluster to a day
  const handleAddCluster = async (dayOfWeek: number) => {
    if (isCurrentWeekLocked) {
      showToast('Sổ đầu bài đã bị khóa.', 'error');
      return;
    }

    const { dateStr } = getDateForDayOfWeek(
      currentWeek,
      config.weekOneStartDate,
      dayOfWeek
    );

    const dayEntries = entries.filter((e) => Number(e.dayOfWeek) === Number(dayOfWeek));
    const maxCluster = dayEntries.reduce((max, r) => Math.max(max, Number(r.clusterIndex) || 1), 0);
    const newClusterIdx = maxCluster + 1;

    const newRows: LogPeriodEntry[] = [];
    for (let p = 1; p <= 5; p++) {
      newRows.push({
        id: `w${currentWeek}_d${dayOfWeek}_c${newClusterIdx}_p${p}`,
        weekNumber: Number(currentWeek),
        dayOfWeek: Number(dayOfWeek),
        dateStr,
        clusterIndex: Number(newClusterIdx),
        period: Number(p),
        subject: '',
        ppctLesson: '',
        absentCount: 0,
        absentStudents: '',
        lessonTitle: '',
        teacherSignature: '',
        teacherEmail: '',
        updatedAt: '',
      });
    }

    const updated = [...entries, ...newRows];
    setEntries(updated);
    await ApiService.saveWeekData(currentWeek, updated, config);
    showToast(`Đã thêm cụm 5 tiết mới cho Thứ ${dayOfWeek}!`, 'success');
  };

  // Handle deleting a cluster (5 rows)
  const handleDeleteCluster = async (dayOfWeek: number, clusterIndex: number) => {
    if (isCurrentWeekLocked) {
      showToast('Sổ đầu bài đã bị khóa.', 'error');
      return;
    }

    if (
      window.confirm(
        `Xác nhận xóa toàn bộ Cụm môn ${clusterIndex} của Thứ ${dayOfWeek}?`
      )
    ) {
      const remaining = entries.filter(
        (e) =>
          !(
            Number(e.dayOfWeek) === Number(dayOfWeek) &&
            (Number(e.clusterIndex) || 1) === Number(clusterIndex)
          )
      );
      setEntries(remaining);
      await ApiService.deleteCluster(currentWeek, dayOfWeek, clusterIndex, config);
      showToast(`Đã xóa Cụm môn ${clusterIndex}!`, 'info');
    }
  };

  // Quick Batch Entry callback
  const handleApplyBatch = async (newEntries: LogPeriodEntry[]) => {
    setEntries(newEntries);
    await ApiService.saveWeekData(currentWeek, newEntries, config);
    showToast('Đã áp dụng và lưu nhanh các tiết dạy thành công!', 'success');
  };

  // Toggle Week Lock (Admin only)
  const handleToggleLock = async () => {
    if (currentUser.role !== 'admin') {
      showToast('Chỉ Ban giám hiệu mới có quyền khóa sổ.', 'error');
      return;
    }
    const newLockedState = !isCurrentWeekLocked;
    const newConfig = await ApiService.toggleLockWeek(
      currentWeek,
      newLockedState,
      config
    );
    setConfig(newConfig);
    showToast(
      newLockedState
        ? `Đã khóa Tuần ${currentWeek}. Giáo viên không thể sửa dữ liệu nữa.`
        : `Đã mở khóa Tuần ${currentWeek}. Giáo viên có thể nhập điểm và nội dung.`,
      newLockedState ? 'info' : 'success'
    );
  };

  const handlePrintNative = () => {
    window.print();
  };

  // Export current week using ExcelJS
  const handleExportWeekExcel = async () => {
    try {
      showToast('Đang kết xuất file Excel đúng biểu mẫu...', 'info');
      await exportCurrentWeekToExcelJS(currentWeek, entries, config);
      showToast(`Đã xuất file Excel Tuần ${currentWeek} thành công!`, 'success');
    } catch (e) {
      console.error('Excel export error', e);
      showToast('Có lỗi xảy ra khi tạo tệp Excel.', 'error');
    }
  };

  // Export full semester using ExcelJS
  const handleExportSemesterExcel = async () => {
    try {
      showToast('Đang kết xuất toàn bộ học kỳ (Tuần 1 - 18)...', 'info');
      await exportSemesterToExcelJS(entries, currentWeek, config);
      showToast('Đã xuất file Excel cả học kỳ thành công!', 'success');
    } catch (e) {
      console.error('Semester Excel export error', e);
      showToast('Có lỗi khi tạo tệp Excel cả học kỳ.', 'error');
    }
  };

  const handleSaveAbsent = async (count: number, studentsStr: string) => {
    if (!absentModalEntry) return;
    const updated: LogPeriodEntry = {
      ...absentModalEntry,
      absentCount: count,
      absentStudents: studentsStr,
      updatedAt: new Date().toLocaleString('vi-VN'),
    };
    await handleSaveEntry(updated);
    setAbsentModalEntry(null);
  };

  const handleSaveConfig = (newConfig: SchoolConfig) => {
    setConfig(newConfig);
    ApiService.saveConfig(newConfig);
    showToast('Đã lưu cấu hình trường học thành công!', 'success');
  };

  const handleSaveTeachers = async (newTeachers: TeacherAssignment[]) => {
    setTeachers(newTeachers);
    await ApiService.saveTeachers(newTeachers);

    // Cascade updated emails to in-memory week entries
    setEntries((prev) => {
      let changed = false;
      const updated = prev.map((entry) => {
        if (!entry.teacherSignature) return entry;
        const matched = newTeachers.find(
          (t) => t.teacherName.trim().toLowerCase() === entry.teacherSignature.trim().toLowerCase()
        );
        if (matched && matched.email && matched.email !== entry.teacherEmail) {
          changed = true;
          return { ...entry, teacherEmail: matched.email };
        }
        return entry;
      });
      if (changed) {
        ApiService.saveWeekData(currentWeek, updated, config);
        return updated;
      }
      return prev;
    });

    // Update currentUser if currently selected as an updated teacher
    if (currentUser.role === 'teacher') {
      const currentMatched = newTeachers.find(
        (t) => t.teacherName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      );
      if (currentMatched && currentMatched.email !== currentUser.email) {
        handleSelectUser({
          ...currentUser,
          email: currentMatched.email,
          assignedSubject: currentMatched.subject,
        });
      }
    }

    showToast('Đã lưu và cập nhật Gmail của từng giáo viên thành công!', 'success');
  };

  const handleSaveStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    ApiService.saveStudents(newStudents);
    showToast('Đã cập nhật danh sách học sinh đội tuyển!', 'success');
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (selectedSubjectFilter && e.subject !== selectedSubjectFilter) {
        return false;
      }
      if (selectedTeacherFilter) {
        if (selectedTeacherFilter === 'my_periods') {
          const sig = (e.teacherSignature || '').toLowerCase();
          const email = (e.teacherEmail || '').toLowerCase();
          const isMySig = sig.includes('dũng') || sig.includes('võ văn dũng');
          const isMyEmail = email === 'vandungtpdn1976@gmail.com';
          const isMySubj = e.subject === 'Sử';
          if (!isMySig && !isMyEmail && !isMySubj) {
            return false;
          }
        } else {
          const target = selectedTeacherFilter.toLowerCase().trim();
          const sig = (e.teacherSignature || '').toLowerCase().trim();
          const email = (e.teacherEmail || '').toLowerCase().trim();
          if (sig !== target && email !== target && !sig.includes(target)) {
            return false;
          }
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.lessonTitle?.toLowerCase().includes(q);
        const matchSubject = e.subject?.toLowerCase().includes(q);
        const matchTeacher = e.teacherSignature?.toLowerCase().includes(q);
        const matchAbsent = e.absentStudents?.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchTeacher && !matchAbsent) {
          return false;
        }
      }
      return true;
    });
  }, [entries, selectedSubjectFilter, selectedTeacherFilter, searchQuery]);

  const handleSyncFromSheets = async () => {
    showToast('Đang kết nối và đồng bộ toàn bộ sổ đầu bài từ Google Sheets...', 'info');
    const res = await ApiService.syncFromSheets();
    if (res.success) {
      showToast(res.message, 'success');
      loadCurrentWeek(currentWeek);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handlePushWeeks1To7 = useCallback(async () => {
    showToast('Đang lưu và đẩy toàn bộ dữ liệu từ Tuần 1 đến Tuần 7 sang Google Sheets...', 'info');
    const res = await ApiService.pushWeeksToSheets(1, 7, config);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  }, [config, showToast]);

  // Trigger automatic sync/push of Weeks 1 to 7 to Google Sheets if scriptUrl is configured
  useEffect(() => {
    if (config.scriptUrl && config.scriptUrl.trim()) {
      ApiService.pushWeeksToSheets(1, 7, config).then((res) => {
        if (res.success) {
          console.log('Successfully pushed Weeks 1-7 to Google Sheets:', res.message);
        }
      });
    }
  }, [config.scriptUrl]);

  if (!isAuthenticated) {
    return (
      <LoginModal
        onLoginSuccess={(user, isFirstLogin) => {
          setCurrentUser(user);
          if (isFirstLogin) {
            setIsFirstLoginChange(true);
            setShowChangePasswordModal(true);
          } else {
            setIsAuthenticated(true);
            showToast(`Xác thực thành công: ${user.name}!`, 'success');
          }
        }}
        configSchoolName={config.schoolName}
        configAcademicYear={config.academicYear}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* 1. Header Navigation Bar */}
      <Header
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        teachers={teachers}
        config={config}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        onOpenStatistics={() => {
          setStatisticsInitialTab('currentWeek');
          setIsStatisticsOpen(true);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAppsScript={() => setIsAppsScriptOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        activeTab="table"
        setActiveTab={() => {}}
        onLogout={handleLogout}
        onChangePasswordClick={() => {
          setIsFirstLoginChange(false);
          setShowChangePasswordModal(true);
        }}
      />

      {/* 2. Week Selection & Toolbar */}
      <WeekToolbar
        currentWeek={currentWeek}
        onSelectWeek={setCurrentWeek}
        fromDateStr={weekDates.fromStr}
        toDateStr={weekDates.toStr}
        config={config}
        isLocked={isCurrentWeekLocked}
        onToggleLock={handleToggleLock}
        currentUser={currentUser}
        selectedSubjectFilter={selectedSubjectFilter}
        onSelectSubjectFilter={setSelectedSubjectFilter}
        teachers={teachers}
        selectedTeacherFilter={selectedTeacherFilter}
        onSelectTeacherFilter={setSelectedTeacherFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQuickEntry={() => {
          setQuickEntryInitialDay(3);
          setIsQuickEntryOpen(true);
        }}
        onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
        onPrintNative={handlePrintNative}
        onExportWeekExcel={handleExportWeekExcel}
        onExportSemesterExcel={handleExportSemesterExcel}
        onOpenAllWeeksOverview={() => {
          setStatisticsInitialTab('allWeeks');
          setIsStatisticsOpen(true);
        }}
        onSyncFromSheets={handleSyncFromSheets}
        onPushWeeks1To7={handlePushWeeks1To7}
      />

      {/* 3. Main Workspace Area */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Admin Live Overview Banner */}
        {currentUser.role === 'admin' && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-emerald-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {currentUser.email.toLowerCase() === 'vandungtpdn1976@gmail.com'
                      ? 'Quản trị viên (BGH) kiêm Tổ trưởng Môn Sử: Thầy Võ Văn Dũng'
                      : `Quản trị viên: ${currentUser.name}`}
                  </span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Đồng bộ máy chủ trung tâm
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Tài khoản của bạn vừa là Giáo viên được phân công (Môn Sử) vừa làm nhiệm vụ Quản trị viên. Toàn bộ các tiết dạy, bài học, học sinh vắng và chữ ký của tất cả các giáo viên trong tuần được hiển thị đầy đủ ngay bên dưới.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {currentUser.email.toLowerCase() === 'vandungtpdn1976@gmail.com' && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTeacherFilter(
                      selectedTeacherFilter === 'my_periods' ? '' : 'my_periods'
                    )
                  }
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs ${
                    selectedTeacherFilter === 'my_periods'
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title="Lọc nhanh xem riêng các tiết dạy Môn Sử của Thầy Võ Văn Dũng"
                >
                  <span>⭐ Tiết Môn Sử của tôi</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStatisticsInitialTab('allWeeks');
                  setIsStatisticsOpen(true);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-200" />
                <span>Tiến độ 35 tuần</span>
              </button>
              {selectedTeacherFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedTeacherFilter('')}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  ✕ Bỏ lọc GV (Xem tất cả)
                </button>
              )}
              {selectedSubjectFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedSubjectFilter('')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  ✕ Bỏ lọc môn (Xem tất cả)
                </button>
              )}
            </div>
          </div>
        )}

        {isCurrentWeekLocked && (
          <div className="mb-4 p-3.5 bg-red-100/80 border-2 border-red-500 rounded-xl flex items-center justify-between text-red-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-red-700 shrink-0" />
              <div>
                <strong className="text-sm font-extrabold uppercase tracking-wide">
                  Sổ đầu bài đã bị khoá
                </strong>
                <p className="text-xs text-red-800 mt-0.5">
                  Ban Giám hiệu đã duyệt và khóa sổ Tuần {currentWeek}. Mọi ô nhập liệu
                  đều đã bị vô hiệu hóa để bảo đảm tính pháp lý.
                </p>
              </div>
            </div>
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={handleToggleLock}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer shrink-0 ml-3"
              >
                Mở khóa ngay
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
            <Loader2 className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Đang tải dữ liệu Sổ đầu bài Tuần {currentWeek}...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Đang tải biểu mẫu 7 cột Sổ đầu bài {config.gradeLevel}
            </p>
          </div>
        ) : (
          <SoDauBaiTable
            entries={entries}
            currentWeek={currentWeek}
            fromDateStr={weekDates.fromStr}
            toDateStr={weekDates.toStr}
            config={config}
            isLocked={isCurrentWeekLocked}
            currentUser={currentUser}
            teachers={teachers}
            onSaveEntry={handleSaveEntry}
            onDeleteCluster={handleDeleteCluster}
            onAddCluster={handleAddCluster}
            onOpenQuickEntryForDay={(day) => {
              setQuickEntryInitialDay(day);
              setIsQuickEntryOpen(true);
            }}
            onOpenAbsentModal={(e) => setAbsentModalEntry(e)}
            filteredEntries={filteredEntries}
            selectedTeacherFilter={selectedTeacherFilter}
            onSelectTeacherFilter={setSelectedTeacherFilter}
            selectedSubjectFilter={selectedSubjectFilter}
            onSelectSubjectFilter={setSelectedSubjectFilter}
            searchQuery={searchQuery}
          />
        )}

        {/* Footer Bar */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-900" />
            <span>
              Biểu mẫu: <strong>Sổ đầu bài Học sinh giỏi {config.gradeLevel}</strong> · 7 cột chuẩn · Mỗi cụm gồm 5 tiết (1 - 5)
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>
              Đang đăng nhập:{' '}
              <strong className="text-slate-800">{currentUser.name}</strong> (
              {currentUser.role === 'admin'
                ? 'Phó Hiệu trưởng chuyên môn'
                : `GV Môn ${currentUser.assignedSubject || 'Tự do'}`}
              )
            </span>
            <button
              type="button"
              onClick={() => setIsAppsScriptOpen(true)}
              className="text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Mã Google Apps Script (2 lớp)</span>
            </button>
          </div>
        </div>
      </main>

      {/* 4. Dedicated Print Container for Direct Printing (@media print) */}
      <div className="print-only hidden">
        <PrintA4View
          currentWeek={currentWeek}
          fromDateStr={weekDates.fromStr}
          toDateStr={weekDates.toStr}
          entries={entries}
          config={config}
        />
      </div>

      {/* 5. Modals */}
      {/* Quick Batch Entry Modal */}
      {isQuickEntryOpen && (
        <QuickEntryModal
          isOpen={isQuickEntryOpen}
          onClose={() => setIsQuickEntryOpen(false)}
          currentWeek={currentWeek}
          config={config}
          teachers={teachers}
          currentUser={currentUser}
          entries={entries}
          onApplyBatch={handleApplyBatch}
          initialDay={quickEntryInitialDay}
        />
      )}

      {/* Absent Students Picker Modal */}
      {absentModalEntry && (
        <AbsentModal
          isOpen={Boolean(absentModalEntry)}
          onClose={() => setAbsentModalEntry(null)}
          dayName={`Thứ ${absentModalEntry.dayOfWeek}`}
          periodNumber={absentModalEntry.period}
          subjectName={absentModalEntry.subject}
          initialAbsentCount={absentModalEntry.absentCount}
          initialAbsentStudents={absentModalEntry.absentStudents}
          studentsList={students}
          onSave={handleSaveAbsent}
        />
      )}

      {/* Print Preview Modal */}
      {isPrintPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          currentWeek={currentWeek}
          fromDateStr={weekDates.fromStr}
          toDateStr={weekDates.toStr}
          entries={entries}
          config={config}
          onPrintNative={handlePrintNative}
        />
      )}

      {/* Statistics Modal */}
      {isStatisticsOpen && (
        <StatisticsModal
          isOpen={isStatisticsOpen}
          onClose={() => setIsStatisticsOpen(false)}
          currentWeek={currentWeek}
          fromDateStr={weekDates.fromStr}
          toDateStr={weekDates.toStr}
          entries={entries}
          config={config}
          onSelectWeek={(w) => {
            setCurrentWeek(w);
            setIsStatisticsOpen(false);
          }}
          initialTab={statisticsInitialTab}
        />
      )}

      {/* Admin / School Configuration Modal */}
      {isAdminOpen && (
        <AdminPanelModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
          teachers={teachers}
          onSaveTeachers={handleSaveTeachers}
          students={students}
          onSaveStudents={handleSaveStudents}
          onOpenAppsScriptCode={() => {
            setIsAdminOpen(false);
            setIsAppsScriptOpen(true);
          }}
        />
      )}

      {/* Google Apps Script Source & Instructions Modal */}
      {isAppsScriptOpen && (
        <AppsScriptModal
          isOpen={isAppsScriptOpen}
          onClose={() => setIsAppsScriptOpen(false)}
        />
      )}

      {/* Share App Modal */}
      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          currentWeek={currentWeek}
          config={config}
          onSaveConfig={handleSaveConfig}
          teachers={teachers}
        />
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          userEmail={currentUser.email}
          userName={currentUser.name}
          isFirstLogin={isFirstLoginChange}
          onSuccess={() => {
            setShowChangePasswordModal(false);
            setIsAuthenticated(true);
            showToast('Đã cập nhật mật khẩu mới thành công!', 'success');
          }}
          onCancel={!isFirstLoginChange ? () => setShowChangePasswordModal(false) : undefined}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border bg-slate-900 text-white text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' && (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
