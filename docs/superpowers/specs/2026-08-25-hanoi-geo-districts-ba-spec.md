# Đặc Tả Nghiệp Vụ (BA Specification): Địa Giới 12 Quận Hà Nội, GPS Gần Tôi & Điều Hướng Google Maps

**Mã tài liệu:** `SPEC-GEO-BA-20260825`  
**Phiên bản:** `1.0.0`  
**Tác giả:** Business Analyst / Product Owner (AgentTeams `courthub-geo`)  
**Dự án:** CourtHub Sport Booking Platform  
**Trạng thái:** Approved / Ready for Implementation & QA  

---

## 1. Tổng Quan & Mục Tiêu Nghiệp Vụ (Executive Summary & Business Goals)

### 1.1. Bối cảnh
Người chơi thể thao (Pickleball, Bóng đá, Cầu lông, Tennis) tại khu vực Hà Nội thường có thói quen tìm kiếm sân theo:
1. Khu vực sinh sống / làm việc (theo Quận cụ thể như Cầu Giấy, Nam Từ Liêm, Ba Đình...).
2. Vị trí hiện tại ("Gần tôi nhất trong vòng 3-5 km").
3. Khả năng dẫn đường nhanh qua ứng dụng bản đồ (Google Maps) để đi lại thuận tiện.

### 1.2. Mục tiêu kinh doanh (Business Objectives & OKRs)
- **Rút ngắn thời gian tìm sân:** Giảm từ trung bình ~3.5 phút xuống < 15 giây.
- **Tăng tỷ lệ chuyển đổi (Booking Conversion Rate):** Tăng ít nhất 25% nhờ gợi ý đúng cụm sân gần nhất với chi phí đi lại tối ưu.
- **Giảm tỷ lệ bỏ trang (Bounce Rate):** Giảm 35% trên trang tìm kiếm `/venues`.
- **Tối ưu trải nghiệm Trợ lý AI (NLU):** Trợ lý CourtHub AI hiểu ngữ cảnh địa lý 12 quận, phản hồi chính xác vị trí và dẫn link sân tương ứng.

---

## 2. Danh Sách Đối Tượng Sử Dụng (Personas)

| Persona | Vai trò | Mục tiêu chính | Nỗi đau hiện tại (Pain Points) |
| :--- | :--- | :--- | :--- |
| **Cầu thủ phong trào (Player/Booker)** | Khách hàng đặt sân | Tìm sân gần nhà/công ty, biết cự ly chính xác, mở bản đồ đi ngay. | Phải copy địa chỉ sang Google Maps để xem cự ly và đường đi. |
| **Đội trưởng/Kèo trưởng (Team Leader)** | Đặt sân cho cả đội | Lọc sân theo quận trung gian để các thành viên đều tiện di chuyển. | Khó lọc danh sách sân gom theo từng quận cụ thể. |
| **Chủ cụm sân (Venue Owner)** | Đối tác cung cấp sân | Tiếp cận đúng tệp khách hàng trong bán kính 3-10 km. | Sân ở vị trí đẹp nhưng không hiển thị cự ly đến người dùng. |
| **Trợ lý AI CourtHub** | Virtual Assistant | Nhận diện câu hỏi tự nhiên chứa tên quận và gợi ý sân phù hợp. | Dễ bỏ sót nếu người dùng gõ không dấu hoặc viết tắt. |

---

## 3. Danh Mục Chuẩn 12 Quận Hà Nội & Alias NLU (Data Master)

| STT | Tên Quận Chuẩn | Slug/Code | Tọa độ Trung tâm (Centroid) | Aliases / Viết tắt / Từ khóa NLU |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Ba Đình** | `ba-dinh` | 21.0341, 105.8244 | `ba dinh`, `q. ba dinh`, `quan ba dinh`, `bd` |
| 2 | **Cầu Giấy** | `cau-giay` | 21.0362, 105.7906 | `cau giay`, `q. cau giay`, `quan cau giay`, `cg` |
| 3 | **Đống Đa** | `dong-da` | 21.0181, 105.8299 | `dong da`, `q. dong da`, `quan dong da`, `dd` |
| 4 | **Hai Bà Trưng** | `hai-ba-trung` | 21.0065, 105.8524 | `hai ba trung`, `q. hai ba trung`, `hbt`, `quan hbt` |
| 5 | **Hoàn Kiếm** | `hoan-kiem` | 21.0285, 105.8542 | `hoan kiem`, `q. hoan kiem`, `pho co`, `bo ho`, `hk` |
| 6 | **Thanh Xuân** | `thanh-xuan` | 20.9937, 105.8118 | `thanh xuan`, `q. thanh xuan`, `tx` |
| 7 | **Tây Hồ** | `tay-ho` | 21.0719, 105.8230 | `tay ho`, `q. tay ho`, `ho tay`, `quang an`, `th` |
| 8 | **Hoàng Mai** | `hoang-mai` | 20.9765, 105.8525 | `hoang mai`, `q. hoang mai`, `hm` |
| 9 | **Long Biên** | `long-bien` | 21.0365, 105.8954 | `long bien`, `q. long bien`, `lb` |
| 10 | **Hà Đông** | `ha-dong` | 20.9720, 105.7772 | `ha dong`, `q. ha dong`, `hd` |
| 11 | **Nam Từ Liêm** | `nam-tu-liem` | 21.0135, 105.7656 | `nam tu liem`, `q. nam tu liem`, `my dinh`, `me tri`, `ntl` |
| 12 | **Bắc Từ Liêm** | `bac-tu-liem` | 21.0632, 105.7610 | `bac tu liem`, `q. bac tu liem`, `xuan dinh`, `btl` |

