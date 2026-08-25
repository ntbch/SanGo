# PHÂN TÍCH KHOẢNG TRỐNG TOÀN DIỆN COURT-HUB → SẢN PHẨM HOÀN CHỈNH
*Nghiên cứu tổng hợp 4 luồng: Hành trình người chơi · Vận hành chủ sân · Back-office nền tảng · Thực tế kinh doanh sân VN. Chi tiết nguồn: docs/research/goc-4-kinh-doanh-san-the-thao-viet-nam.md + báo cáo mailbox các subagent nghiên cứu.*

---

## 0. CHẨN ĐOÁN GỐC: VÌ SAO NGHE "GIỐNG BỘ KHUNG"

1. **Không có vòng đời tài khoản**: thiếu quên/đổi mật khẩu, hồ sơ, KYC chủ sân.
2. **Không có thông báo**: đặt xong im lặng — không email, không nhắc lịch, owner không biết có đơn mới.
3. **Nội dung mỏng**: ảnh stock, ít review, không mô tả sân → cảm giác dữ liệu nặn.
4. **Chỉ phục vụ happy path online**: bỏ qua walk-in/điện thoại/Zalo = bỏ phần lớn doanh thu thật của sân VN → thống kê không phản ánh thực tế → owner không tin app.
5. **Admin chỉ có 1 màn hình duyệt sân** — không quản được user, tiền, tranh chấp, cấu hình.
6. **Thiếu tầng niềm tin**: lừa cọc giả danh chủ sân là vấn đề an ninh thực tế VN (laodong.vn) — nền tảng xác thực chủ sân chính là giá trị cốt lõi chưa ai làm tốt.

---

## 1. 👤 CUSTOMER — 8 GIAI ĐOẠN HÀNH TRÌNH

| # | Giai đoạn | Chuẩn ngành (Playo/CourtReserve/OpenSports/Playtomic) | CourtHub hiện tại | Gap | Ưu tiên |
|---|---|---|---|---|---|
| 1 | Lần đầu mở app | OTP/Social login (Zalo!), onboarding chọn môn+trình độ; duyệt KHÔNG cần TK (CourtReserve public booking: OTP SMS → QR → ký waiver) | Bắt login ngay | Landing public + guest browsing + Zalo login | P0 |
| 2 | Tìm & so sánh | Lưới trống real-time "như vé phim", so giá theo SLOT cụ thể, badge đã duyệt, ảnh thật (ALOBO lỗi geocoding: tìm Ba Đình ra Long Biên) | Quận/GPS/môn/sort ✓ | So sánh nhiều sân; chuẩn hóa geocoding địa chỉ VN | P1 |
| 3 | Chọn giờ & rủ bạn | Recurring booking, split-pay in-app, co-host, invite-link riêng tư (Playo V2/Playtomic) | Ghép trận mở cơ bản | Recurring cho đội fixed (văn hóa chốt khung cố định); link mời Zalo deep-link; chia tiền theo cầu 30-35k/người + ông bầu giữ quỹ | P0 |
| 4 | Thanh toán | Cọc một phần %, MoMo/ZaloPay/VietQR; hoàn credit ví sân tránh phí gateway (OpenSports credit-first) | Hold 10' + deposit % + VNPay mock ✓ đúng hướng | Thêm MoMo/ZaloPay; ví credit | P1 |
| 5 | Trước giờ chơi | Push T-24h + deadline hủy T-23h (pattern OpenSports chừa 1h sau reminder); đổi cutoff 2-4h | Không có gì | Email/in-app reminder + flag bất khả kháng thời tiết (mưa = sân chịu, đá bù bảo lưu cọc 30 ngày) | P0 |
| 6 | Tại sân | QR check-in ✓ (HiSport VN chứng minh); kéo dài giờ giá khung mới; dịch vụ phụ (vợt/nước/bóng) cộng bill — miếng bánh chưa ai bao phủ | QR check-in có | Extension booking; catalog dịch vụ phụ | P1 |
| 7 | Sau khi chơi | Review sân; reputation 3 chiều đồng đội Playo (đúng giờ/teammate/payment đàng hoàng) — hợp văn hóa VN hơn ELO phức tạp | Review sao cơ bản | Reputation đúng-giờ cho ghép trận — giải nỗi sợ book-xong-bỏ | P1 |
| 8 | Giữ chân | Karma/leaderboard/referral quốc tế; NHƯNG VN thích: gói bao tháng (nhóm 12 người cầu lông cố định cả năm, giảm 10-20%) + voucher lấp slot trống tự động | Không có | Gói định kỳ theo tuần + voucher AI-gắn-slot-chết | P2 |

