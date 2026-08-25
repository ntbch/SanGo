# Thiết Kế Kiến Trúc: Bản Đồ Địa Giới 12 Quận Hà Nội, Tìm Sân "Gần Tôi" (GPS & Haversine) và Điều Hướng Google Maps

## 1. Mục Tiêu & Phạm Vi
- **Phạm vi địa lý:** 12 quận nội thành Hà Nội (Ba Đình, Cầu Giấy, Đống Đa, Hai Bà Trưng, Hoàn Kiếm, Thanh Xuân, Tây Hồ, Hoàng Mai, Long Biên, Hà Đông, Nam Từ Liêm, Bắc Từ Liêm) với 24 cụm sân dịch vụ thương mại thực tế 100% (tên thật, địa chỉ thật, tọa độ Google Maps chuẩn). Cấu trúc sẵn sàng mở rộng TP.HCM sau này.
- **Tính năng cốt lõi:**
  1. Lọc sân theo Thành phố & Quận/Huyện.
  2. Tìm kiếm sân "📍 Gần tôi": xin quyền Geolocation trình duyệt, tính cự ly đường chim bay (Haversine Formula), lọc theo bán kính (3km / 5km / 10km / 20km / Tất cả) và sắp xếp ưu tiên gần nhất.
  3. Điều hướng Google Maps: nút "🗺️ Chỉ đường trên Google Maps" trên trang chi tiết sân và card sân, mở URL scheme chuẩn xác.
  4. Nâng cấp Trợ lý AI (NLU): nhận diện thông minh 12 quận Hà Nội khi người dùng hỏi tự nhiên.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

### 2.1. Thay đổi Model `Venue` trong `apps/api/prisma/schema.prisma`
```prisma
model Venue {
  id             String      @id @default(uuid()) @db.Uuid
  ownerId        String      @db.Uuid
  name           String
  slug           String      @unique
  address        String
  city           String      @default("Hà Nội")
  district       String      @default("Cầu Giấy")
  lat            Float
  lng            Float
  openMinute     Int
  closeMinute    Int
  images         String[]
  amenities      String[]
  depositPercent Int         @default(30)
  status         VenueStatus @default(PENDING)
  rejectReason   String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  owner   User     @relation(fields: [ownerId], references: [id])
  courts  Court[]
  reviews Review[]

  @@index([status])
  @@index([city, district])
  @@map("venues")
}
```

### 2.2. Dữ liệu thực tế 24 cụm sân tại 12 Quận Hà Nội (`prisma/seed.ts` & `mock-data.ts`)
Được cập nhật đầy đủ 24 cụm sân dịch vụ thực tế (12 quận nội thành Hà Nội, mỗi quận 2 sân):
- Tọa độ Lat/Lng chuẩn xác từ Google Maps.
- Phân bổ đủ 4 bộ môn: PICKLEBALL, FOOTBALL5, FOOTBALL7, BADMINTON, TENNIS.
- Giờ mở cửa thực tế (05:00/06:00 - 22:00/23:00) và bảng giá minh bạch.

---

## 3. Thiết Kế Backend API & Thuật Toán (`apps/api`)

### 3.1. Thuật toán Haversine (Tính cự ly địa lý)
Đặt helper `calculateHaversineDistanceKm(lat1, lon1, lat2, lon2)` vào `packages/shared`:
```ts
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Làm tròn 1 chữ số thập phân
}
```

### 3.2. Mở rộng Endpoint `GET /api/v1/venues`
- **Query DTO (`VenuesQueryDto`):**
  - `city?: string` (Mặc định lọc theo thành phố)
  - `district?: string` (Lọc theo quận)
  - `userLat?: number` & `userLng?: number` (Tọa độ người dùng)
  - `radiusKm?: number` (Bán kính tìm kiếm)
  - `sortBy?: 'price_asc' | 'price_desc' | 'distance'`
- **Logic xử lý tại `VenuesService.findAll`:**
  - Lọc `where: { status: 'APPROVED', city?, district?, sportType? }`.
  - Nếu có `userLat` & `userLng`: tính `distanceKm` cho từng sân.
  - Nếu có `radiusKm`: filter `distanceKm <= radiusKm`.
  - Sắp xếp theo `sortBy === 'distance'` (tăng dần theo khoảng cách).

### 3.3. Nâng cấp Trợ lý AI (`RuleBasedNluProvider`)
Mở rộng từ điển nhận diện 12 quận Hà Nội (kể cả viết không dấu):
- `ba đình`, `cầu giấy`, `đống đa`, `hai bà trưng`, `hoàn kiếm`, `thanh xuân`, `tây hồ`, `hoàng mai`, `long biên`, `hà đông`, `nam từ liêm`, `bắc từ liêm`...
- Tự động gán `location` và lọc đúng cụm sân ở quận tương ứng.

---

## 4. Thiết Kế Frontend UI/UX (`apps/web`)

### 4.1. Bộ lọc Địa lý & Nút "📍 Gần tôi" trên trang `/venues`
- **Thanh tìm kiếm nâng cao:**
  - Dropdown **Chọn Quận/Huyện** (12 quận Hà Nội, sắp xếp chuẩn).
  - Nút bấm **"📍 Gần tôi"**:
    - Gọi `navigator.geolocation.getCurrentPosition`.
    - Hiển thị thanh chọn bán kính: `[3 km] [5 km] [10 km] [20 km] [Tất cả]`.
    - Tự động kích hoạt sắp xếp `Gần nhất trước`.
  - Hiển thị badge cự ly trên Card sân: `📍 Cách bạn 1.5 km • Cầu Giấy, Hà Nội`.

### 4.2. Nút Điều Hướng Google Maps
- **Vị trí:**
  - Trang chi tiết sân `/venues/:slug` (nằm nổi bật cạnh dòng địa chỉ).
  - Card sân (icon dẫn đường nhỏ cạnh địa chỉ).
- **Cơ chế hoạt động:**
  - Tạo URL chuẩn Google Maps Directions:
    ```ts
    export function buildGoogleMapsUrl(lat: number, lng: number, address: string): string {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    ```
  - Mở trong tab mới `target="_blank" rel="noopener noreferrer"`.
  - Trên thiết bị di động, tự động kích hoạt ứng dụng Google Maps nếu đã cài đặt.

---

## 5. Chiến Lược Kiểm Thử (Testing Strategy)
- **Unit Tests:**
  - `calculateHaversineDistanceKm`: kiểm tra khoảng cách giữa Hoàn Kiếm và Cầu Giấy (~6.5 km), kiểm tra cùng 1 tọa độ trả về 0 km.
  - `VenuesService`: lọc đúng theo quận, lọc theo bán kính, sort theo khoảng cách.
  - `RuleBasedNluProvider`: nhận diện đúng 12 quận Hà Nội không dấu và có dấu.
- **Frontend Tests:**
  - Render dropdown 12 quận.
  - Giả lập Geolocation thành công $ightarrow$ render đúng dải bán kính và badge khoảng cách.
  - Nút Google Maps trỏ đúng URL chứa tọa độ sân.
- **Regression Gates:** Toàn bộ test suite cũ (82 API + 91 Web) giữ vững màu xanh.
