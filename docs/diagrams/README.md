# Sơ đồ Mermaid cho báo cáo tốt nghiệp — CourtHub

Nguyên liệu chương **Phân tích thiết kế** (Chương 3) viết bằng Mermaid để vừa
version-control vừa render PNG/SVG chất lượng cao lúc đóng báo cáo.

## Danh mục sơ đồ

| File | Loại sơ đồ | Nội dung | Nguồn đặc tả |
|---|---|---|---|
| `erd.mmd` | erDiagram | 9 bảng dữ liệu, tên cột/enum chuẩn gói `@courthub/shared` | §5 |
| `architecture.mmd` | flowchart TB | Browser → Vercel → Render (11 modules + cron) → Neon/VNPay/Resend/Cloudinary | §4, §9 |
| `booking-sequence.mmd` | sequenceDiagram | Luồng đặt sân: hold FOR UPDATE → overlap check → VNPay callback idempotent | §6.1 ⭐ |
| `booking-state.mmd` | stateDiagram-v2 | Máy trạng thái Booking 5 trạng thái | §5 |
| `cancel-refund-flow.mmd` | flowchart TD | Chính sách hủy 3 mức hoàn cọc | §6.2 |

## Lệnh render đề xuất

Cần Node ≥ 18. Render từng file (PNG ngang 1600px, nền trắng để chèn Word):

```bash
npx --yes @mermaid-js/mermaid-cli mmdc -i docs/diagrams/erd.mmd                -o docs/diagrams/erd.png                -w 1600 -b white
npx --yes @mermaid-js/mermaid-cli mmdc -i docs/diagrams/architecture.mmd       -o docs/diagrams/architecture.png       -w 1600 -b white
npx --yes @mermaid-js/mermaid-cli mmdc -i docs/diagrams/booking-sequence.mmd   -o docs/diagrams/booking-sequence.png   -w 1600 -b white
npx --yes @mermaid-js/mermaid-cli mmdc -i docs/diagrams/booking-state.mmd      -o docs/diagrams/booking-state.png      -w 1600 -b white
npx --yes @mermaid-js/mermaid-cli mmdc -i docs/diagrams/cancel-refund-flow.mmd -o docs/diagrams/cancel-refund-flow.png -w 1600 -b white
```

Rút gọn (bash loop):

```bash
for f in docs/diagrams/*.mmd; do npx --yes @mermaid-js/mermaid-cli mmdc -i "$f" -o "${f%.mmd}.png" -w 1600 -b white; done
```

Muốn vector cho LaTeX/InDesign thì thay đuôi output `.png` bằng `.svg`.

## Ghi chú kỹ thuật

- **Font tiếng Việt:** máy cần font hệ thống hỗ trợ tiếng Việt (DejaVu Sans /
  Noto Sans có sẵn trên Linux). Nếu PNG bị mất dấu, thêm
  `-p puppeteer-config.json` với `{ "args": ["--lang=vi-VN"] }`.
- **Dùng Chrome hệ thống (đã kiểm chứng trên máy dev):** khi puppeteer không
  tự tìm được browser, tạo `puppeteer-config.json`:

  ```json
  {
    "executablePath": "/usr/bin/google-chrome",
    "args": ["--no-sandbox", "--disable-setuid-sandbox"]
  }
  ```

  rồi thêm `-p puppeteer-config.json` vào lệnh mmdc. Cả 5 file `.mmd` trong
  thư mục này đã được parse + render SVG thành công bằng mermaid-cli 11.16.0
  với cấu hình trên.
- **Kiểm tra cú pháp nhanh không cần render:** mở file trên
  <https://mermaid.live> — nội dung sau các dòng `%%` comment là phần vẽ.
- Sửa sơ đồ = sửa file `.mmd` rồi render lại; **không sửa tay file PNG/SVG**.