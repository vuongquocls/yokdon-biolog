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
  if (e && e.parameter) {
    if (e.parameter.action === 'catalog') {
      return ContentService.createTextOutput(JSON.stringify(getSpeciesCatalog()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (e.parameter.action === 'records') {
      return ContentService.createTextOutput(JSON.stringify(getObservationRecords()))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Yok Đôn BioLog — Giám sát Đa dạng sinh học')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * API POST tiếp nhận dữ liệu từ App (GitHub Pages / Cloudflare Pages / PWA)
 * - action === 'identify': Nhận diện loài qua Google Gemini Vision API (bảo mật khóa trên Apps Script)
 * - Mặc định: Tiếp nhận phiếu ghi nhận mới và lưu vào Google Sheet + Google Drive
 */
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    // 1. Nhánh nhận diện ảnh bằng Gemini Vision API
    if (payload && payload.action === 'identify') {
      const aiResult = identifySpeciesWithGemini_(payload);
      return ContentService.createTextOutput(JSON.stringify(aiResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Nhánh gửi phiếu ghi nhận: Kiểm tra Token bảo mật nếu có thiết lập
    if (CONFIG.API_SECRET_TOKEN && CONFIG.API_SECRET_TOKEN.trim() !== '') {
      if (!payload.apiToken || payload.apiToken !== CONFIG.API_SECRET_TOKEN) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Mã xác thực bảo mật (API Secret Token) không chính xác.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. Validate dữ liệu đầu vào cơ bản chống spam rác
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
 * Nhận diện loài qua ảnh sử dụng Google Gemini Vision API
 * API Key được lưu an toàn trong PropertiesService (Script Properties) của Google Apps Script:
 * Cài đặt tại: Extensions -> Apps Script -> Project Settings -> Script Properties -> GEMINI_API_KEY
 */
function identifySpeciesWithGemini_(payload) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey || apiKey.trim() === '') {
      return {
        success: false,
        error: 'Chưa cấu hình GEMINI_API_KEY trong Script Properties của Google Apps Script.'
      };
    }

    const base64Data = payload.imageBase64 || '';
    if (!base64Data) {
      return { success: false, error: 'Thiếu dữ liệu ảnh (imageBase64).' };
    }

    const mimeType = payload.mimeType || 'image/jpeg';
    const groupHint = payload.group && payload.group !== 'Khác / Chưa rõ' ? ' (Ưu tiên kiểm tra nhóm: ' + payload.group + ')' : '';

    const promptText = 'Bạn là chuyên gia phân loại học sinh vật tại Vườn quốc gia Yok Đôn (Đắk Lắk - Đắk Nông, Việt Nam). ' +
      'Hãy quan sát kỹ ảnh chụp hiện trường này' + groupHint + ' và nhận diện loài. ' +
      'YÊU CẦU BẮT BUỘC: Trả về ĐÚNG định dạng JSON thuần túy (không sử dụng markdown block ```json, không thêm chữ dẫn đầu hay kết bài), theo đúng cấu trúc sau:\n' +
      '{\n' +
      '  "species_vn": "Tên tiếng Việt dự đoán",\n' +
      '  "species_latin": "Tên khoa học",\n' +
      '  "group": "Chim|Thú|Thực vật|Bò sát|Cá|Khác",\n' +
      '  "confidence": "Cao|Trung bình|Thấp",\n' +
      '  "reason": "Mô tả ngắn gọn 1-2 đặc điểm nhận diện rõ nhất quan sát được trong ảnh"\n' +
      '}\n' +
      'Nếu không chắc chắn chính xác loài, hãy đưa ra loài gần nhất có phân bố tại hệ sinh thái rừng khộp Yok Đôn kèm độ tin cậy tương ứng.';

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey.trim());
    const reqBody = {
      contents: [{
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(reqBody),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const text = res.getContentText();

    if (code !== 200) {
      return { success: false, error: 'Gemini API trả về mã lỗi HTTP ' + code + ': ' + text };
    }

    const jsonRes = JSON.parse(text);
    const candidate = jsonRes.candidates && jsonRes.candidates[0];
    const rawContent = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] ? candidate.content.parts[0].text : '';

    // Làm sạch Markdown nếu Gemini trả về ```json ... ```
    const cleanJsonStr = rawContent.replace(/```(?:json)?/gi, '').trim();
    const parsed = JSON.parse(cleanJsonStr);

    return {
      success: true,
      result: parsed
    };
  } catch (err) {
    return {
      success: false,
      error: 'Lỗi nhận diện Gemini: ' + err.message
    };
  }
}

/**
 * Trả về danh sách tất cả các bản ghi có tọa độ từ tab NhatKy_GhiNhan
 * Phục vụ hiển thị đầy đủ lên bản đồ và xuất dữ liệu GIS (GeoJSON / KML / CSV)
 */
function getObservationRecords() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(CONFIG.SHEET_NHAT_KY);
    if (!logSheet) return { success: false, records: [] };

    const lastRow = logSheet.getLastRow();
    if (lastRow < 2) return { success: true, count: 0, records: [] };

    const tz = ss.getSpreadsheetTimeZone() || 'Asia/Ho_Chi_Minh';
    // Đọc từ dòng 2, cột 1 (A) đến cột 26 (Z)
    const values = logSheet.getRange(2, 1, lastRow - 1, 26).getValues();
    const records = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const latRaw = row[16]; // Cột 17 (Q): lat
      const lonRaw = row[17]; // Cột 18 (R): lon

      // Bỏ qua nếu không có tọa độ GPS
      if (latRaw === '' || lonRaw === '' || latRaw == null || lonRaw == null) continue;
      const lat = Number(latRaw);
      const lon = Number(lonRaw);
      if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) continue;

      let recordId = String(row[0] || '').trim();
      let dateStr = '';
      if (row[1] instanceof Date) {
        dateStr = Utilities.formatDate(row[1], tz, 'yyyy-MM-dd');
      } else {
        dateStr = String(row[1] || '').slice(0, 10);
      }

      if (!recordId) {
        const yr = dateStr ? dateStr.substring(0, 4) : '2026';
        recordId = 'YD-' + yr + '-' + String(i + 1).padStart(4, '0');
      }

      let timeStr = '';
      if (row[3] instanceof Date) {
        timeStr = Utilities.formatDate(row[3], tz, 'HH:mm');
      } else {
        timeStr = String(row[3] || '').slice(0, 5);
      }

      const notesRaw = String(row[25] || '');
      let clientUuid = '';
      const matchUuid = notesRaw.match(/\[UUID:([^\]]+)\]/);
      if (matchUuid) {
        clientUuid = matchUuid[1].trim();
      }

      const speciesLookup = String(row[8] || 'Chưa rõ loài');
      // Trích xuất nhóm
      let group = 'Khác / Chưa rõ';
      const commonGroups = ['Chim', 'Thú', 'Thực vật', 'Bò sát', 'Cá'];
      for (let g of commonGroups) {
        if (speciesLookup.indexOf(g) !== -1) {
          group = g;
          break;
        }
      }

      records.push({
        recordId: recordId,
        clientUuid: clientUuid,
        observedDate: dateStr,
        observedTime: timeStr,
        unit: String(row[5] || ''),
        reporterName: String(row[6] || ''),
        contact: String(row[7] || ''),
        speciesLookup: speciesLookup,
        label: speciesLookup.split(' (')[0],
        group: group,
        quantity: Number(row[14]) || 1,
        countUnit: String(row[15] || 'Cá thể'),
        lat: lat,
        lon: lon,
        locationNote: String(row[19] || ''),
        habitat: String(row[20] || 'Rừng khộp'),
        behavior: String(row[21] || ''),
        status: String(row[22] || 'Chờ xác minh'),
        method: String(row[23] || 'Quan sát trực tiếp'),
        folderUrl: String(row[24] || ''),
        notes: notesRaw.replace(/\[UUID:[^\]]+\]/, '').trim(),
        synced: true
      });
    }

    return {
      success: true,
      count: records.length,
      records: records
    };
  } catch (err) {
    return { success: false, error: err.message, records: [] };
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