## 2. 🏢 OWNER — 8 QUY TRÌNH VẬN HÀNH

| # | Quy trình | Chuẩn ngành | CourtHub | Gap | Ưu tiên |
|---|---|---|---|---|---|
| 1 | Onboarding | KYC venue (GPĐKD, TK nhận tiền, PCCC), hợp đồng điện tử minh bạch phí, import dữ liệu cũ + parallel run | Form đăng ký → chờ duyệt | KYC chủ sân = giá trị niềm tin số 1 VN (chống lừa cọc) | P0 |
| 2 | Cấu hình giá | Override membership×khung×thứ×date-range (lễ VN + âm lịch!), child courts khóa liên động (đặt cha khóa con), phụ phí đèn/AC tự cộng, giá theo loại khách | PricingRule theo khung/ngày ✓ | Lễ VN · child courts · đèn/AC tự động · member/khách/U15 | P0 |
| 3 | Nhận đơn | Auto-confirm vs request-to-book (đoàn lớn/giải đấu); waitlist khi đầy; TAG NGUỒN ĐƠN ngay lúc tạo (app/web/quầy) — Mindbody phân biệt để commission chỉ tính khách mới | Auto-confirm online | Request-to-book; waitlist; tag nguồn đơn — nền mọi đối soát | P0 |
| 4 | Ngày vận hành | Day-view gộp online+walk-in POS; check-in thẻ thành viên/kiosk; extension booking giá khung mới; no-show auto-mark sau X phút; dịch vụ phụ vào chung bill | Check-in QR, danh sách đơn | Nhập walk-in (bỏ = mất phần lớn doanh thu thật); extension; auto no-show | P0 |
| 5 | Hủy/đổi | Auto-refund 5 loại đối tượng (CourtReserve); hoàn về CREDIT account tránh phí gateway + giữ rebook; khách hủy áp policy ≠ sân hủy/mưa hoàn 100% MASS-CANCEL + thông báo hàng loạt; fee hủy là revenue category riêng | Refund quote theo mốc giờ ✓ | Ví credit; mass-cancel thời tiết; revenue category | P0 |
| 6 | Tài chính | Doanh thu tách nguồn (online prepaid/pay-at-venue/walk-in/dues/services/phí hủy); payout statement từng đợt đối chiếu ngược từng đơn; batch billing; e-invoice có mã VN | Chart.js deposit-only | Xuất Excel/PDF; statement; hóa đơn điện tử (khách công ty cần) | P1 |
| 7 | Nhân viên quầy | Role matrix tinh (ai được refund/discount/xóa đơn); time clock PIN từng NV; ca-kế tiền mặt đầu/cuối ca; audit log | Một tài khoản chung | Staff roles + ca tiền mặt — nguồn thất thoát kinh điển sân bóng VN | P1 |
| 8 | Marketing | Promo gắn SLOT GIỜ CHẾT (discount tự động khi fill-rate thấp); win-back automation (Patch Retention); đo fill-rate trước/sau campaign; Zalo OA | Không có | Voucher gắn khung trống (nối AI-2); đo fill-rate | P2 |

**Bài học Mindbody:** commission 20%/booking áp cả khách cũ → chủ sân lách khách ra kênh riêng. CourtHub thiết kế commission theo new-vs-returning từ đầu.

## 3. 🛡️ ADMIN — 7 TRỤ CỘT BACK-OFFICE

