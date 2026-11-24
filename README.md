# 🌿 Yok Đôn BioLog — Giám sát Đa dạng sinh học & Hệ thống Bản đồ Lâm nghiệp

**PWA chuyên dụng, hoạt động 100% offline**, tích hợp đầy đủ **Hệ thống dữ liệu GIS & Hệ tọa độ VN-2000 7 tham số chuẩn Quốc gia** phục vụ công tác tuần tra, bảo tồn và nghiên cứu khoa học tại **Vườn quốc gia Yok Đôn** (Đắk Lắk & Đắk Nông).

🔗 **Ứng dụng trực tuyến:** https://vuongquocls.github.io/yokdon-biolog/

---

## ✨ Tính năng nổi bật

| Tính năng | Chi tiết |
|---|---|
| 📋 **Ghi nhận loài** | Danh mục **1.752 loài** đặc hữu và quý hiếm Yok Đôn (thực vật, thú, chim, bò sát, cá...), tìm kiếm tức thì, nén ảnh tự động, lưu ngoại tuyến an toàn |
| 🤖 **Nhận diện loài & AI** | Hỗ trợ chụp ảnh hiện trường và nhận diện qua **Google Gemini 2.5 Flash Vision** (xử lý an toàn qua backend Google Apps Script với `GEMINI_API_KEY` trong Script Properties); tự động gợi ý danh mục chuẩn Yok Đôn khi offline |
| 📐 **Hệ tọa độ VN-2000 7 tham số** | Tích hợp thuật toán chuyển đổi Bursa-Wolf 7 tham số chuẩn **QĐ 05/2007/QĐ-BTNMT** (KTT 108°30', Múi 3°, $k=0.9999$); triệt tiêu hoàn toàn sai số lệch vị trí, khớp tuyệt đối với máy Garmin và bản đồ lâm nghiệp |
| 🗺️ **Bản đồ GIS Lâm nghiệp** | Tích hợp trọn bộ dữ liệu bản đồ VQG Yok Đôn chuyển đổi từ MapInfo sang GeoJSON với các lớp chuyên đề (Ranh giới VQG, 16 Trạm KL & Trạm KLCĐ, Phân khu BVNN/PHST/DVHC, Ranh giới & Nhãn Tiểu khu, Lô/Khoảnh DTK, Sông Sêrêpôk, Quốc lộ 14C...) |
| 📍 **Vị trí của tôi & Tra cứu** | Nút định vị GPS trực tiếp vị trí hiện tại với hiệu ứng sóng radar; tìm kiếm nhanh theo số hiệu Tiểu khu (VD: 408), tên Trạm Kiểm lâm, hoặc nhập tọa độ X/Y VN-2000 |
| 📥 **Xuất dữ liệu GIS** | Xuất GeoJSON, KML (Google Earth), CSV (có sẵn cột VN-2000 X, Y) đồng bộ trực tiếp toàn bộ dữ liệu quan trắc từ Google Sheet và bộ nhớ ngoại tuyến |
| 📶 **Offline an toàn (SW v8)** | Service Worker v8 tách nạp Core Assets và Lazy Assets với `Promise.allSettled`, nút đồng bộ 1 chạm thông minh `🟢 Trực tuyến • Đồng bộ` trên thanh tiêu đề |
| 🔒 **Bảo mật & Chống spam** | Bảo mật API Key trên máy chủ Apps Script, tùy chọn API Secret Token chống spam, `TextFinder` chống trùng lặp toàn diện |
| 💰 **Chi phí 0 đồng** | Chạy trên nền tảng GitHub Pages + Google Apps Script + Google Sheets + Google Drive |

---

## 🗺️ Các Lớp Dữ liệu Bản đồ GIS tích hợp

Tất cả các lớp được chuẩn hóa từ nguồn bản đồ số lâm nghiệp VQG Yok Đôn (VN-2000 TM-3 KTT 108.5° sang WGS-84 GeoJSON):

1. **Ranh giới Vườn quốc gia** (`layer_vqg_ranh.geojson`, `layer_vqg_bo.geojson`): Ranh giới toàn bộ diện tích 115.545 ha.
2. **16 Trạm KL & 01 Trạm KLCĐ-PCCCR (QĐ 684)** (`layer_tram.geojson`):
   - **Trụ sở Hạt Kiểm lâm** VQG Yok Đôn;
   - **Trạm Kiểm lâm cơ động và PCCCR**;
   - **16 Trạm Kiểm lâm địa bàn:** Trạm số 01 đến số 12, Trạm Đắk Ruê, Trạm Đắk Na, Trạm Đrăng Phốk, Trạm Sê Rê Pôk.
3. **Các Phân khu chức năng** (`layer_pkcn_bvnn.geojson`, `layer_pkcn_phst.geojson`, `layer_pkcn_dvhc.geojson`):
   - Phân khu Bảo vệ Nghiêm ngặt (BVNN) — Viền đỏ
   - Phân khu Phục hồi Sinh thái (PHST) — Viền cam vàng
   - Phân khu Dịch vụ Hành chính (DVHC) — Viền xanh dương
4. **Ranh giới Tiểu khu** (`layer_tieukhu.geojson`): Hệ thống ranh giới phân định tiểu khu lâm nghiệp.
5. **Nhãn Tiểu khu** (`layer_tieukhu_diem.geojson`): Tâm và số hiệu từng tiểu khu chuẩn hóa (TK 408, 409, 410, các tiểu khu phía Nam 827, 828, 829, 830, 836...).
6. **Lô & Khoảnh rừng (DTK)** (`layer_dtk.geojson`): 973 ô lô/khoảnh chi tiết với các thuộc tính: Số Lô, Số Khoảnh, Tiểu khu, Diện tích (ha), Loại đất loại rừng (LDLR), Mục đích sử dụng (MDSD), Địa phận Xã, Huyện, Chủ rừng.
7. **Sông Sêrêpôk & Thủy văn** (`layer_song_srp.geojson`): Dòng sông huyết mạch và hệ thống suối tự nhiên.
8. **Quốc lộ 14C** (`layer_ql14c.geojson`): Tuyến đường vành đai phía Tây VQG Yok Đôn.
9. **Đường biên giới Campuchia** (`layer_biengioi_cpc.geojson`): Tuyến biên giới tiếp giáp Vương quốc Campuchia.
10. **Ranh giới Hành chính Tỉnh & Xã** (`layer_hanhchinh.geojson`, `layer_hctext.geojson`): Địa giới hành chính các xã Buôn Đôn, Krông Na, Ea Huar, Ea Súp, Ea Bung, Đắk Wil (Cư Jút).

---

## 📐 Hệ tọa độ VN-2000 chuẩn 7 tham số Bursa-Wolf

Ứng dụng áp dụng chính xác thuật toán chuyển đổi tọa độ trắc địa 2 chiều theo **Quyết định 05/2007/QĐ-BTNMT** của Bộ Tài nguyên và Môi trường:

- **Kinh tuyến trục (KTT):** 108°30' (108.5°E)
- **Múi chiếu:** 3 độ, Hệ số tỷ lệ $k_0 = 0.9999$
- **Độ dời gốc:** False Easting $X_0 = 500.000\text{ m}$, False Northing $Y_0 = 0\text{ m}$
- **7 Tham số Bursa-Wolf (WGS-84 $\leftrightarrow$ VN-2000):**
  - $\Delta X = -191.90441429\text{ m}$
  - $\Delta Y = -39.30318279\text{ m}$
  - $\Delta Z = -111.45032835\text{ m}$
  - $\omega_X = +0.00928836''$
  - $\omega_Y = -0.01975479''$
  - $\omega_Z = +0.00427372''$
  - $s = +0.252906278\text{ ppm}$

Nhờ bộ 7 tham số này, ứng dụng triệt tiêu hoàn toàn sai số lệch vị trí ~225 m của các phép chiếu đơn giản trước đây, đảm bảo:
- Nhập trực tiếp tọa độ X, Y từ máy định vị GPS Garmin vào biểu mẫu;
- Bấm "Lấy GPS", ứng dụng tính ra ngay tọa độ VN-2000 X, Y chuẩn xác;
- Chạm bất kỳ điểm nào trên bản đồ để tra cứu tọa độ song song cả 2 hệ WGS-84 và VN-2000.

---

## 🏗️ Cấu trúc Kho lưu trữ (Repository)

```
yokdon-biolog/
├── index.html                  # Ứng dụng PWA (Ghi nhận + Bản đồ 9 lớp + Gemini AI + Xuất GIS)
├── manifest.json               # Cấu hình PWA Web App
├── sw.js                       # Service Worker v8 (Cache an toàn, tách Lazy assets)
├── catalog.json                # Cơ sở dữ liệu 1.752 loài VQG Yok Đôn
├── icon.svg                    # Biểu tượng ứng dụng
├── Code.gs                     # Backend Google Apps Script (Gemini Vision, records GIS, TextFinder chống trùng)
├── layer_vqg_ranh.geojson      # Ranh giới VQG Yok Đôn (Polygon)
├── layer_vqg_bo.geojson        # Đường biên ranh VQG (Line)
├── layer_tram.geojson          # 16 Trạm KL & 01 Trạm KLCĐ-PCCCR (QĐ 684) + Hạt
├── layer_pkcn_bvnn.geojson     # Phân khu Bảo vệ Nghiêm ngặt
├── layer_pkcn_phst.geojson     # Phân khu Phục hồi Sinh thái
├── layer_pkcn_dvhc.geojson     # Phân khu Dịch vụ Hành chính
├── layer_tieukhu.geojson       # Ranh giới Tiểu khu
├── layer_tieukhu_diem.geojson  # Điểm nhãn Tiểu khu chuẩn hóa
├── layer_dtk.geojson           # 973 ô Lô/Khoảnh chi tiết (DTK - Lazy cached)
├── layer_song_srp.geojson      # Sông Sêrêpôk (Lazy cached)
├── layer_ql14c.geojson         # Quốc lộ 14C
├── layer_biengioi_cpc.geojson  # Đường biên giới Việt Nam - Campuchia
├── layer_hanhchinh.geojson     # Ranh giới hành chính Tỉnh/Xã
└── layer_hctext.geojson        # Địa danh hành chính
```

---

## 📱 Cài đặt lên điện thoại

1. Mở link https://vuongquocls.github.io/yokdon-biolog/ trên trình duyệt (Chrome trên Android hoặc Safari trên iOS).
2. **Android:** Bấm menu 3 chấm `⋮` → chọn **Cài đặt ứng dụng** (hoặc **Thêm vào màn hình chính**).
3. **iPhone:** Bấm nút Chia sẻ (biểu tượng ô vuông mũi tên lên) → chọn **Thêm vào MH chính (Add to Home Screen)**.
4. Mở ứng dụng từ màn hình chính để nạp cache một lần là có thể sử dụng ngoại tuyến hoàn toàn giữa rừng sâu.