---

## 4. Đặc Tả Chi Tiết User Stories & Acceptance Criteria (Gherkin format)

### US-GEO-01: Lọc danh sách cụm sân theo Quận/Huyện
- **Là:** Người dùng tìm sân trên web CourtHub.
- **Tôi muốn:** Chọn một quận cụ thể trong dropdown danh sách 12 quận Hà Nội.
- **Để:** Xem nhanh các cụm sân nằm trong khu vực mong muốn.

#### Acceptance Criteria (AC):
- **AC 1.1:** Dropdown hiển thị mục mặc định *"Tất cả quận/huyện"* kèm danh sách 12 quận nội thành Hà Nội đã sắp xếp hợp lý.
- **AC 1.2:** Khi chọn quận (ví dụ *"Nam Từ Liêm"*), danh sách sân tự động lọc chỉ hiển thị các sân thuộc quận đó (ví dụ: Cụm Sân Tân Mỹ, Sân Bóng Mễ Trì).
- **AC 1.3:** URL query parameter được cập nhật đồng bộ: `?district=Nam%20T%E1%BB%AB%20Li%C3%AAm` để hỗ trợ bookmark và share link.
- **AC 1.4:** Khi chuyển lại *"Tất cả quận/huyện"*, hệ thống trả lại danh sách toàn bộ các sân theo bộ lọc khác (môn thể thao, ngày giờ).

---

### US-GEO-02: Định vị "📍 Gần tôi" & Bộ lọc bán kính linh hoạt
- **Là:** Người chơi thể thao cần đặt sân gấp hoặc muốn tìm sân gần nơi mình đang đứng.
- **Tôi muốn:** Nhấn nút "📍 Gần tôi" để hệ thống tự lấy tọa độ GPS của tôi và chọn bán kính phù hợp.
- **Để:** Nhận danh sách các sân trong phạm vi khoảng cách mong muốn.

#### Acceptance Criteria (AC):
- **AC 2.1:** Nút *"📍 Gần tôi"* hiển thị rõ ràng trên thanh tìm kiếm của `/venues`.
- **AC 2.2:** Khi bấm nút lần đầu, trình duyệt gọi `navigator.geolocation.getCurrentPosition`.
- **AC 2.3:** Khi người dùng cấp quyền (Allow):
  - Hệ thống lưu tọa độ tạm thời trong State/Session (không lưu cookie nhạy cảm hay database).
  - Xuất hiện thanh chọn bán kính nhanh: `[3 km]`, `[5 km]`, `[10 km]`, `[20 km]`, `[Tất cả]` (Mặc định chọn `5 km`).
  - Danh sách sân được tự động lọc theo công thức Haversine với điều kiện `distanceKm <= radiusKm`.
- **AC 2.4:** Khi chọn lại bán kính khác (ví dụ: từ 5km sang 10km), danh sách sân lập tức cập nhật lại theo bán kính mới.
- **AC 2.5:** Có nút *"Bỏ định vị"* hoặc tắt chế độ "Gần tôi" để quay về chế độ tìm kiếm thông thường.

---

### US-GEO-03: Hiển thị cự ly (Distance Badge) & Sắp xếp ưu tiên khoảng cách
- **Là:** Người dùng đã kích hoạt định vị vị trí.
- **Tôi muốn:** Thấy khoảng cách chính xác từ tôi đến từng cụm sân và danh sách được xếp từ gần nhất đến xa nhất.
- **Để:** Dễ dàng so sánh và đưa ra quyết định chọn sân tiện đường nhất.

