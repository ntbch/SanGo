# TÀI LIỆU YÊU CẦU NGHIỆP VỤ & ĐẶC TẢ SẢN PHẨM (BRD & PRD)
## TÍNH NĂNG: ĐỊA GIỚI 12 QUẬN HÀ NỘI, GPS GẦN TÔI & ĐIỀU HƯỚNG GOOGLE MAPS

---

- **Mã tài liệu:** `BRD-COURTHUB-GEO-20260825`
- **Phiên bản:** `1.0.0 (Chính thức)`
- **Bộ phận phụ trách:** Business Analyst / Product Owner
- **Đối tượng áp dụng:** Backend (NestJS), Frontend (React), QA/QC, DevOps & AI Engineers
- **Phạm vi triển khai:** Nền tảng Đặt sân thể thao trực tuyến CourtHub (Web & Mobile Web)

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU KINH DOANH (BUSINESS CONTEXT & GOALS)

### 1.1. Bối cảnh thị trường
Tại các đô thị lớn như Hà Nội, nhu cầu tìm kiếm và đặt sân thể thao (Pickleball, Bóng đá 5-7 người, Cầu lông, Tennis) có tính chất cục bộ rất cao. Người chơi thường chỉ sẵn sàng di chuyển trong bán kính từ **3 km đến 8 km** quanh nơi ở hoặc cơ quan. 

Trước đây, CourtHub chỉ hỗ trợ tìm kiếm chung chung hoặc theo tên sân, khiến:
1. Người dùng mất trung bình **3.5 phút** để tra cứu địa chỉ trên bản đồ ngoài.
2. Tỷ lệ thoát trang (Bounce rate) tại trang danh sách sân cao (~42%).
3. Khó khăn khi mở rộng mạng lưới cụm sân sang các quận mới.

### 1.2. Mục tiêu kinh doanh cốt lõi (Core Business Objectives & KPIs)
- **Tăng tỷ lệ chuyển đổi đặt sân (Booking Conversion Rate):** Kỳ vọng tăng $ge 25\%$ nhờ đưa các cụm sân gần nhất tới mắt người dùng ngay lần chạm đầu tiên.
- **Rút ngắn thời gian ra quyết định (Time-to-Book):** Giảm từ 3.5 phút xuống $< 30\text{ giây}$ (bao gồm cả lọc quận hoặc định vị GPS).
- **Tối ưu trải nghiệm điều hướng (Navigation Experience):** 100% cụm sân hỗ trợ mở chỉ đường 1-chạm (1-click navigation) trên Google Maps.
- **Nâng tầm Trợ lý ảo AI (Conversational Booking):** Nhận diện chính xác 100% tên 12 quận nội thành Hà Nội trong câu hỏi tự nhiên (có dấu / không dấu / viết tắt).

---

## 2. DANH MỤC DỮ LIỆU CHUẨN: 12 QUẬN NỘI THÀNH HÀ NỘI (MASTER DATA)

Hệ thống CourtHub chuẩn hóa danh mục 12 quận nội thành Hà Nội làm nền tảng cho CSDL (Prisma), Bộ lọc UI, và Từ điển AI NLU.

| STT | Tên Quận Chuẩn | Mã Định Danh (Slug) | Tọa độ Trung tâm (Centroid) | Từ khóa nhận diện / Aliases NLU |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Ba Đình** | `ba-dinh` | `21.0341, 105.8244` | `ba dinh`, `q. ba dinh`, `quan ba dinh`, `bd` |
| **2** | **Cầu Giấy** | `cau-giay` | `21.0362, 105.7906` | `cau giay`, `q. cau giay`, `quan cau giay`, `cg` |
| **3** | **Đống Đa** | `dong-da` | `21.0181, 105.8299` | `dong da`, `q. dong da`, `quan dong da`, `dd` |
| **4** | **Hai Bà Trưng** | `hai-ba-trung` | `21.0065, 105.8524` | `hai ba trung`, `q. hai ba trung`, `hbt`, `quan hbt` |
| **5** | **Hoàn Kiếm** | `hoan-kiem` | `21.0285, 105.8542` | `hoan kiem`, `q. hoan kiem`, `pho co`, `bo ho`, `hk` |
| **6** | **Thanh Xuân** | `thanh-xuan` | `20.9937, 105.8118` | `thanh xuan`, `q. thanh xuan`, `tx` |
| **7** | **Tây Hồ** | `tay-ho` | `21.0719, 105.8230` | `tay ho`, `q. tay ho`, `ho tay`, `quang an`, `th` |
| **8** | **Hoàng Mai** | `hoang-mai` | `20.9765, 105.8525` | `hoang mai`, `q. hoang mai`, `hm` |
| **9** | **Long Biên** | `long-bien` | `21.0365, 105.8954` | `long bien`, `q. long bien`, `lb` |
| **10** | **Hà Đông** | `ha-dong` | `20.9720, 105.7772` | `ha dong`, `q. ha dong`, `hd` |
| **11** | **Nam Từ Liêm** | `nam-tu-liem` | `21.0135, 105.7656` | `nam tu liem`, `q. nam tu liem`, `my dinh`, `me tri`, `ntl` |
| **12** | **Bắc Từ Liêm** | `bac-tu-liem` | `21.0632, 105.7610` | `bac tu liem`, `q. bac tu liem`, `xuan dinh`, `btl` |

