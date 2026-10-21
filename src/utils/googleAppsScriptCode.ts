/**
 * Complete Google Apps Script backend code (Code.gs)
 * to be pasted into Google Sheets > Extensions > Apps Script
 *
 * Implements the 2-layer architecture:
 * Layer (a): Raw data sheet "DuLieu" (Tuần | Ngày | Thứ | Số thứ tự cụm | Tiết | Môn | Tiết PPCT | Số HS nghỉ | Tên HS nghỉ | Tên bài | Giáo viên | Email người nhập | Thời gian cập nhật)
 * Layer (b): Presentation weekly sheets "Tuần 1", "Tuần 2"... rebuilt accurately matching the 7-column school template.
 */

export const APPS_SCRIPT_SOURCE_CODE = `/**
 * ============================================================================
 * SỔ ĐẦU BÀI HỌC SINH GIỎI KHỐI 12 - GOOGLE APPS SCRIPT BACKEND
 * Kiến trúc 2 lớp: Sheet "DuLieu" (thô) + Sheet "Tuần n" (trình bày chuẩn 7 cột)
 * ============================================================================
 */

var SHEET_RAW_DATA = "DuLieu";
var SHEET_CONFIG = "CauHinh";
var SHEET_ASSIGNMENTS = "PhanCong";
var SHEET_STUDENTS = "DanhSachHS";

var RAW_HEADERS = [
  "Tuần",
  "Ngày",
  "Thứ",
  "Số thứ tự cụm",
  "Tiết",
  "Môn",
  "Tiết PPCT",
  "Số HS nghỉ",
  "Tên HS nghỉ",
  "Tên bài",
  "Giáo viên",
  "Email người nhập",
  "Thời gian cập nhật"
];

var PRESENTATION_HEADERS = [
  "Thứ, ngày/tháng",
  "Tiết",
  "Môn học",
  "Tiết PPCT",
  "Tên HS nghỉ tiết",
  "Tên bài, nội dung công việc",
  "Ký tên"
];

function doGet(e) {
  var output = { success: true };
  try {
    var params = e ? e.parameter : {};
    var action = params.action || "ping";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSystemSheets(ss);

    if (action === "ping" || action === "test") {
      output.message = "Kết nối Google Apps Script thành công!";
      output.spreadsheetName = ss.getName();
      output.time = new Date().toISOString();
    } else if (action === "getConfig") {
      output.data = loadConfig(ss);
    } else if (action === "getAssignments") {
      output.data = loadAssignments(ss);
    } else if (action === "getStudents") {
      output.data = loadStudents(ss);
    } else if (action === "getWeek") {
      var weekNum = parseInt(params.week || "5", 10);
      output.data = loadWeekDataFromRaw(ss, weekNum);
    } else {
      output.success = false;
      output.error = "Hành động không hợp lệ: " + action;
    }
  } catch (err) {
    output.success = false;
    output.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var output = { success: true };
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      throw new Error("Không nhận được dữ liệu POST.");
    }

    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSystemSheets(ss);

    if (action === "savePeriod") {
      output.result = savePeriodToRaw(ss, payload.entry);
      rebuildPresentationSheet(ss, payload.entry.weekNumber);
    } else if (action === "saveWeek") {
      output.result = batchSaveWeekToRaw(ss, payload.weekNumber, payload.entries);
      rebuildPresentationSheet(ss, payload.weekNumber);
    } else if (action === "deleteCluster") {
      output.result = deleteClusterFromRaw(ss, payload.weekNumber, payload.dayOfWeek, payload.clusterIndex);
      rebuildPresentationSheet(ss, payload.weekNumber);
    } else if (action === "updateConfig") {
      output.result = saveConfig(ss, payload.config);
    } else if (action === "lockWeek") {
      output.result = toggleLockWeek(ss, payload.weekNumber, payload.isLocked);
    }
  } catch (err) {
    output.success = false;
    output.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1. LỚP DỮ LIỆU THÔ (DuLieu)
 */
function getRawDataSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_RAW_DATA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_RAW_DATA);
    var hr = sheet.getRange(1, 1, 1, RAW_HEADERS.length);
    hr.setValues([RAW_HEADERS]);
    hr.setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function savePeriodToRaw(ss, entry) {
  var sheet = getRawDataSheet(ss);
  var data = sheet.getDataRange().getValues();
  var targetRow = -1;

  var weekNum = parseInt(entry.weekNumber, 10);
  var dayOfWeek = parseInt(entry.dayOfWeek, 10);
  var clusterIdx = parseInt(entry.clusterIndex || 1, 10);
  var period = parseInt(entry.period, 10);

  // Key: Tuần + Ngày/Thứ + Cụm + Tiết
  for (var r = 1; r < data.length; r++) {
    if (
      parseInt(data[r][0], 10) === weekNum &&
      parseInt(data[r][2], 10) === dayOfWeek &&
      parseInt(data[r][3], 10) === clusterIdx &&
      parseInt(data[r][4], 10) === period
    ) {
      targetRow = r + 1;
      break;
    }
  }

  var rowValues = [
    weekNum,
    entry.dateStr || "",
    dayOfWeek,
    clusterIdx,
    period,
    entry.subject || "",
    entry.ppctLesson || "",
    entry.absentCount || 0,
    entry.absentStudents || "",
    entry.lessonTitle || "",
    entry.teacherSignature || "",
    entry.teacherEmail || "",
    entry.updatedAt || new Date().toLocaleString("vi-VN")
  ];

  if (targetRow > 1) {
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return { message: "Đã lưu vào sheet DuLieu" };
}

function batchSaveWeekToRaw(ss, weekNumber, entries) {
  var sheet = getRawDataSheet(ss);
  var data = sheet.getDataRange().getValues();
  var rowsToKeep = [];

  // Giữ lại các hàng của các tuần khác
  for (var r = 0; r < data.length; r++) {
    if (r === 0 || parseInt(data[r][0], 10) !== parseInt(weekNumber, 10)) {
      rowsToKeep.push(data[r]);
    }
  }

  // Thêm toàn bộ entries mới của tuần này
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    rowsToKeep.push([
      weekNumber,
      e.dateStr || "",
      e.dayOfWeek,
      e.clusterIndex || 1,
      e.period,
      e.subject || "",
      e.ppctLesson || "",
      e.absentCount || 0,
      e.absentStudents || "",
      e.lessonTitle || "",
      e.teacherSignature || "",
      e.teacherEmail || "",
      e.updatedAt || new Date().toLocaleString("vi-VN")
    ]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rowsToKeep.length, RAW_HEADERS.length).setValues(rowsToKeep);
  sheet.getRange(1, 1, 1, RAW_HEADERS.length).setFontWeight("bold").setBackground("#e2e8f0");
  sheet.setFrozenRows(1);

  return { message: "Đã lưu theo lô toàn bộ tuần " + weekNumber };
}

function deleteClusterFromRaw(ss, weekNumber, dayOfWeek, clusterIndex) {
  var sheet = getRawDataSheet(ss);
  var data = sheet.getDataRange().getValues();
  var newRows = [data[0]];

  for (var r = 1; r < data.length; r++) {
    var isTarget =
      parseInt(data[r][0], 10) === parseInt(weekNumber, 10) &&
      parseInt(data[r][2], 10) === parseInt(dayOfWeek, 10) &&
      parseInt(data[r][3], 10) === parseInt(clusterIndex, 10);
    if (!isTarget) {
      newRows.push(data[r]);
    }
  }

  sheet.clearContents();
  sheet.getRange(1, 1, newRows.length, RAW_HEADERS.length).setValues(newRows);
  sheet.getRange(1, 1, 1, RAW_HEADERS.length).setFontWeight("bold").setBackground("#e2e8f0");
  sheet.setFrozenRows(1);

  return { message: "Đã xóa cụm môn khỏi sheet DuLieu" };
}

function loadWeekDataFromRaw(ss, weekNumber) {
  var sheet = getRawDataSheet(ss);
  var data = sheet.getDataRange().getValues();
  var result = [];

  for (var r = 1; r < data.length; r++) {
    if (parseInt(data[r][0], 10) === parseInt(weekNumber, 10)) {
      var dayOfWeek = parseInt(data[r][2], 10);
      var clusterIdx = parseInt(data[r][3], 10);
      var period = parseInt(data[r][4], 10);

      result.push({
        id: "w" + weekNumber + "_d" + dayOfWeek + "_c" + clusterIdx + "_p" + period,
        weekNumber: weekNumber,
        dayOfWeek: dayOfWeek,
        dateStr: String(data[r][1] || ""),
        clusterIndex: clusterIdx,
        period: period,
        subject: String(data[r][5] || ""),
        ppctLesson: String(data[r][6] || ""),
        absentCount: parseInt(data[r][7] || 0, 10),
        absentStudents: String(data[r][8] || ""),
        lessonTitle: String(data[r][9] || ""),
        teacherSignature: String(data[r][10] || ""),
        teacherEmail: String(data[r][11] || ""),
        updatedAt: String(data[r][12] || "")
      });
    }
  }
  return result;
}

/**
 * 2. LỚP SHEET TRÌNH BÀY CHUẨN ("Tuần 1", "Tuần 2"...)
 * Được Apps Script tự động dựng lại sau mỗi lần lưu
 */
function rebuildPresentationSheet(ss, weekNumber) {
  var sheetName = "Tuần " + weekNumber;
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  // Load entries of this week
  var entries = loadWeekDataFromRaw(ss, weekNumber);

  // Set font family
  var entireRange = sheet.getRange(1, 1, 100, 7);
  entireRange.setFontFamily("Times New Roman");

  // Hàng 1: Ô A1 "Tuần n" (in đậm, cỡ 14)
  var cellA1 = sheet.getRange(1, 1);
  cellA1.setValue("Tuần " + weekNumber).setFontSize(14).setFontWeight("bold");
  sheet.setRowHeight(1, 30);

  // Hàng 2-3: Tiêu đề cột (gộp dọc cho từng cột), in đậm, căn giữa, nền xám nhạt
  for (var c = 1; c <= 7; c++) {
    sheet.getRange(2, c, 2, 1).merge();
    var headerCell = sheet.getRange(2, c);
    headerCell.setValue(PRESENTATION_HEADERS[c - 1])
      .setFontWeight("bold")
      .setFontSize(12)
      .setBackground("#e5e7eb")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(true);
  }
  sheet.setRowHeight(2, 22);
  sheet.setRowHeight(3, 22);

  // Hàng 4: Số thứ tự cột 1 đến 7
  for (var c = 1; c <= 7; c++) {
    sheet.getRange(4, c).setValue(c)
      .setFontSize(11)
      .setFontWeight("bold")
      .setFontStyle("italic")
      .setBackground("#f3f4f6")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
  }
  sheet.setRowHeight(4, 20);

  // Độ rộng cột: Thứ 14 (100px), Tiết 6 (45px), Môn 14 (100px), PPCT 10 (70px), HS nghỉ 22 (160px), Tên bài 55 (380px), Ký tên 24 (170px)
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 45);
  sheet.setColumnWidth(3, 105);
  sheet.setColumnWidth(4, 75);
  sheet.setColumnWidth(5, 160);
  sheet.setColumnWidth(6, 380);
  sheet.setColumnWidth(7, 170);

  sheet.setFrozenRows(4);

  var dayNames = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ Nhật" };
  var days = [2, 3, 4, 5, 6, 7, 8];
  var currentRow = 5;

  for (var d = 0; d < days.length; d++) {
    var dayNum = days[d];
    var dayEntries = entries.filter(function(e) { return e.dayOfWeek === dayNum; });

    var clusterMap = {};
    for (var i = 0; i < dayEntries.length; i++) {
      var cIdx = dayEntries[i].clusterIndex || 1;
      if (!clusterMap[cIdx]) clusterMap[cIdx] = [];
      clusterMap[cIdx].push(dayEntries[i]);
    }

    var clusterIndices = Object.keys(clusterMap).map(Number).sort(function(a, b) { return a - b; });
    if (clusterIndices.length === 0) clusterIndices = [1];

    var startRowForDay = currentRow;
    var dayDateStr = dayEntries[0] ? dayEntries[0].dateStr : "";

    for (var ci = 0; ci < clusterIndices.length; ci++) {
      var cIdx = clusterIndices[ci];
      var cRows = clusterMap[cIdx] || [];

      for (var p = 1; p <= 5; p++) {
        var entry = null;
        for (var k = 0; k < cRows.length; k++) {
          if (cRows[k].period === p) {
            entry = cRows[k];
            break;
          }
        }

        sheet.setRowHeight(currentRow, 26);

        // Col 2: Tiết
        sheet.getRange(currentRow, 2).setValue(p).setHorizontalAlignment("center").setVerticalAlignment("middle");
        // Col 3: Môn
        sheet.getRange(currentRow, 3).setValue(entry ? entry.subject : "").setHorizontalAlignment("center").setVerticalAlignment("middle");
        // Col 4: Tiết PPCT
        sheet.getRange(currentRow, 4).setValue(entry ? entry.ppctLesson : "").setHorizontalAlignment("center").setVerticalAlignment("middle");
        // Col 5: Tên HS nghỉ
        var absentText = "";
        if (entry && entry.absentCount > 0) {
          absentText = "Vắng: " + entry.absentCount + (entry.absentStudents ? " (" + entry.absentStudents + ")" : "");
        }
        sheet.getRange(currentRow, 5).setValue(absentText).setHorizontalAlignment("left").setVerticalAlignment("middle");
        // Col 6: Tên bài (tự xuống dòng)
        sheet.getRange(currentRow, 6).setValue(entry ? entry.lessonTitle : "").setHorizontalAlignment("left").setVerticalAlignment("middle").setWrap(true);
        // Col 7: Ký tên
        sheet.getRange(currentRow, 7).setValue(entry ? entry.teacherSignature : "").setHorizontalAlignment("center").setVerticalAlignment("middle");

        currentRow++;
      }
    }

    var endRowForDay = currentRow - 1;
    if (endRowForDay >= startRowForDay) {
      sheet.getRange(startRowForDay, 1, endRowForDay - startRowForDay + 1, 1).merge();
      var dayCell = sheet.getRange(startRowForDay, 1);
      dayCell.setValue(dayNames[dayNum] + "\\n" + dayDateStr)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle")
        .setFontWeight("bold")
        .setWrap(true);
    }
  }

  // Kẻ viền toàn bảng
  var tableRange = sheet.getRange(2, 1, currentRow - 2, 7);
  tableRange.setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
}

function initSystemSheets(ss) {
  if (!ss.getSheetByName(SHEET_CONFIG)) {
    var s = ss.insertSheet(SHEET_CONFIG);
    s.appendRow(["Mục", "Giá trị"]);
    s.appendRow(["gradeLevel", "Khối 12"]);
    s.appendRow(["departmentName", "SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐÀ NẴNG"]);
    s.appendRow(["schoolName", "TRƯỜNG THPT CHUYÊN LÊ QUÝ ĐÔN"]);
    s.appendRow(["academicYear", "2026 - 2027"]);
    s.appendRow(["weekOneStartDate", "2026-09-07"]);
    s.appendRow(["lockedWeeks", "{}"]);
  }
}

function loadConfig(ss) {
  var s = ss.getSheetByName(SHEET_CONFIG);
  if (!s) return {};
  var d = s.getDataRange().getValues();
  var cfg = {};
  for (var i = 1; i < d.length; i++) {
    if (d[i][0] === "lockedWeeks") {
      try { cfg[d[i][0]] = JSON.parse(d[i][1] || "{}"); } catch(e) { cfg[d[i][0]] = {}; }
    } else {
      cfg[d[i][0]] = d[i][1];
    }
  }
  return cfg;
}

function saveConfig(ss, config) {
  var s = ss.getSheetByName(SHEET_CONFIG);
  if (!s) return false;
  var d = s.getDataRange().getValues();
  for (var i = 1; i < d.length; i++) {
    var k = d[i][0];
    if (config[k] !== undefined) {
      s.getRange(i + 1, 2).setValue(k === "lockedWeeks" ? JSON.stringify(config[k]) : config[k]);
    }
  }
  return true;
}

function toggleLockWeek(ss, weekNumber, isLocked) {
  var cfg = loadConfig(ss);
  var locked = cfg.lockedWeeks || {};
  locked[weekNumber] = isLocked;
  cfg.lockedWeeks = locked;
  saveConfig(ss, cfg);
  return { weekNumber: weekNumber, isLocked: isLocked };
}
`;