#### Acceptance Criteria (AC):
- **AC 3.1:** Khi có tọa độ người dùng, trên mỗi Card cụm sân hiển thị badge cự ly nổi bật: `📍 Cách bạn 1.2 km` (làm tròn 1 chữ số thập phân).
- **AC 3.2:** Tùy chọn sắp xếp (Sort By) tự động bổ sung hoặc ưu tiên chọn *"Gần nhất trước"* (`sortBy=distance`).
- **AC 3.3:** Nếu khoảng cách < 1.0 km (ví dụ 0.4 km), vẫn hiển thị định dạng rõ ràng `0.4 km` hoặc `400m`.

---

### US-GEO-04: Điều hướng 1 chạm qua Google Maps ("🗺️ Chỉ đường")
- **Là:** Người dùng xem thông tin sân trên Card hoặc trang Chi tiết sân `/venues/:slug`.
- **Tôi muốn:** Nhấn nút "Chỉ đường trên Google Maps".
- **Để:** Ứng dụng tự động mở Google Maps với tọa độ đích đã được điền sẵn và sẵn sàng dẫn đường.

#### Acceptance Criteria (AC):
- **AC 4.1:** Nút *"🗺️ Chỉ đường trên Google Maps"* xuất hiện tại:
  - Trang chi tiết sân `/venues/:slug` (nút CTA phụ cạnh địa chỉ cụm sân).
  - Card sân trên trang tìm kiếm (icon map pin / dẫn đường).
- **AC 4.2:** URL dẫn đường được tạo theo chuẩn chính thống:
  `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=driving`
- **AC 4.3:** Thuộc tính liên kết: `target="_blank"` và `rel="noopener noreferrer"` để đảm bảo bảo mật và không mất trang CourtHub hiện tại.
- **AC 4.4:** Trên Mobile Browser (iOS Safari / Android Chrome), liên kết mở trực tiếp app Google Maps Native nếu đã cài đặt.

---

### US-GEO-05: Trợ Lý AI NLU Nhận Diện Địa Giới 12 Quận Tự Nhiên
- **Là:** Người dùng chat với Trợ lý ảo CourtHub AI.
- **Tôi muốn:** Hỏi bằng ngôn từ tự nhiên như *"tìm sân bóng ở cầu giấy"*, *"có sân pickleball nào bên long biên không"*, *"sân tennis thanh xuan"*.
- **Để:** Bot hiểu ngay quận tôi muốn và hiển thị danh sách sân tương ứng kèm đường dẫn.

#### Acceptance Criteria (AC):
- **AC 5.1:** Bot nhận diện đầy đủ 12 quận Hà Nội ở cả dạng tiếng Việt có dấu, không dấu, viết hoa, viết thường.
- **AC 5.2:** Bot nhận diện các từ đồng nghĩa/viết tắt phổ biến: *"phố cổ / bờ hồ"* $ightarrow$ Hoàn Kiếm, *"mỹ đình / mễ trì"* $ightarrow$ Nam Từ Liêm, *"hồ tây / quảng an"* $ightarrow$ Tây Hồ.
- **AC 5.3:** Kết quả trả về của Bot trích xuất đúng trường `location` hoặc `district`, filter đúng danh sách sân và gợi ý các cụm sân tiêu biểu kèm link chi tiết.

---

## 5. Ma Trận Ngoại Lệ & Kịch Bản Xử Lý Lỗi (Edge Cases & Error Handling Matrix)