*Ghi chú CSDL:* Thành phố mặc định là `Hà Nội`. Model `Venue` có 2 trường `city` (String) và `district` (String) kèm index `@@index([city, district])` để tăng tốc truy vấn.

---

## 3. DANH SÁCH USER STORIES & TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

### US-01: Lọc cụm sân theo Quận/Huyện trên thanh tìm kiếm
- **Actor:** Người chơi thể thao (Booker).
- **Mô tả:** Tôi muốn chọn Quận cụ thể từ Dropdown để danh sách sân chỉ hiển thị các cụm sân nằm trong quận đó.
- **Tiêu chí nghiệm thu (AC):**
  - **AC-01.1:** Dropdown trên thanh Filter chứa tùy chọn mặc định *"Tất cả Quận/Huyện"* và danh sách 12 quận Hà Nội.
  - **AC-01.2:** Khi người dùng chọn 1 quận (vd: *"Cầu Giấy"*), danh sách sân lập tức được lọc lại chỉ còn các sân có `district = 'Cầu Giấy'`.
  - **AC-01.3:** Đồng bộ URL Query: URL trên trình duyệt cập nhật `?district=C%E1%BA%A7u%20Gi%E1%BA%A5y` để chia sẻ link hoặc refresh trang không mất trạng thái.
  - **AC-01.4:** Kết hợp mượt mà với các bộ lọc khác (Môn thể thao, Bảng giá, Thời gian trống).

---

### US-02: Định vị "📍 Gần tôi" & Lọc theo Bán kính (Radius Filter)
- **Actor:** Người chơi thể thao đang ở văn phòng hoặc trên đường.
- **Mô tả:** Tôi muốn nhấn nút "📍 Gần tôi" để hệ thống tự nhận diện vị trí GPS của tôi và cho phép tôi lọc theo bán kính 3km, 5km, 10km, 20km.
- **Tiêu chí nghiệm thu (AC):**
  - **AC-02.1:** Khi bấm nút *"📍 Gần tôi"*, hệ thống kích hoạt yêu cầu cấp quyền `navigator.geolocation.getCurrentPosition`.
  - **AC-02.2:** Sau khi người dùng Allow:
    - Nút *"Gần tôi"* đổi sang trạng thái Active (highlight màu thương hiệu).
    - Xuất hiện dải nút chọn bán kính nhanh: `[3 km]`, `[5 km]` *(mặc định)*, `[10 km]`, `[20 km]`, `[Tất cả]`.
    - Danh sách sân được lọc tự động theo điều kiện: $\text{distanceKm} \le \text{radiusKm}$.
  - **AC-02.3:** Khi bấm chuyển đổi giữa các nút bán kính (vd: từ 5km sang 10km), danh sách sân phản hồi ngay lập tức ($< 100\text{ms}$).
  - **AC-02.4:** Có nút hủy định vị (Clear GPS) để quay trở về danh sách toàn bộ sân theo quận.

---

### US-03: Hiển thị cự ly (Distance Badge) & Tự động Sắp xếp theo Khoảng cách
- **Actor:** Người chơi thể thao đã bật định vị.
- **Mô tả:** Tôi muốn nhìn thấy số km chính xác từ vị trí của tôi đến từng cụm sân và các sân gần nhất được đẩy lên đầu.
- **Tiêu chí nghiệm thu (AC):**
  - **AC-03.1:** Trên mỗi Card cụm sân tại trang danh sách xuất hiện Badge cự ly trực quan (vd: `📍 Cách bạn 1.5 km`).
  - **AC-03.2:** Tùy chọn sắp xếp (Sort by) tự động chuyển sang hoặc ưu tiên *"Gần nhất trước"* (`sortBy=distance`).
  - **AC-03.3:** Quy chuẩn làm tròn: Khoảng cách được tính toán theo công thức Haversine và làm tròn đến 1 chữ số thập phân (vd: `0.8 km`, `3.2 km`, `12.0 km`).

