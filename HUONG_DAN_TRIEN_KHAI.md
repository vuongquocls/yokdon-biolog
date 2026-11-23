# Hướng dẫn triển khai PWA Yok Đôn BioLog v3 (100% Offline + Miễn phí)

## Tính năng mới v3
- 🗺️ **Bản đồ trực quan**: Leaflet + OpenStreetMap + ảnh vệ tinh ESRI, hiển thị ranh giới VQG Yok Đôn, vị trí GPS hiện tại và tất cả các điểm ghi nhận loài (phân màu theo nhóm).
- 📥 **Xuất dữ liệu GIS**: Xuất trực tiếp GeoJSON, KML (Google Earth), CSV (→ Shapefile trên QGIS) ngay trên điện thoại.
- 📷 **Hỗ trợ nhận diện loài**: Chụp ảnh → gợi ý nhanh loài phổ biến trong nhóm, chạm chọn tên loài → tự động điền vào phiếu.
- ⬇️ **Thanh điều hướng**: 3 tab: Ghi nhận | Bản đồ | Xuất GIS.
- 🌐 **Service Worker v3**: Cache thông minh cho cả tile bản đồ OpenStreetMap (xem bản đồ offline sau khi mở 1 lần có mạng).

---

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
   `const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/...';`
2. Thay URL bằng URL Ứng dụng web vừa copy ở Bước 1, rồi lưu lại.

## Bước 3: Đưa lên GitHub Pages miễn phí (2 phút)
1. Tạo 1 repository công khai trên GitHub (VD: `yokdon-biolog`).
2. Tải **6 tệp** lên thư mục gốc của repo:
   - `index.html` — Giao diện PWA chính (v3 với bản đồ + xuất GIS + nhận diện)
   - `manifest.json` — Cấu hình PWA
   - `sw.js` — Service Worker v3 (cache tile bản đồ offline)
   - `catalog.json` — Danh mục 1.752 loài ngoại tuyến
   - `icon.svg` — Icon ứng dụng
   - `yokdon-boundary.json` — Ranh giới VQG Yok Đôn (GeoJSON)
   - *(Không cần tải `Code.gs` lên GitHub — file này dùng riêng cho Google Apps Script)*
3. Vào **Settings → Pages → Branch: main → Save**. Sau ~1 phút sẽ có đường link HTTPS dạng `https://<ten-github>.github.io/yokdon-biolog/`.

## Bước 4: Cài lên điện thoại cán bộ & in mã QR cho du khách
- **Cán bộ (Android/iOS):** Mở link GitHub Pages 1 lần lúc có mạng (để Service Worker lưu sẵn app + 1.746 loài + tile bản đồ khu vực VQG vào máy) → bấm **Thêm vào Màn hình chính (Add to Home Screen)**. Từ đó về sau mở icon ngoài màn hình chính hoạt động 100% cả khi tắt 4G/vào rừng sâu.
- **Mẹo cache bản đồ offline:** Mở tab **Bản đồ**, zoom vào từng khu vực tuần tra để Service Worker tải sẵn tile bản đồ vào bộ nhớ. Các tile đã xem sẽ hiển thị offline.
- **Du khách:** In link GitHub Pages thành mã QR đặt tại Trung tâm GDMT&DV và đầu tuyến tham quan.

---

## Bước 5: Xuất dữ liệu GIS (cán bộ Phòng KH&HTQT)
1. Mở app → tab **Xuất GIS**.
2. Chọn định dạng:
   - **GeoJSON**: Dùng cho QGIS, ArcGIS, geojson.io
   - **KML**: Dùng cho Google Earth, Google Maps
   - **CSV**: Dùng cho Excel, Google Sheets, hoặc import vào QGIS → chuyển đổi sang Shapefile
3. File tải về điện thoại/máy tính, gửi qua email/Zalo/Google Drive cho đội ngũ phân tích.

### Chuyển CSV → Shapefile trên QGIS
1. `Layer → Add Layer → Add Delimited Text Layer`
2. Chọn file CSV → X field = `Lon`, Y field = `Lat`
3. CRS = `EPSG:4326 (WGS 84)` → Add
4. Chuột phải layer → `Export → Save Features As → ESRI Shapefile`

---

## Cấu trúc thư mục

```
yokdon-biolog/
├── index.html              ← PWA v3 (Ghi nhận + Bản đồ + Xuất GIS + Nhận diện)
├── manifest.json           ← Cấu hình PWA
├── sw.js                   ← Service Worker v3
├── catalog.json            ← 1.752 loài ngoại tuyến
├── yokdon-boundary.json    ← Ranh giới VQG Yok Đôn (GeoJSON)
├── icon.svg                ← Icon ứng dụng
├── Code.gs                 ← Backend Apps Script (không cần deploy lên GitHub)
├── HUONG_DAN_TRIEN_KHAI.md ← Hướng dẫn này
└── README.md               ← Giới thiệu dự án
```
