---
name: cliche-free-frontend
description: Use when designing, building, or reviewing any frontend UI in any project — request "thiết kế", "design", "redesign", "UI", "hero", "landing page", "component", "dashboard", "review giao diện". Enforce 20 banned AI-cliché patterns (gradient, glassmorphism, emoji headings, icon-box rows, badge-above-headline, fade-in scroll...) and full anti-AI-slop craft rules (typography, spacing, color, layout, motion, copy, states). Works project-agnostic: adapts to whatever tokens/fonts the repo already has.
---

# Cliché-Free Frontend Design (Anti-AI-Slop)

## Overview

Thiết kế giao diện phẳng, typographic, token-driven. Cấm cứng 20 pattern "AI-ramp" — không phải vì từng pattern xấu tuyệt đối, mà vì chúng là dấu hiệu nhận diện sản phẩm do AI làm qua loa: trang trí thay cho hierarchy, decoration thay cho thông tin, mặt nạ đẹp che logic yếu.

**Nguyên tắc gốc:** Mọi quyết định thị giác phải truyền thông tin (hierarchy, trạng thái, dữ liệu). Element chỉ tồn tại "cho đẹp" thì xóa. Whitespace là tính năng, không phải khoảng trống cần lấp.

**Áp dụng cho MỌI dự án:** Skill này không gắn với stack cụ thể. Bắt buộc chạy Phase 0 (dưới đây) để thích nghi với dự án trước khi thiết kế.

## Phase 0 — Thích nghi dự án (bắt buộc, 5 phút)

Đọc trước, thiết kế sau. Không bỏ qua kể cả khi "chỉ sửa 1 component".

1. **Tìm design tokens:** mở `src/index.css` / `src/app/index.css` / `tailwind.config` / `tokens.*` — ghi lại: màu nền/card/primary, dark mode vars, radius, shadow.
2. **Tìm font stack:** `index.html` + CSS `font-family`. Ghi lại font UI + font số liệu (nếu có). Không thêm font mới.
3. **Đọc 2-3 component mẫu cùng loại** (nếu sửa card thì đọc card cũ) để nắm quy ước spacing, radius, icon đang dùng.
4. **Tìm copy language:** UI copy tiếng gì, giọng nào (formal/thân thiện), có hệ thống số hóa chưa.
5. **Greenfield (dự án mới không có token):** thiết lập token tối thiểu TRƯỚC — 1 font UI, 1 font mono, neutral scale, 1 accent, radius scale, shadow 2 mức. Không bắt đầu component khi chưa có token.

Ghi lại 5 dòng "project constraints" vào đầu reply để user xác nhận trước khi code.

## 20 Banned Patterns — BẢNG CẤM TUYỆT ĐỐI

Check MỌI dòng trước khi giao. Lý do cấm: đây là 20 dấu hiệu AI-slop phổ biến nhất.

