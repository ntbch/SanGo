# Kế Hoạch Triển Khai: Địa Giới 12 Quận Hà Nội, Tìm Sân "Gần Tôi" (GPS & Haversine) và Google Maps

> **Dựa trên đặc tả:** `docs/superpowers/specs/2026-08-25-hanoi-geo-districts-design.md`  
> **Mục tiêu:** Tích hợp dữ liệu thực tế 24 cụm sân tại 12 quận nội thành Hà Nội, thuật toán tính cự ly Haversine, tìm sân theo bán kính và điều hướng Google Maps trực tiếp.

---

## Danh Sách Công Việc (Task Breakdown)

### Task 1: `packages/shared` — Helper Haversine & Danh Mục 12 Quận
- **Phạm vi:** `packages/shared/src/index.ts`, `packages/shared/src/geo.ts` (mới), test file `packages/shared/src/geo.spec.ts`.
- **Việc làm:**
  1. Tạo mảng `HANOI_DISTRICTS` (12 quận chuẩn) & helper `HANOI_DISTRICT_ALIASES` (hỗ trợ NLU).
  2. Viết hàm `calculateHaversineDistanceKm(lat1, lon1, lat2, lon2): number` (làm tròn 1 chữ số thập phân).
  3. Viết hàm `buildGoogleMapsUrl(lat, lng, address?): string`.
  4. Unit test: kiểm tra khoảng cách Cầu Giấy $\leftrightarrow$ Hoàn Kiếm (~6.5 km), cùng tọa độ (0.0 km), URL Google Maps đúng định dạng.
- **Gates:** `pnpm --filter @courthub/shared test` & `build` xanh 100%.

---

### Task 2: `apps/api` — Database Migration & Seed 24 Cụm Sân Thực Tế
- **Phạm vi:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/**`, `apps/api/prisma/seed.ts`.
- **Việc làm:**
  1. Thêm `city String @default("Hà Nội")`, `district String @default("Cầu Giấy")` và `@@index([city, district])` vào model `Venue`.
  2. Chạy migration Prisma (`prisma migrate dev --name venue_city_district`).
  3. Cập nhật `prisma/seed.ts` với 24 cụm sân dịch vụ thực tế trên khắp 12 quận Hà Nội (tọa độ GPS Google Maps chuẩn, giờ mở cửa, giá thuê).
- **Gates:** `prisma migrate deploy` & `seed` thành công.

---

### Task 3: `apps/api` — Backend Venues API (Lọc Quận, GPS & Radius)
- **Phạm vi:** `apps/api/src/venues/**` (dto, service, controller, test).
- **Việc làm:**
  1. Mở rộng `VenuesQueryDto`: thêm `city?`, `district?`, `userLat?`, `userLng?`, `radiusKm?`, `sortBy?: 'price_asc' | 'price_desc' | 'distance'`.
  2. `VenuesService.findAll`: áp dụng bộ lọc `city`, `district`; tính khoảng cách `distanceKm` bằng helper Haversine khi có tọa độ người dùng; lọc `distanceKm <= radiusKm`; sắp xếp theo khoảng cách.
  3. Unit test: mock Prisma với 5 sân ở các quận khác nhau $\rightarrow$ assert kết quả lọc theo quận, lọc bán kính 5km, sort gần nhất.
- **Gates:** `pnpm --filter @courthub/api test` xanh 100%.

---

### Task 4: `apps/api` — Nâng Cấp Trợ Lý AI (Rule-based NLU 12 Quận)
- **Phạm vi:** `apps/api/src/ai/rule-based-nlu.provider.ts`, `apps/api/src/ai/rule-based-nlu.provider.spec.ts`.
- **Việc làm:**
  1. Cập nhật NLU nhận diện toàn bộ 12 quận Hà Nội (kể cả có dấu và không dấu: *"ba đình"*, *"nam từ liêm"*, *"bắc từ liêm"*, *"tây hồ"*, *"hà đông"*, *"long biên"*, *"hoàn kiếm"*...).
  2. Unit test: test các câu hỏi tự nhiên như *"tìm sân pickleball ở nam từ liêm"*, *"sân bóng hà đông tối nay"* $\rightarrow$ gán đúng district.
- **Gates:** `pnpm --filter @courthub/api test src/ai` xanh 100%.

---

### Task 5: `apps/web` — Frontend UI (Lọc Quận, "📍 Gần Tôi" & "🗺️ Google Maps")
- **Phạm vi:** `apps/web/src/features/venues/**`, `apps/web/src/features/booking/**`, `apps/web/src/mock/**`.
- **Việc làm:**
  1. Thêm Dropdown chọn Quận/Huyện trên thanh tìm kiếm trang `/venues`.
  2. Thêm nút **"📍 Gần tôi"**: xin quyền Geolocation, hiển thị dải bán kính `[3 km] [5 km] [10 km] [20 km] [Tất cả]`, hiển thị khoảng cách trên Card sân.
  3. Thêm nút **"🗺️ Chỉ đường trên Google Maps"** trên Card sân và trang chi tiết `/venues/:slug` (mở tab Google Maps).
  4. Cập nhật Mock Server (`apps/web/src/mock/data.ts`) đồng bộ 24 cụm sân thực tế tại 12 quận Hà Nội.
  5. Vitest: test component dropdown quận, test filter bán kính, test nút Google Maps trỏ đúng URL.
- **Gates:** `pnpm --filter @courthub/web test` xanh 100%.

---

### Task 6: QA & Tổng Duyệt Chất Lượng Toàn Hệ Thống
- **Phạm vi:** Toàn bộ repo (shared, api, web).
- **Việc làm:**
  1. Chạy full pipeline: `lint`, `typecheck`, `test`, `build`.
  2. Kiểm thử thực tế các kịch bản:
     - Chọn quận "Nam Từ Liêm" $ightarrow$ ra các cụm sân Tân Mỹ, Mễ Trì.
     - Bấm "Gần tôi" $ightarrow$ tính đúng khoảng cách từ vị trí GPS giả lập.
     - Bấm "Chỉ đường trên Google Maps" $ightarrow$ mở URL chính xác.
     - Chat AI "tìm sân ở Tây Hồ" $ightarrow$ trả về các cụm sân D-Sports Quảng An, An Dương.
- **Gates:** 100% test passing, 0 lint/type error, build thành công.
