# 🌿 Yok Đôn BioLog — Giám sát Đa dạng sinh học

**PWA miễn phí, hoạt động 100% offline** cho cán bộ kiểm lâm, chuyên gia và du khách ghi nhận động thực vật tại **Vườn quốc gia Yok Đôn** (Đắk Lắk / Đắk Nông).

---

## ✨ Tính năng

| Tính năng | Mô tả |
|---|---|
| 📋 **Ghi nhận loài** | Form thông minh với 1.746 loài Yok Đôn, tìm kiếm nhanh, GPS ngoại tuyến, nén ảnh tự động |
| 🗺️ **Bản đồ trực quan** | Leaflet + OpenStreetMap / Ảnh vệ tinh ESRI, ranh giới VQG Yok Đôn, hiển thị tất cả điểm ghi nhận phân màu theo nhóm loài |
| 📥 **Xuất dữ liệu GIS** | GeoJSON, KML (Google Earth), CSV (→ Shapefile) — xuất trực tiếp trên điện thoại |
| 📷 **Hỗ trợ nhận diện** | Chụp ảnh → gợi ý loài phổ biến → chạm chọn nhanh |
| 📶 **Offline-first** | Service Worker cache 100% app + danh mục loài + tile bản đồ. Lưu phiếu offline → tự đồng bộ khi có sóng |
| 💰 **Chi phí 0 đồng** | GitHub Pages (frontend) + Google Apps Script + Google Sheets + Google Drive |

## 🏗️ Kiến trúc

```
📱 Điện thoại (PWA Offline)
 ├── index.html (Form + Bản đồ + Xuất GIS)
 ├── catalog.json (1.752 loài cache)
 ├── sw.js (Service Worker v3)
 └── yokdon-boundary.json (ranh giới VQG)
         │ (khi có sóng)
         ▼
🖥️ Google Apps Script (Code.gs)
 ├── Google Sheets (CSDL nhật ký)
 └── Google Drive (ảnh hiện trường)
```

## 🚀 Triển khai nhanh

Xem chi tiết: [HUONG_DAN_TRIEN_KHAI.md](./HUONG_DAN_TRIEN_KHAI.md)

1. Dán `Code.gs` vào Apps Script của Google Sheet → Deploy Web App
2. Thay `GAS_WEBAPP_URL` trong `index.html`
3. Push 6 file lên GitHub → Bật GitHub Pages
4. Mở link 1 lần lúc có mạng → Add to Home Screen → Dùng offline mãi mãi

## 📋 Nhóm loài hỗ trợ

🐦 Chim · 🐾 Thú · 🌿 Thực vật · 🦎 Bò sát · 🐟 Cá · ❓ Khác

## 🏢 Đơn vị sử dụng

- Phòng Khoa học & Hợp tác quốc tế
- Trung tâm Giáo dục môi trường & Dịch vụ
- Hạt Kiểm lâm + 17 Trạm Kiểm lâm
- Chuyên gia / Cộng tác viên
- Du khách / Khách tham quan

---

**Vườn quốc gia Yok Đôn** · Đắk Lắk, Việt Nam · 115.545 ha · Thành lập 1991