---

### US-04: Điều hướng 1-chạm qua Google Maps ("🗺️ Chỉ đường")
- **Actor:** Người chơi thể thao cần di chuyển đến sân.
- **Mô tả:** Tôi muốn bấm nút "Chỉ đường trên Google Maps" để ứng dụng mở bản đồ và tự động tạo tuyến đường đi.
- **Tiêu chí nghiệm thu (AC):**
  - **AC-04.1:** Nút *"🗺️ Chỉ đường trên Google Maps"* hiển thị trên:
    - Trang chi tiết cụm sân (`/venues/:slug`): Nút bấm rõ ràng cạnh khối địa chỉ.
    - Card sân trên trang tìm kiếm: Icon/link điều hướng nhanh.
  - **AC-04.2:** Cấu trúc đường dẫn chuẩn Universal Directions URL:
    `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=driving`
  - **AC-04.3:** Thuộc tính mở link: `target="_blank"` và `rel="noopener noreferrer"`.
  - **AC-04.4:** Trên Mobile, liên kết kích hoạt Deep-link mở trực tiếp ứng dụng Google Maps đã cài đặt trên máy.

---

### US-05: Trợ Lý AI NLU Nhận Diện Tự Nhiên Địa Giới 12 Quận
- **Actor:** Người dùng tương tác qua khung chat Trợ lý CourtHub AI.
- **Mô tả:** Tôi muốn hỏi bằng ngôn ngữ tự nhiên (vd: *"tìm sân pickleball gần cầu giấy"*, *"sân bóng đá nam từ liêm tối nay"*) và Bot trả về chính xác các cụm sân ở khu vực đó.
- **Tiêu chí nghiệm thu (AC):**
  - **AC-05.1:** Bot nhận diện được toàn bộ 12 quận kể cả có dấu, không dấu, viết hoa, viết thường.
  - **AC-05.2:** Bot nhận diện được các địa danh quen thuộc tương đương:
    - *"Mỹ Đình / Mễ Trì"* $\rightarrow$ Quận Nam Từ Liêm
    - *"Hồ Tây / Quảng An"* $\rightarrow$ Quận Tây Hồ
    - *"Phố Cổ / Bờ Hồ"* $\rightarrow$ Quận Hoàn Kiếm
    - *"Xuân Đỉnh / Cổ Nhuế"* $\rightarrow$ Quận Bắc Từ Liêm
  - **AC-05.3:** Bot trả lời bằng văn phong thân thiện, liệt kê top sân phù hợp kèm link xem chi tiết và nút chỉ đường.

---

## 4. MA TRẬN NGOẠI LỆ & XỬ LÝ LỖI (EDGE CASES & ERROR HANDLING)

| Mã | Tình huống ngoại lệ (Edge Case) | Trạng thái kỹ thuật | Quy cách ứng xử UX / Hệ thống |
| :---: | :--- | :--- | :--- |
| **EC-01** | Người dùng từ chối (Block / Deny) quyền Geolocation | `PERMISSION_DENIED` (Code 1) | - Hiển thị Banner/Toast thông báo thân thiện: *"Không thể lấy vị trí do bạn chưa cấp quyền. Bạn có thể chọn Quận từ danh sách."*<br>- Không chặn luồng, giữ nguyên danh sách sân thông thường. |
| **EC-02** | Trình duyệt không hỗ trợ Geolocation API | `!navigator.geolocation` | - Ẩn nút "📍 Gần tôi" hoặc chuyển sang trạng thái disabled với tooltip giải thích.<br>- Hướng dẫn người dùng lọc theo Dropdown Quận. |
| **EC-03** | Định vị bị quá thời gian (GPS Timeout / Weak Signal) | `TIMEOUT` / `POSITION_UNAVAILABLE` | - Cài đặt Timeout = 8 giây.<br>- Thông báo: *"Định vị quá thời gian chờ. Vui lòng kiểm tra lại GPS hoặc chọn quận thủ công."* |
| **EC-04** | Người dùng ở ngoài Hà Nội ($> 50\text{ km}$) | `distanceKm > 50` | - Khi chọn bán kính hẹp (3-10km) sẽ ra 0 kết quả $\rightarrow$ Hiển thị Empty State thông minh: *"Bạn đang ở cách Hà Nội {X} km. Xem tất cả các sân tại Hà Nội?"* kèm nút bấm `[Xem tất cả]`. |
| **EC-05** | Không có sân nào trong bán kính đã chọn | `filteredList.length === 0` | - Hiển thị Empty State: *"Không có cụm sân nào trong bán kính {radius} km quanh bạn."*<br>- Cung cấp nút CTA: `[Mở rộng bán kính lên 10km]` hoặc `[Xem tất cả sân]`. |
| **EC-06** | Sân bị thiếu dữ liệu tọa độ (`lat/lng = null` hoặc `0`) | Data fallback | - Không hiển thị badge cự ly cho sân đó.<br>- Nút Google Maps fallback sang tìm kiếm theo địa chỉ chuỗi: `https://www.google.com/maps/search/?api=1&query={encodeURIComponent(address)}`. |
| **EC-07** | Nhập câu lệnh AI chứa nhiều địa danh trái ngược | NLU Conflict | - NLU ưu tiên quận xuất hiện đầu tiên hoặc hỏi lại người dùng để làm rõ. |