| # | Banned | Thay bằng |
|---|--------|-----------|
| 1 | Purple-to-blue gradient (bg-gradient tím→xanh, mọi hướng) | Màu phẳng từ token; tách section bằng bg-secondary/40 hoặc đường viền border-border |
| 2 | Gradient hero text (bg-clip-text text-transparent) | Chữ đặc text-foreground; nhấn tối đa 1 từ bằng text-primary |
| 3 | Emoji trong tiêu đề, button, label, toast | Icon chức năng (≤1/element) hoặc không gì cả. Emoji chỉ trong data thật do user tạo |
| 4 | Font Inter (hoặc 1 font duy nhất cho cả UI + số liệu + code) | Font UI riêng + font mono/tabular riêng cho số, giá, timestamp. Dùng font có sẵn của dự án |
| 5 | Card viền màu trang trí (border emerald/rose/amber khi không báo trạng thái) | border màu border token. Viền màu CHỈ cho: error, selected, focus, warning |
| 6 | Glassmorphism (backdrop-blur trên card/panel) | Bề mặt đặc bg-card + shadow-md. Overlay modal: bg-black/75 đặc |
| 7 | Dark mode tương phản thấp (muted text < 55% độ sáng, card gần trùng nền) | Dark mode: card sáng hơn nền rõ rệt (elevation qua bề mặt), muted-foreground ≥ L 65% |
| 8 | 3 (hoặc N) ô icon xếp hàng ngang trên feature section | Số thứ tự 01/02/03 + text thật, hoặc bảng so sánh, hoặc list 2 cột có heading riêng |
| 9 | Badge/pill/trust-badge nằm PHÍA TRÊN tiêu đề | Heading là element đầu tiên của section. Badge xuống dưới heading hoặc ngang hàng |
| 10 | Icon ở MỌI nơi (heading, label, mỗi menu item đều có icon) | Icon budget: ≤2/section, CHỈ ở action + trạng thái + danh mục. Heading text-only |
| 11 | shadcn/undesign/MUI nguyên bản không tùy biến | Components phải ăn token dự án: radius, shadow, spacing, focus ring riêng |
| 12 | Fade-in on scroll (whileInView, AOS, IntersectionObserver reveal) | Không animation theo scroll. Transition chỉ: hover/focus/state 150-200ms |
| 13 | Cursor-following beam/glow/spotlight | Cấm. Chiều sâu = shadow thật trên bề mặt thật |
| 14 | Button mờ khi hover (hover:opacity-50) | transition-colors đổi nền rõ: hover:bg-primary/90; feedback nhấn: active:scale-[0.98] |
| 15 | Spacing ngẫu nhiên (gap-3 cạnh gap-5, padding lệch nhau giữa card cùng loại) | 1 scale duy nhất: 4/8/12/16/24/32/48 (gap-1..12 của Tailwind). Card trong 1 grid: cùng padding, cùng gap |
| 16 | Em dash (—) rải trong UI copy | Chấm, phẩy, ngoặc. Ký tự chấm giữa (·) chỉ trong dòng meta. Em dash chỉ trong code comment |
| 17 | Buzzword chung chung ("Nâng tầm", "Đột phá", "Toàn diện") | Copy nêu CON SỐ + HÀNH ĐỘNG: "250+ cụm sân trực tuyến", "Giữ chỗ 10 phút" |
| 18 | Serif italic accent (font-serif italic cho điểm nhấn) | Nhấn bằng weight (800/900) hoặc màu accent, giữ nguyên font family |
| 19 | Space Grotesk + Instrument Serif (pairing "trendy" copy từ landing mẫu) | 1 font UI + 1 font mono. Pairing mới chỉ khi user yêu cầu rõ ràng |
| 20 | Grain/noise texture phủ trên gradient | Nền phẳng. Texture chỉ khi là brand asset thật, không phải CSS noise trang trí |

## Craft Rules — CHI TIẾT CHỐNG SLOP

### Typography

- **Scale:** chọn 1 ratio (1.25 desktop), tối đa 6 cỡ: display / h1 / h2 / h3 / body / caption. Tailwind: text-4xl→5xl (display), text-xl (h2), text-sm (body phụ), text-xs (caption).
- **Weight có chủ đích:** 400 body · 500-600 label/button · 700-800 heading · 900 CHỈ display. Không dùng 900 cho body.
- **Line-height:** heading 1.1-1.2 (leading-[1.15]), body 1.5-1.7 (leading-relaxed).
- **Tracking:** display tracking-tight; uppercase micro-label tracking-wider + text-[11px]; body để nguyên.
- **Độ dài dòng:** body 50-75ch (max-w-xl/max-w-2xl). Đoạn dài hơn 2 dòng KHÔNG căn giữa.
- **Số liệu:** luôn font mono/tabular (font-mono-num hoặc tabular-nums) — giá, điểm, thời gian, rank.

### Spacing & Layout