| # | Trụ cột | Chuẩn ngành | CourtHub | Ưu tiên |
|---|---|---|---|---|
| 1 | User lifecycle | active/restricted/suspended/banned; restricted = chặn hành vi mới nhưng hoàn tất nghĩa vụ treo; chống multi-account (velocity signup, disposable email) | Không có gì | P0 |
| 2 | Moderation | Pipeline 3 lớp (auto→human SLA 24h→hậu kiểm); checklist từ chối cụ thể; violation history đếm tái phạm ≥3 lần/90 ngày → auto-suspend; Compliance Center owner tự khắc phục deadline | Duyệt venue 1 màn hình | P1 |
| 3 | Disputes | Resolution Center một cửa, hạn mở KN (Airbnb 60 ngày), freeze payout liên quan, trọng tài bằng bằng chứng khách quan — **QR check-in log là lợi thế sẵn có**; reason code ai chịu %; chargeback: debit ngay + evidence deadline 2-4 tuần, Early Fraud Warning ~80% thành chargeback nếu im lặng | Không có | P1 |
| 4 | Tài chính nền tảng | Ledger double-entry (guest payment / owner receivable / commission); commission % SNAPSHOT từng booking không retroactive; payout schedule + rolling reserve + negative-balance ops; đối soát ledger vs settlement cổng: EXPECTED (T+1 tự giải) vs MISMATCHED (vỡ dữ liệu) + 4 action Void/Edit/Mark/Replace; stuck-payment queue retry có lý do; VietQR IPN + job poll ngược | Không có | P1 |
| 5 | Config runtime | Admin panel thay hardcode: hold duration, SLA duyệt, commission % theo loại sân, bảng % hoàn theo mốc, payout schedule, rate limit, bật/tắt mock↔prod, template thông báo — version history + effective date, kill switch | Hardcode code/env | P1 |
| 6 | Giám sát KPI | Funnel search→view→hold→pay→check-in; liquidity indicators (fill-rate, time-to-match, transaction success) dự báo tốt hơn GMV lịch sử; GMV+50%, take-rate −30% = DOANH THU GIẢM; cohort > aggregate; cảnh báo spike refund/fail-payment | Analytics owner-only | P2 |
| 7 | Audit log | who(admin+role)/what(before→after JSON)/when(UTC)/WHY BẮT BUỘC NHẬP cho action nhạy cảm/IP; append-only hash-chain; PII access log; mask SĐT ****1234 reveal có audit; NĐ 13/2023/NĐ-CP consent + breach notice | Không có | P1 |

## 4. 🇻🇳 DIFFERENTIATORS VIỆT NAM (cơ hội vượt app hiện có)

1. **"Chống nát lịch"** — pain #1 thương mại hóa (Sportis). Hold transactional + notification của CourtHub giải đúng bài này — cần nói rõ trên UI.
2. **Policy "dời vì mưa"**: trước 24h hoàn 100%/dời free · 12-24h 50% · <12h mất cọc · **mưa bão = sân chịu, hoàn 100% hoặc đá bù bảo lưu cọc 30 ngày** (sanchaolua).
3. **Cọc giữ chữ số hóa**: Zalo flow (hold miệng → CK cọc → ảnh biên lai) ≈ hold + deposit + payment confirmation của CourtHub — cần làm user nhận ra điều đó.
4. **Ghép trận ≠ "xé vé"**: scandal pickleball HN nhồi người quá công suất lệch trình độ (Dân trí) → bắt buộc cap slotsNeeded + khai báo trình độ.
5. **Chia tiền theo cầu** (30-35k/người, ông bầu giữ quỹ) — khoảng trống tuyệt đối: quỹ đội/split-pay.
6. **Giờ vàng dư cung** (pickleball "đua giảm giá vẫn vắng khách") — voucher AI-tự-gắn-slot-chết là vũ khí bán hàng thật.

## 5. LỘ TRÌNH ƯU TIÊN

### ĐỢT A — "Sống được" (P0)
- A1. Vòng đời tài khoản: quên/đổi MK, hồ sơ cá nhân
- A2. Landing public + guest browsing
- A3. Upload ảnh thật + KYC tối thiểu chủ sân
- A4. Email/in-app notification: xác nhận đơn, nhắc T-24h/T-2h, đơn mới cho owner
- A5. Admin quản lý user (tìm/khóa/mở/đổi vai)
- A6. Walk-in nhập tay + tag nguồn đơn
- A7. Mass-cancel thời tiết hoàn 100%

### ĐỢT B — "Chiều sâu kinh doanh" (P1)
- B1. Ledger double-entry + audit log + event tracking (SCHEMA-LEVEL — làm sớm vì bổ sung sau rất đau)
- B2. Recurring booking đội fixed + link mời Zalo
- B3. Ví credit hoàn tiền + mass-cancel
- B4. Dispute flow dùng QR check-in làm bằng chứng
- B5. Xuất Excel/PDF + payout statement + e-invoice
- B6. Config panel tham số nghiệp vụ
- B7. Giá lễ VN + child courts + phụ phí đèn/AC tự động

### ĐỢT C — "Vượt đối thủ" (P2)
- C1. Voucher AI gắn slot chết · C2. Gói bao tháng · C3. Staff roles + ca tiền mặt · C4. Reputation 3 chiều ghép trận · C5. Leaderboard/streak · C6. PWA + Zalo OA

**Nguyên tắc kiến trúc:** ledger + audit log + event tracking thiết kế schema từ Đợt B đầu tiên; mọi tham số nghiệp vụ qua config panel; mỗi đơn mang tag nguồn từ lúc sinh.