---

## 5. QUY CHUẨN THUẬT TOÁN & BẢO MẬT DỮ LIỆU (ALGORITHMS & PRIVACY RULES)

### 5.1. Thuật toán Haversine chuẩn quốc tế
- Hằng số bán kính Trái Đất: $R = 6371\text{ km}$.
- Công thức:
  $$\Delta\text{lat} = \frac{(\text{lat}_2 - \text{lat}_1) \cdot \pi}{180}, \quad \Delta\text{lon} = \frac{(\text{lon}_2 - \text{lon}_1) \cdot \pi}{180}$$
  $$a = \sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos\left(\frac{\text{lat}_1 \cdot \pi}{180}\right) \cdot \cos\left(\frac{\text{lat}_2 \cdot \pi}{180}\right) \cdot \sin^2\left(\frac{\Delta\text{lon}}{2}\right)$$
  $$c = 2 \cdot \text{atan2}(\sqrt{a}, \sqrt{1-a})$$
  $$d = R \cdot c$$
- **Định dạng hiển thị:** `Math.round(d * 10) / 10` (làm tròn 1 chữ số sau dấu phẩy).

### 5.2. Chính sách bảo mật quyền riêng tư (Privacy & Data Governance)
- Tọa độ GPS của người dùng chỉ được sử dụng cho tính toán thời gian thực (In-memory trên Frontend hoặc truyền qua Query Params đến API).
- **Tuyệt đối KHÔNG:** Ghi log tọa độ GPS chi tiết của người dùng vào CSDL lưu trữ lâu dài hoặc bán cho bên thứ ba.

---

## 6. DANH SÁCH KIỂM TRA NGHIỆM THU (QA / ACCEPTANCE TEST CHECKLIST)

| STT | Hạng mục kiểm thử (Test Case) | Tiêu chí đạt (Pass Criteria) | Vai trò đối soát |
| :---: | :--- | :--- | :---: |
| **TC-01** | Test Helper Haversine trong `packages/shared` | Khoảng cách Cầu Giấy $\leftrightarrow$ Hoàn Kiếm $\approx 6.5\text{ km}$; cùng tọa độ $= 0.0\text{ km}$. | DevOps / Shared |
| **TC-02** | Seed 24 Cụm sân thực tế tại 12 Quận Hà Nội | Đủ 12 quận, mỗi quận tối thiểu 2 sân thực tế, tọa độ Google Maps chuẩn, đủ 4 bộ môn. | DevOps / DB |
| **TC-03** | Backend API `GET /api/v1/venues` lọc quận & cự ly | Filter đúng theo `district`, tính `distanceKm`, filter `radiusKm` và sort `distance`. | Backend |
| **TC-04** | AI NLU nhận diện 12 Quận Hà Nội | Nhận diện đúng 12 quận có dấu/không dấu/từ đồng nghĩa, trích xuất đúng `location`. | Backend / AI |
| **TC-05** | UI Dropdown 12 Quận & Nút "Gần tôi" | Lọc mượt mà, dải bán kính 3-20km phản hồi tức thì, badge cự ly hiển thị chuẩn. | Frontend |
| **TC-06** | Nút Chỉ đường Google Maps | Click mở đúng tab Google Maps chứa tọa độ đích và chế độ driving. | Frontend |
| **TC-07** | Xử lý ngoại lệ (Từ chối GPS, Ngoài vùng phủ sóng) | Hiển thị Toast/Empty state đúng đặc tả, không crash ứng dụng. | QA / All |