export const APPS_SCRIPT_INSTRUCTIONS = [
  {
    step: 1,
    title: 'Tạo Google Sheet mới',
    desc: 'Truy cập https://sheets.new và đặt tên file: "SỔ ĐẦU BÀI HỌC SINH GIỎI KHỐI 12".',
  },
  {
    step: 2,
    title: 'Mở trình chỉnh sửa Apps Script',
    desc: 'Trên menu Google Sheet, chọn Tiện ích mở rộng (Extensions) > Apps Script.',
  },
  {
    step: 3,
    title: 'Dán toàn bộ mã nguồn 2 lớp',
    desc: 'Xóa toàn bộ mã mặc định trong Code.gs và dán toàn bộ đoạn mã bên dưới vào.',
  },
  {
    step: 4,
    title: 'Lưu dự án',
    desc: 'Nhấn biểu tượng Đĩa mềm (Ctrl + S) để lưu dự án.',
  },
  {
    step: 5,
    title: 'Triển khai dưới dạng Web App',
    desc: 'Nhấn nút "Triển khai" (Deploy) góc trên bên phải > "Tùy chọn triển khai mới" (New deployment).',
  },
  {
    step: 6,
    title: 'Cài đặt loại Ứng dụng web',
    desc: 'Nhấp biểu tượng Bánh răng (⚙) > Chọn "Ứng dụng web" (Web app). Mô tả: "v3.0 - Biểu mẫu 7 cột". Thực thi dưới tên: "Tôi" (Me). Quyền truy cập: "Bất kỳ ai" (Anyone).',
  },
  {
    step: 7,
    title: 'Cấp quyền tài khoản Google',
    desc: 'Nhấn Triển khai và cấp quyền cho tài khoản Google của bạn để Apps Script có thể ghi dữ liệu.',
  },
  {
    step: 8,
    title: 'Dán URL vào ứng dụng web',
    desc: 'Sao chép đường dẫn URL Web App (kết thúc bằng /exec) và dán vào ô "URL Google Apps Script" trong phần Cấu hình.',
  },
];