- **1 focal point/section.** Nếu 2 element cùng "kêu", hạ 1. Hero = 1 headline + 1 action chính.
- **Composition bất đối xứng** (55/45, 60/40, 2/3+1/3) thay vì căn giữa đối xứng 50/50 mọi thứ.
- **Nhịp section:** xen kẽ bg-background và bg-secondary/40 full-bleed để tách khối không cần đường kẻ.
- **Container:** max-w-6xl/max-w-7xl + mx-auto px-4 sm:px-6. Toàn trang DÙNG 1 container width.
- **Proximity:** cái liên quan đứng gần (gap-2/3), nhóm khác nhau xa (gap-8/12). Grid card: 1 giá trị gap duy nhất (gap-4 hoặc gap-6).
- **Whitespace khi phân vân:** thêm khoảng trống, đừng thêm đường kẻ/hộp/icon.
- **Responsive mobile-first:** mọi layout bắt đầu 1 cột; touch target ≥ h-11 (44px); test ở 375px trước khi coi là xong.

### Color

- **60-30-10:** 60% neutral (background/card), 30% secondary surface, 10% accent. Accent chỉ 1 màu chính.
- **JSX chỉ dùng semantic token** (bg-card, text-muted-foreground, border-border). Màu raw (emerald-500...) CHỈ cho trạng thái + data-viz.
- **Contrast:** body ≥ 4.5:1, text lớn ≥ 3:1 (WCAG AA). Test dark mode riêng — không "coi như" giống light.
- **Trạng thái:** success/warning/error có 1 cặp bg/text cố định, dùng lại y nguyên mọi nơi.

### Iconography

- 1 bộ icon duy nhất (không trộn lucide + heroicons). Stroke width đồng nhất.
- Kích thước chuẩn: h-3.5 / h-4 / h-5 — không có cỡ khác. Icon trong button: gap-1.5/gap-2 + items-center.
- Density budget: đếm được trên tay. Section không icon > section có icon.

### Motion

- Cho phép: transition-colors (150-200ms), active:scale-[0.98], skeleton animate-pulse, spinner cho async.
- Cấm: scroll-trigger, parallax, bounce/spring, entrance animation, cursor effect.
- prefers-reduced-motion phải không vỡ layout.

### Copy

- **Headline:** [Đối tượng cụ thể] + [lợi ích đo được]. VD: "Đặt sân thể thao & ghép kèo nhanh" — không phải "Nâng tầm trải nghiệm thể thao".
- **Button:** động từ đầu, ngắn: "Tìm sân ngay", "Đăng ký giải" — không "Tìm hiểu thêm", "Khám phá ngay".
- **Empty state 3 dòng:** cái gì trống + vì sao + làm gì tiếp. VD: "Chưa có giao dịch nào. Nạp tiền để bắt đầu đặt sân."
- **Số thật > tính từ:** "10 phút giữ chỗ" > "nhanh chóng an toàn".

### States (chỗ AI slop thiếu nhiều nhất)

Mọi view có dữ liệu phải đủ 4 trạng thái trước khi báo xong:
1. **Loading:** skeleton cùng hình dạng layout (không spinner toàn màn).
2. **Empty:** công thức copy ở trên + 1 CTA.
3. **Error:** thông điệp người thường đọc được + nút thử lại.
4. **Success/feedback:** toast hoặc inline message, không alert().

Mọi interactive element: hover + focus-visible:ring + active + disabled:opacity-50 disabled:cursor-not-allowed.

## Quy trình thiết kế (7 bước)

1. **Phase 0** — inventory token/font/component (bắt buộc, xem trên).
2. **Hierarchy:** liệt kê content, xếp hạng quan trọng, chọn 1 focal point.
3. **Sketch layout** (text/ASCII) + chọn composition bất đối xứng. Chốt với user nếu là trang mới.
4. **Build** chỉ bằng token. Mở bảng 20 cấm bên cạnh, check từng dòng lúc code.
5. **Audit:** chạy self-audit grep (dưới) + checklist states + responsive 375px.
6. **Screenshot verify** ở 375 / 768 / 1440 (hoặc vision_html_screenshot). 5-second test: nhìn 5 giây, kể lại element quan trọng nhất — không kể được thì hierarchy sai.
7. **Iterate 1 vòng:** xóa 1 decoration, siết 1 spacing, rồi dừng.