| Mã ngoại lệ | Tình huống (Edge Case) | Trạng thái kỹ thuật | Cách xử lý UX / Hệ thống (Graceful Degradation) |
| :---: | :--- | :--- | :--- |
| **EC-01** | Người dùng bấm "Từ chối" (Deny) khi trình duyệt hỏi quyền GPS | `GeolocationPositionError.PERMISSION_DENIED` (code 1) | - Hiển thị toast thông báo nhẹ nhàng: *"Không thể lấy vị trí do bạn đã từ chối quyền. Vui lòng chọn quận thủ công từ danh sách."*<br>- Giữ nguyên danh sách sân thông thường, không làm đơ giao diện. |
| **EC-02** | Trình duyệt cũ / Môi trường không hỗ trợ Geolocation | `!navigator.geolocation` | - Ẩn nút "📍 Gần tôi" hoặc hiển thị tooltip: *"Trình duyệt của bạn không hỗ trợ định vị"*.<br>- Cung cấp trọn vẹn bộ lọc Dropdown 12 quận. |
| **EC-03** | GPS yếu / Mất mạng / Quá thời gian định vị (Timeout) | `TIMEOUT` / `POSITION_UNAVAILABLE` | - Cài đặt `timeout: 8000ms`, `maximumAge: 60000ms`.<br>- Nếu fail, hiển thị toast: *"Không thể xác định vị trí hiện tại. Vui lòng thử lại hoặc chọn quận."* |
| **EC-04** | Người dùng ở ngoài khu vực Hà Nội (> 50 km) | `distanceKm > 50` với toàn bộ sân | - Khi chọn bán kính 3-10km sẽ ra 0 kết quả $ightarrow$ Hiển thị Empty State thông minh: *"Bạn đang ở cách Hà Nội {X} km. Xem tất cả cụm sân tại Hà Nội?"* kèm nút bấm chuyển sang `[Tất cả]`. |
| **EC-05** | Không có sân nào trong bán kính đã chọn (ví dụ chọn 3km ở vùng thưa sân) | `filteredVenues.length === 0` | - Empty State: *"Không tìm thấy cụm sân nào trong bán kính {radius} km quanh bạn."*<br>- Gợi ý 2 nút bấm hành động: `[Mở rộng bán kính lên 10km]` hoặc `[Xem tất cả sân Hà Nội]`. |
| **EC-06** | Tọa độ sân trong CSDL bị lỗi hoặc thiếu (`lat/lng = 0` hoặc `null`) | `!lat || !lng` | - Sân đó không tham gia tính Haversine, cự ly hiển thị `N/A` hoặc ẩn badge.<br>- Nút Google Maps sử dụng fallback theo địa chỉ text: `https://www.google.com/maps/search/?api=1&query={encodeURIComponent(address)}`. |
| **EC-07** | Câu hỏi NLU chứa nhiều quận cùng lúc (ví dụ *"sân ở cầu giấy hoặc đống đa"*) | Multi-entity extraction | - NLU ưu tiên quận xuất hiện đầu tiên, hoặc trả về kết quả tổng hợp của cả 2 quận. |
| **EC-08** | Người dùng gõ sai chính tả tên quận (Typo như *"thah xuan"*, *"cau giayyy"*) | Fuzzy match / Levenshtein | - NLU áp dụng thuật toán so khớp chuỗi con (substring) hoặc alias gần nhất để nhận diện đúng quận. |

---

## 6. Quy Tắc Nghiệp Vụ & Thuật Toán Cốt Lõi (Business Rules & Algorithms)

### BR-01: Thuật toán Haversine chuẩn quốc tế
- Bán kính Trái Đất quy ước: $R = 6,371	ext{ km}$.
- Công thức:
  $$Delta	ext{lat} = 	ext{lat}_2 - 	ext{lat}_1, quad Delta	ext{lon} = 	ext{lon}_2 - 	ext{lon}_1$$
  $$a = sin^2left(rac{Delta	ext{lat}}{2}ight) + cos(	ext{lat}_1)cos(	ext{lat}_2)sin^2left(rac{Delta	ext{lon}}{2}ight)$$
  $$c = 2 cdot 	ext{atan2}(sqrt{a}, sqrt{1-a})$$
  $$d = R cdot c$$
- **Quy tắc làm tròn:** Làm tròn 1 chữ số thập phân ($0.1	ext{ km} = 100	ext{ m}$). Ví dụ: $6.48	ext{ km} ightarrow 6.5	ext{ km}$.

### BR-02: Quy chuẩn Google Maps URL Scheme
- Luôn sử dụng Universal URL chính thức của Google:
  `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=driving`
- Tham số `travelmode=driving` giúp người dùng Việt Nam xem ngay lộ trình di chuyển xe máy/ô tô thuận tiện nhất.

### BR-03: Bảo Mật & Quyền Riêng Tư (Privacy Compliance)
- Tọa độ GPS của người dùng chỉ được xử lý in-memory trên Client hoặc truyền qua Query Params của API tìm kiếm trong phiên hiện tại.
- **TUYỆT ĐỐI KHÔNG** lưu trữ lịch sử vị trí GPS chi tiết của cá nhân vào bảng dữ liệu lâu dài nếu không có sự đồng ý tường minh của người dùng.

---

## 7. Kế Hoạch Bàn Giao & Kiểm Thử Nghiệp Vụ (Verification & Sign-off Checklist)

- [x] Đã định nghĩa đầy đủ 12 quận nội thành Hà Nội kèm danh sách Alias NLU.
- [x] Đã chi tiết hóa 5 User Stories cốt lõi theo định dạng Acceptance Criteria rõ ràng.
- [x] Đã hoàn thiện Ma trận 8 Edge Cases cùng giải pháp xử lý UI/UX chi tiết.
- [x] Đã chuẩn hóa công thức Haversine và quy chuẩn Google Maps URL.
- [x] Sẵn sàng chuyển giao cho Platform/DevOps, Backend, Frontend và QA tiến hành thực thi và nghiệm thu.
