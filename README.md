# 🌿 Yok Đôn BioLog — Giám sát Đa dạng sinh học & Hệ thống Bản đồ Lâm nghiệp

**PWA chuyên dụng, hoạt động 100% offline**, tích hợp đầy đủ **Hệ thống dữ liệu GIS & Hệ tọa độ VN-2000** phục vụ công tác tuần tra, bảo tồn và nghiên cứu khoa học tại **Vườn quốc gia Yok Đôn** (Đắk Lắk & Đắk Nông).

🔗 **Ứng dụng trực tuyến:** https://vuongquocls.github.io/yokdon-biolog/

---

## ✨ Tính năng nổi bật

| Tính năng | Chi tiết |
|---|---|
| 📋 **Ghi nhận loài** | Danh mục 1.746 loài đặc hữu và quý hiếm Yok Đôn, tìm kiếm tức thì, nén ảnh tự động, lưu ngoại tuyến |
| 📐 **Hệ tọa độ VN-2000** | Tích hợp hệ tọa độ Quốc gia VN-2000 (Múi 3°, KTT 108°30') chuẩn Kiểm lâm; tự động chuyển đổi 2 chiều giữa WGS-84 (Lat/Lon) và VN-2000 (X/Y) |
| 🗺️ **Bản đồ GIS Lâm nghiệp** | Tích hợp trọn bộ dữ liệu bản đồ thực tế VQG Yok Đôn từ MapInfo sang WGS84 GeoJSON với 10 lớp chuyên đề bật/tắt linh hoạt |
| 🔍 **Tra cứu & Định vị** | Tìm kiếm nhanh theo số hiệu Tiểu khu (VD: 408), tên Trạm Kiểm lâm, hoặc nhập tọa độ X/Y VN-2000; chạm bản đồ lấy tọa độ vào phiếu ghi nhận |
| 📥 **Xuất dữ liệu GIS** | Xuất GeoJSON, KML (Google Earth), CSV (có sẵn cột VN-2000 X, Y) để nhập trực tiếp vào QGIS, ArcGIS, MapInfo |
| 📶 **Offline 100%** | Service Worker v4 lưu cache toàn bộ ứng dụng, 1.746 loài và tất cả các lớp bản đồ GIS. Hoạt động bình thường khi mất sóng giữa rừng sâu |
| 💰 **Chi phí 0 đồng** | Chạy trên nền tảng GitHub Pages + Google Apps Script + Google Sheets + Google Drive |

---

## 🗺️ Các Lớp Dữ liệu Bản đồ GIS tích hợp

Tất cả các lớp được chuẩn hóa từ nguồn bản đồ số lâm nghiệp VQG Yok Đôn (VN-2000 TM-3 108.5° sang WGS-84 GeoJSON):

1. **Ranh giới Vườn quốc gia** (`layer_vqg_ranh.geojson`, `layer_vqg_bo.geojson`): Ranh giới toàn bộ diện tích 115.545 ha.
2. **18 Trạm & Đội Kiểm lâm** (`layer_tram.geojson`): Trụ sở Hạt Kiểm lâm, Đội Cơ động PCCCR, và các Trạm Kiểm lâm số 01 đến 12, Đắk Ruê, Đắk Na, Đrang Phốk, Sêrêpôk.
3. **Các Phân khu chức năng** (`layer_pkcn_bvnn.geojson`, `layer_pkcn_phst.geojson`, `layer_pkcn_dvhc.geojson`):
   - Phân khu Bảo vệ Nghiêm ngặt (BVNN) — Viền đỏ
   - Phân khu Phục hồi Sinh thái (PHST) — Viền cam vàng
   - Phân khu Dịch vụ Hành chính (DVHC) — Viền xanh dương
4. **Ranh giới Tiểu khu** (`layer_tieukhu.geojson`): Hệ thống ranh giới phân định tiểu khu lâm nghiệp.
5. **Nhãn 218 Tiểu khu** (`layer_tieukhu_diem.geojson`): Tâm và số hiệu từng tiểu khu (TK 408, 409, 410...).
6. **Lô & Khoảnh rừng (DTK)** (`layer_dtk.geojson`): 973 ô lô/khoảnh chi tiết với các thuộc tính: Số Lô, Số Khoảnh, Tiểu khu, Diện tích (ha), Loại đất loại rừng (LDLR), Mục đích sử dụng (MDSD), Địa phận Xã, Huyện, Chủ rừng.
7. **Sông Sêrêpôk & Thủy văn** (`layer_song_srp.geojson`): Dòng sông huyết mạch và hệ thống suối tự nhiên.
8. **Quốc lộ 14C & Tuyến tuần tra** (`layer_ql14c.geojson`, `layer_giaothong.geojson`): Tuyến giao thông huyết mạch và mạng lưới đường tuần tra nội bộ.
9. **Đường biên giới Campuchia** (`layer_biengioi_cpc.geojson`): Tuyến biên giới tiếp giáp Vương quốc Campuchia.
10. **Ranh giới Hành chính Tỉnh & Xã** (`layer_hanhchinh.geojson`, `layer_hctext.geojson`): Địa giới hành chính các xã Buôn Đôn, Krông Na, Ea Huar, Ea Súp, Ea Bung, Đắk Wil (Cư Jút).

---

## 📐 Hệ tọa độ VN-2000 chuẩn Lâm nghiệp

- **Kinh tuyến trục (KTT):** 108°30' (108.5°E)
- **Múi chiếu:** 3 độ
- **Hệ số tỷ lệ k:** 0.9999
- **Độ dời trục:** False Easting = 500.000 m, False Northing = 0 m
- **Ellipsoid / Datum:** WGS84 / Krasovsky (chuẩn Việt Nam)

Anh em kiểm lâm có thể:
- Nhập trực tiếp tọa độ X, Y từ máy GPS cầm tay Garmin vào biểu mẫu;
- Bấm "Lấy GPS", ứng dụng tự tính ra ngay tọa độ VN-2000 X, Y;
- Di chuột hoặc chạm trên bản đồ để xem tọa độ VN-2000 tức thời.

---

## 🏗️ Cấu trúc Kho lưu trữ (Repository)

```
yokdon-biolog/
├── index.html                  # Ứng dụng PWA (Ghi nhận + Bản đồ 10 lớp + Xuất GIS)
├── manifest.json               # Cấu hình PWA Web App
├── sw.js                       # Service Worker v4 (Cache offline toàn diện)
├── catalog.json                # Cơ sở dữ liệu 1.746 loài VQG Yok Đôn
├── icon.svg                    # Biểu tượng ứng dụng
├── Code.gs                     # Mã nguồn Google Apps Script kết nối Google Sheet/Drive
├── layer_vqg_ranh.geojson      # Ranh giới VQG Yok Đôn (Polygon)
├── layer_vqg_bo.geojson        # Đường biên ranh VQG (Line)
├── layer_tram.geojson          # 18 Trạm & Đội Kiểm lâm
├── layer_pkcn_bvnn.geojson     # Phân khu Bảo vệ Nghiêm ngặt
├── layer_pkcn_phst.geojson     # Phân khu Phục hồi Sinh thái
├── layer_pkcn_dvhc.geojson     # Phân khu Dịch vụ Hành chính
├── layer_tieukhu.geojson       # Ranh giới Tiểu khu
├── layer_tieukhu_diem.geojson  # Điểm nhãn 218 Tiểu khu
├── layer_dtk.geojson           # 973 ô Lô/Khoảnh chi tiết (DTK)
├── layer_song_srp.geojson      # Sông Sêrêpôk
├── layer_ql14c.geojson         # Quốc lộ 14C
├── layer_giaothong.geojson     # Hệ thống đường tuần tra
├── layer_biengioi_cpc.geojson  # Đường biên giới Việt Nam - Campuchia
├── layer_hanhchinh.geojson     # Ranh giới hành chính Tỉnh/Xã
└── layer_hctext.geojson        # Địa danh hành chính
```

---

## 📱 Cài đặt lên điện thoại

1. Mở link https://vuongquocls.github.io/yokdon-biolog/ trên trình duyệt (Chrome trên Android hoặc Safari trên iOS).
2. **Android:** Bấm menu 3 chấm `⋮` → chọn **Cài đặt ứng dụng** (hoặc **Thêm vào màn hình chính**).
3. **iPhone:** Bấm nút Chia sẻ (biểu tượng ô vuông mũi tên lên) → chọn **Thêm vào MH chính (Add to Home Screen)**.
4. Mở ứng dụng từ màn hình chính để nạp cache một lần là có thể sử dụng ngoại tuyến hoàn toàn giữa rừng.