## Self-audit grep (chạy trước khi báo done)

    cd <frontend-src-dir>
    # Nhung mau sau day PHAI return 0 match trong UI code (bo test/comment):
    grep -rn "bg-gradient-to\|from-purple\|to-blue-500\|bg-clip-text\|backdrop-blur" --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.svelte" . | grep -vi test
    grep -rn "font-serif\|Space Grotesk\|Instrument Serif\|'Inter'" --include="*.tsx" . | grep -vi test
    grep -rn "whileInView\|IntersectionObserver\|animate-fade\|aos" --include="*.tsx" . | grep -vi test
    grep -rn "— " --include="*.tsx" . | grep -v "//" | grep -vi test
    grep -rn "hover:opacity" --include="*.tsx" . | grep -vi test

    # Emoji trong JSX (cliche #3) — phai return 0 match:
    grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}]" --include="*.tsx" . | grep -vi test

    # Icon density (cliche #10) — canh bao file import > 6 icon lucide:
    grep -rln "from 'lucide-react'" --include="*.tsx" . | while read f; do
      n=$(sed -n "1,/from 'lucide-react'/p" "$f" | grep -c "^\s*[A-Z]"); [ "$n" -gt 6 ] && echo "SLOP? $f ($n icons)";
    done

    # Contrast nhanh: muted text qua nang trong dark mode
    grep -rn "text-white/\(3\|4\)0\|text-foreground/\(4\|5\)0" --include="*.tsx" . | grep -vi test

## Slop Test — 5 câu hỏi trước khi giao

1. **Che màu đi** (grayscale): layout còn hierarchy không? Mọi thứ cùng trọng lượng → sai.
2. **Có element nào chỉ để trang trí?** Xóa thử — layout tốt lên thì xóa thật.
3. **Copy có con số/danh từ cụ thể?** Thuật ngữ chung chung nào còn lại?
4. **4 state đủ chưa** (loading/empty/error/success)? Thiếu 1 cái là chưa xong.
5. **Đặt cạnh 10 landing page AI khác:** có nhận ra trang này KHÔNG giống chúng không? (phải nhận ra)

## Common Mistakes & Rationalizations

| Lý do dễ nghe | Sự thật |
|---|---|
| "Chỉ 1 gradient nhỏ thôi" | 1 gradient mở lại cả thói quen. bg-secondary/40 + typography mạnh thay thế được |
| "Glassmorphism làm form nổi hơn" | shadow-md trên bg-card nổi hơn, rẻ hơn về perf, không hụt contrast |
| "Icon giúp heading thân thiện" | Thân thiện ≠ dễ đọc. Icon trang trí trong heading = cliché #3 + #10 |
| "Client thích tím" | Client thích chuyển đổi và không bị chê copy AI. Hỏi mục tiêu business của khối đó |
| "3 icon boxes là chuẩn SaaS" | "Chuẩn" = 10 site AI sinh ra giống hệt nhau. Số thứ tự 01-03 + text thật giàu thông tin hơn |
| "Fade-in cho sang trọng" | Sang trọng = tốc độ + typography. Scroll animation che paint, lag trên máy yếu |
| "Dark mode chỉ cần đảo màu" | Dark mode cần bề mặt elevation riêng + contrast cao hơn light mode |
| "User không để ý states" | User không để ý KHI CÓ. Bỏ skeleton/error là user để ý ngay khi chờ |

## Ghi chú scope

- Skill áp cho UI mới + sửa UI + review. Không áp cho: email template, PDF export, canvas vẽ dữ liệu phức tạp (trừ khi user yêu cầu).
- Khi user YÊU CẦU CÔNG KHAI một pattern trong bảng cấm (VD: "làm gradient đi"): warning 1 lần, ghi rõ trade-off, rồi làm theo yêu cầu user. Không tự ý cấm đoán.
- Khi thiết kế xong luôn đính kèm: danh sách pattern trong bảng 20 đã check + kết quả grep audit.
