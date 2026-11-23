/**
 * Backend Ứng dụng Hợp nhất Thu thập Đa dạng sinh học (Online & Offline Sync)
 * Vườn quốc gia Yok Đôn - Phòng KH&HTQT
 * Hỗ trợ: Cán bộ các Phòng, Trạm KLB, Trung tâm GDMT&DV, Chuyên gia và Du khách.
 */

const CONFIG = {
  SHEET_NHAT_KY: 'NhatKy_GhiNhan',
  SHEET_ANH: 'Anh_HienTruong',
  SHEET_DANH_MUC: 'DanhMuc_Loai',
  ROOT_FOLDER_NAME: 'ANH_GIAM_SAT_DDSH_YOKDON',
  MAX_IMAGES: 5,
  LOCKED_SHEETS: ['Dashboard_TongHop', 'DanhMuc_Loai', 'DanhMuc_ThamChieu', 'HuongDan_QuyUoc'],
  LOCKED_FORMULA_RANGES: ['A2:A1000', 'C2:C1000', 'E2:E1000', 'J2:N1000', 'S2:S1000']
};

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'catalog') {
    return ContentService.createTextOutput(JSON.stringify(getSpeciesCatalog()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Yok Đôn BioLog — Giám sát Đa dạng sinh học')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * API POST cho phép gọi từ bản PWA host ngoài (GitHub Pages / Cloudflare Pages)
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const result = submitObservation(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Tải toàn bộ 1.752 dòng danh mục loài (chỉ 2 cột Nhóm + Tên tra cứu) để cache vào IndexedDB trên máy
 */
function getSpeciesCatalog() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG.SHEET_DANH_MUC);
    if (!sh) return { success: false, items: [] };

    const lastRow = sh.getLastRow();
    if (lastRow < 2) return { success: true, items: [] };

    const values = sh.getRange(2, 2, lastRow - 1, 6).getValues(); // B: Nhóm loài, G: Tên tra cứu
    const items = [];
    for (let i = 0; i < values.length; i++) {
      const group = values[i][0];
      const lookup = values[i][5];
      if (group && lookup) items.push({ g: String(group), l: String(lookup) });
    }
    return { success: true, count: items.length, items: items };
  } catch (err) {
    return { success: false, error: err.message, items: [] };
  }
}

function getOrCreateRootFolder_() {
  const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
}

function findFirstEmptyRow_(sheet, checkCol) {
  const colValues = sheet.getRange(2, checkCol, Math.max(sheet.getMaxRows() - 1, 1), 1).getValues();
  for (let i = 0; i < colValues.length; i++) {
    if (!colValues[i][0]) return i + 2;
  }
  return sheet.getLastRow() + 1;
}

/**
 * Chống ghi trùng khi mạng chập chờn đồng bộ lại (dựa trên clientUuid gắn cuối cột Ghi chú)
 */
function isDuplicateUuid_(sheet, clientUuid) {
  if (!clientUuid) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const startRow = Math.max(2, lastRow - 200);
  const notes = sheet.getRange(startRow, 26, lastRow - startRow + 1, 1).getValues();
  const tag = '[UUID:' + clientUuid + ']';
  for (let i = notes.length - 1; i >= 0; i--) {
    if (String(notes[i][0]).indexOf(tag) !== -1) return true;
  }
  return false;
}

/**
 * Nhận phiếu ghi nhận từ App (cả Online trực tiếp lẫn Offline đồng bộ sau)
 * Bảo toàn đúng ngày/giờ ghi nhận thực tế tại hiện trường (observedDate, observedTime)
 */
function submitObservation(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(CONFIG.SHEET_NHAT_KY);
    const imgSheet = ss.getSheetByName(CONFIG.SHEET_ANH);
    if (!logSheet) throw new Error('Không tìm thấy tab ' + CONFIG.SHEET_NHAT_KY);

    if (isDuplicateUuid_(logSheet, payload.clientUuid)) {
      return { success: true, duplicateSkipped: true, recordId: 'ĐÃ ĐỒNG BỘ TRƯỚC ĐÓ' };
    }

    const now = new Date();
    const tz = ss.getSpreadsheetTimeZone() || 'Asia/Ho_Chi_Minh';
    const dateStr = payload.observedDate || Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    const timeStr = payload.observedTime || Utilities.formatDate(now, tz, 'HH:mm');
    const yearStr = dateStr.substring(0, 4);
    const dateStamp = dateStr.replace(/-/g, '');

    const targetRow = findFirstEmptyRow_(logSheet, 2);
    const recordId = 'YD-' + yearStr + '-' + String(targetRow - 1).padStart(4, '0');

    // Lưu tối đa 5 ảnh vào 1 thư mục con riêng trên Google Drive
    let folderUrl = '';
    const imageRows = [];
    const files = Array.isArray(payload.images) ? payload.images.slice(0, CONFIG.MAX_IMAGES) : [];

    if (files.length > 0) {
      const rootFolder = getOrCreateRootFolder_();
      const subFolder = rootFolder.createFolder(dateStamp + '_' + recordId);
      subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      folderUrl = subFolder.getUrl();

      const syncStamp = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm');
      files.forEach((img, idx) => {
        const mime = img.mimeType || 'image/jpeg';
        const ext = mime.includes('png') ? 'png' : 'jpg';
        const decoded = Utilities.base64Decode(img.base64Data);
        const fileName = dateStamp + '_' + recordId + '_' + String(idx + 1).padStart(2, '0') + '.' + ext;
        const createdFile = subFolder.createFile(Utilities.newBlob(decoded, mime, fileName));
        imageRows.push([
          recordId,
          idx + 1,
          createdFile.getUrl(),
          payload.unit || 'Thực địa',
          syncStamp
        ]);
      });
    }

    const unknownFallback = {
      'Chim': 'Chưa rõ loài - Chim (Chờ xác minh)',
      'Thú': 'Chưa rõ loài - Thú (Chờ xác minh)',
      'Bò sát': 'Chưa rõ loài - Bò sát (Chờ xác minh)',
      'Cá': 'Chưa rõ loài - Cá (Chờ xác minh)',
      'Thực vật': 'Chưa rõ loài - Thực vật (Chờ xác minh)'
    };
    const speciesLookup = payload.speciesLookup || unknownFallback[payload.group] || 'Chưa rõ loài - Khác / Chưa rõ (Chờ xác minh)';
    const uuidSuffix = payload.clientUuid ? ' [UUID:' + payload.clientUuid + ']' : '';
    const finalNotes = (payload.notes ? payload.notes.trim() : '') + uuidSuffix;

    // Ghi dữ liệu vào các ô nhập tay, giữ nguyên toàn bộ cột công thức (A, C, E, J:N, S)
    logSheet.getRange(targetRow, 2).setValue(dateStr);
    logSheet.getRange(targetRow, 4).setValue(timeStr);
    logSheet.getRange(targetRow, 6, 1, 4).setValues([[
      payload.unit || 'Du khách / Khách tham quan',
      payload.reporterName || 'Chưa ghi tên',
      payload.contact || '',
      speciesLookup
    ]]);
    logSheet.getRange(targetRow, 15, 1, 4).setValues([[
      Number(payload.quantity) || 1,
      payload.countUnit || 'Cá thể',
      payload.lat !== '' && payload.lat != null ? Number(payload.lat) : '',
      payload.lon !== '' && payload.lon != null ? Number(payload.lon) : ''
    ]]);
    logSheet.getRange(targetRow, 20, 1, 7).setValues([[
      payload.locationNote || '',
      payload.habitat || 'Rừng khộp',
      payload.behavior || 'Đậu nghỉ / Di chuyển',
      'Chờ xác minh',
      payload.method || (files.length > 0 ? 'Chụp ảnh' : 'Quan sát trực tiếp'),
      folderUrl,
      finalNotes.trim()
    ]]);

    if (imgSheet && imageRows.length > 0) {
      const startImgRow = findFirstEmptyRow_(imgSheet, 2);
      imgSheet.getRange(startImgRow, 2, imageRows.length, 5).setValues(imageRows);
    }

    return {
      success: true,
      recordId: recordId,
      imageCount: files.length,
      folderUrl: folderUrl
    };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Chạy 1 lần với quyền Chủ sở hữu để khóa cứng cột công thức (tới dòng 1000) & 4 tab hệ thống
 */
function khoaCacCotCongThucVaTabHeThong() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const owner = Session.getEffectiveUser();

    const logSheet = ss.getSheetByName(CONFIG.SHEET_NHAT_KY);
    if (logSheet) {
      logSheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(p => p.remove());
      CONFIG.LOCKED_FORMULA_RANGES.forEach(a1 => {
        const p = logSheet.getRange(a1).protect().setDescription('Khóa cột công thức: ' + a1);
        p.addEditor(owner);
        p.removeEditors(p.getEditors().filter(u => u.getEmail() !== owner.getEmail()));
        if (p.canDomainEdit()) p.setDomainEdit(false);
      });
    }

    CONFIG.LOCKED_SHEETS.forEach(name => {
      const sh = ss.getSheetByName(name);
      if (!sh) return;
      sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => p.remove());
      const p = sh.protect().setDescription('Khóa tab hệ thống: ' + name);
      p.addEditor(owner);
      p.removeEditors(p.getEditors().filter(u => u.getEmail() !== owner.getEmail()));
      if (p.canDomainEdit()) p.setDomainEdit(false);
    });

    Logger.log('Đã khóa cứng cột công thức và tab hệ thống.');
  } catch (err) {
    Logger.log('Lỗi khóa bảo vệ: ' + err.message);
    throw err;
  }
}
