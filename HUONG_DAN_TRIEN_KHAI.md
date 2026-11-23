# Hướng dẫn triển khai PWA Yok Đôn BioLog (100% Offline + Miễn phí)

## Bước 1: Triển khai Backend Google Apps Script (2 phút)
1. Mở file Google Sheet **CSDL Giám sát Đa dạng sinh học (Động - Thực vật) - VQG Yok Đôn**.
2. Vào **Tiện ích mở rộng → Apps Script**, dán toàn bộ nội dung file `Code.gs` vào tệp `Code.gs` mặc định rồi bấm Lưu.
3. Chạy thử 1 lần hàm `khoaCacCotCongThucVaTabHeThong` để cấp quyền và khóa cứng các cột công thức.
4. Bấm **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**:
   - Thực thi dưới dạng: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai**
5. Copy **URL Ứng dụng web** (có dạng `https://script.google.com/macros/s/.../exec`).

## Bước 2: Gắn URL Backend vào PWA
1. Mở file `index.html`, tìm dòng:
   `const GAS_WEBAPP_URL = 'DAN_URL_WEB_APP_APPS_SCRIPT_VAO_DAY';`
2. Thay chuỗi trên bằng URL Ứng dụng web vừa copy ở Bước 1, rồi lưu lại.

## Bước 3: Đưa lên GitHub Pages miễn phí (2 phút)
1. Tạo 1 repository công khai trên GitHub (VD: `yokdon-biolog`).
2. Tải 5 tệp lên thư mục gốc của repo: `index.html`, `manifest.json`, `sw.js`, `catalog.json`, `icon.svg` (không cần tải `Code.gs`).
3. Vào **Settings → Pages → Branch: main → Save**. Sau ~1 phút sẽ có đường link HTTPS dạng `https://<ten-github>.github.io/yokdon-biolog/`.

## Bước 4: Cài lên điện thoại cán bộ & in mã QR cho du khách
- **Cán bộ (Android/iOS):** Mở link GitHub Pages 1 lần lúc có mạng (để Service Worker lưu sẵn app + 1.746 loài vào máy) → bấm **Thêm vào Màn hình chính (Add to Home Screen)**. Từ đó về sau mở icon ngoài màn hình chính hoạt động 100% cả khi tắt 4G/vào rừng sâu.
- **Du khách:** In link GitHub Pages thành mã QR đặt tại Trung tâm GDMT&DV và đầu tuyến tham quan.
