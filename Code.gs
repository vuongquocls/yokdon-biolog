/**
 * Backend Ứng dụng Hợp nhất Thu thập Đa dạng sinh học (Online & Offline Sync)
 * Vườn quốc gia Yok Đôn - Phòng KH&HTQT
 * Hỗ trợ: Cán bộ các Phòng, 16 Trạm Kiểm lâm (QĐ 684) & Trạm KLCĐ-PCCCR, TT GDMT&DV, Chuyên gia và Du khách.
 */

const CONFIG = {
  SHEET_NHAT_KY: 'NhatKy_GhiNhan',
  SHEET_ANH: 'Anh_HienTruong',
  SHEET_DANH_MUC: 'DanhMuc_Loai',
  ROOT_FOLDER_NAME: 'ANH_GIAM_SAT_DDSH_YOKDON',
  MAX_IMAGES: 5,
  MAX_IMAGE_BYTES: 5 * 1024 * 1024, // Giới hạn 5MB / ảnh chống làm tràn quota
  API_SECRET_TOKEN: '', // Nếu để rỗng: chế độ công khai thân thiện thực địa. Nếu điền chuỗi: bắt buộc app phải gửi kèm mã token
  PUBLIC_DRIVE_SHARE: true, // true: Cho phép xem ảnh qua link; false: Chỉ tài khoản nội bộ VQG được phân quyền mới xem được
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
 * API POST tiếp nhận dữ liệu từ App (GitHub Pages / Cloudflare Pages / PWA)
 * Bổ sung kiểm tra hợp lệ, chống spam & bảo mật token
 */
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    // 1. Kiểm tra Token bảo mật nếu máy chủ có thiết lập API_SECRET_TOKEN
    if (CONFIG.API_SECRET_TOKEN && CONFIG.API_SECRET_TOKEN.trim() !== '') {
      if (!payload.apiToken || payload.apiToken !== CONFIG.API_SECRET_TOKEN) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Mã xác thực bảo mật (API Secret Token) không chính xác.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. Validate dữ liệu đầu vào cơ bản chống spam rác
    const vError = validatePayload_(payload);
    if (vError) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Dữ liệu không hợp lệ: ' + vError
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const result = submitObservation(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Validate cấu trúc payload đầu vào
 */
function validatePayload_(p) {
  if (!p || typeof p !== 'object') return 'Payload phải là đối tượng JSON.';
  if (!p.reporterName || String(p.reporterName).trim().length === 0) {
    return 'Thiếu họ tên người ghi nhận.';
  }
  if (p.quantity != null) {
    const q = Number(p.quantity);
    if (isNaN(q) || q < 1 || q > 10000) return 'Số lượng cá thể không hợp lý (1 - 10.000).';
  }
  if (p.lat != null && p.lat !== '') {
    const lat = Number(p.lat);
    if (isNaN(lat) || lat < -90 || lat > 90) return 'Tọa độ Vĩ độ (Latitude) không hợp lệ.';
  }
  if (p.lon != null && p.lon !== '') {
    const lon = Number(p.lon);
    if (isNaN(lon) || lon < -180 || lon > 180) return 'Tọa độ Kinh độ (Longitude) không hợp lệ.';
  }
  if (Array.isArray(p.images) && p.images.length > CONFIG.MAX_IMAGES) {
    return 'Vượt quá số lượng ảnh cho phép (tối đa ' + CONFIG.MAX_IMAGES + ' ảnh).';
  }
  return null;
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
 * Chống ghi trùng toàn diện trên toàn bộ cột Ghi chú (cột 26 / Z)
 * Dùng TextFinder backend tối ưu tốc độ và không bị giới hạn 200 dòng cuối
 */
function isDuplicateUuid_(sheet, clientUuid) {
  if (!clientUuid || typeof clientUuid !== 'string') return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const tag = '[UUID:' + clientUuid.trim() + ']';
  const range = sheet.getRange(2, 26, lastRow - 1, 1);
  const finder = range.createTextFinder(tag).matchEntireCell(false);
  const match = finder.findNext();
  return match !== null;
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

    // Chống ghi trùng lặp phiếu
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

    // Lưu tối đa 5 ảnh vào thư mục con riêng trên Google Drive
    let folderUrl = '';
    const imageRows = [];
    const rawFiles = Array.isArray(payload.images) ? payload.images.slice(0, CONFIG.MAX_IMAGES) : [];

    if (rawFiles.length > 0) {
      const rootFolder = getOrCreateRootFolder_();
      const subFolder = rootFolder.createFolder(dateStamp + '_' + recordId);
      
      // Cấu hình chia sẻ an toàn theo CONFIG
      if (CONFIG.PUBLIC_DRIVE_SHARE) {
        subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
      folderUrl = subFolder.getUrl();

      const syncStamp = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm');
      rawFiles.forEach((img, idx) => {
        if (!img || !img.base64Data) return;
        
        // Kiểm tra dung lượng base64 (~ 3/4 độ dài chuỗi)
        const approxBytes = Math.round((img.base64Data.length * 3) / 4);
        if (approxBytes > CONFIG.MAX_IMAGE_BYTES) {
          Logger.log('Ảnh vượt quá dung lượng cho phép: ' + approxBytes + ' bytes');
          return;
        }

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
      payload.method || (rawFiles.length > 0 ? 'Chụp ảnh' : 'Quan sát trực tiếp'),
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
      imageCount: imageRows.length,
      folderUrl: folderUrl
    };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Khóa cứng cột công thức (tới dòng 1000) & các tab hệ thống
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
