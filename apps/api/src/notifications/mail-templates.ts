/**
 * Template email branded CourtHub — render thuần chuỗi (không dependency).
 * Thiết kế: header lime (#a3e635) + wordmark xanh lá sân cỏ (#16a34a),
 * footer đồ án. Màu viết inline vì hầu hết client mail bỏ qua <style>.
 */

const BRAND_GREEN = '#16a34a';
const LIME = '#a3e635';
const INK = '#111827';
const MUTED = '#6b7280';

/** Nội dung mail hoàn chỉnh cho một loại thông báo. */
export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

/** Dữ liệu đơn đặt sân dùng chung cho cả 3 loại mail. */
export interface BookingMailData {
  code: string;
  customerName?: string;
  courtName: string;
  venueName: string;
  venueAddress?: string;
  /** Ngày chơi YYYY-MM-DD (cột date kiểu DATE theo giờ VN). */
  date: string;
  startMinute: number;
  endMinute: number;
  /** Số tiền VND chính của mail: cọc/toàn bộ khi xác nhận, tiền đã nhận khi biên lai. */
  amountVnd: number;
  cancelReason?: string;
}

/** Khung layout dùng chung: header lime + nội dung + footer đồ án. */
function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0"
            style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:${LIME};padding:16px 24px;">
                <span style="font-size:20px;font-weight:bold;color:${BRAND_GREEN};letter-spacing:1px;">CourtHub</span>
                <span style="float:right;color:${INK};font-size:13px;padding-top:4px;">Đặt sân thể thao trong 1 phút</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px 24px;">
                <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.4;color:${INK};">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;border-top:1px solid #e5e7eb;background:#fafafa;">
                <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;">
                  CourtHub — Đồ án tốt nghiệp · Nền tảng đặt sân thể thao (bóng đá, pickleball, cầu lông, tennis).<br/>
                  Email tự động, vui lòng không trả lời. Chi tiết đơn xem trên web hoặc ứng dụng CourtHub.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Bảng chi tiết đơn dùng chung. */
function bookingTable(d: BookingMailData): string {
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 0;color:${MUTED};font-size:14px;width:40%;">${label}</td>
      <td style="padding:6px 0;font-size:14px;font-weight:bold;">${value}</td>
    </tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin:8px 0 16px 0;">
    ${row('Mã đơn', d.code)}
    ${row('Sân', `${d.courtName} · ${d.venueName}`)}
    ${d.venueAddress ? row('Địa chỉ', d.venueAddress) : ''}
    ${row('Thời gian', `${vnDateLabel(d.date)}, ${formatMinute(d.startMinute)}–${formatMinute(d.endMinute)}`)}
  </table>`;
}

/** 600 -> "10:00" (phút tính từ 00:00 giờ Việt Nam). */
export function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** '2026-09-01' -> "Thứ ba, 01/09/2026" — không qua timezone để tránh lệch ngày. */
export function vnDateLabel(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const names = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${names[dow]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** 250000 -> "250.000₫" — nhóm 3 số bằng dấu chấm, không phụ thuộc ICU. */
export function formatVnd(amount: number): string {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₫`;
}

// ------------------------------------------------------------------ 3 loại mail

/** Mail XÁC NHẬN ĐƠN — khách nhận ngay sau khi hold chuyển thành booking CONFIRMED. */
export function bookingConfirmedEmail(d: BookingMailData): MailContent {
  const greeting = d.customerName ? `<p>Xin chào ${d.customerName},</p>` : '<p>Xin chào,</p>';
  const body = `
    ${greeting}
    <p>Đơn đặt sân của bạn đã được <strong>xác nhận thành công</strong>. Hẹn gặp bạn tại sân!</p>
    ${bookingTable(d)}
    <p style="font-size:14px;margin:0 0 4px 0;">Số tiền đã thanh toán: <strong style="color:${BRAND_GREEN};">${formatVnd(d.amountVnd)}</strong></p>
    <p style="font-size:13px;color:${MUTED};">Vui lòng đến đúng giờ; đến trễ quá 15 phút có thể bị tính NO_SHOW theo quy định sân.</p>`;
  return {
    subject: `[CourtHub] Đã xác nhận đơn ${d.code}`,
    html: layout('Đặt sân thành công 🎾', body),
    text:
      `CourtHub: Đã xác nhận đơn ${d.code}\n` +
      `Sân: ${d.courtName} - ${d.venueName}\n` +
      `Thời gian: ${vnDateLabel(d.date)}, ${formatMinute(d.startMinute)}-${formatMinute(d.endMinute)}\n` +
      `Thanh toán: ${formatVnd(d.amountVnd)}`,
  };
}

/** Mail HỦY ĐƠN — khách nhận khi đơn bị hủy (bởi khách hoặc chủ sân). */
export function bookingCancelledEmail(d: BookingMailData): MailContent {
  const reason = d.cancelReason
    ? `<p style="font-size:14px;">Lý do hủy: <em>${d.cancelReason}</em></p>`
    : '';
  const body = `
    <p>Xin chào${d.customerName ? ` ${d.customerName}` : ''},</p>
    <p>Đơn đặt sân dưới đây đã bị <strong>hủy</strong>. Nếu đây là nhầm lẫn, bạn có thể đặt lại lịch trống khác trên CourtHub.</p>
    ${bookingTable(d)}
    ${reason}
    <p style="font-size:14px;margin:0 0 4px 0;">Số tiền liên quan: <strong>${formatVnd(d.amountVnd)}</strong> (nếu đã thanh toán sẽ được hoàn theo chính sách venue).</p>`;
  return {
    subject: `[CourtHub] Đơn ${d.code} đã bị hủy`,
    html: layout('Thông báo hủy đơn', body),
    text:
      `CourtHub: Đơn ${d.code} đã bị hủy\n` +
      `Sân: ${d.courtName} - ${d.venueName}\n` +
      `Thời gian: ${vnDateLabel(d.date)}, ${formatMinute(d.startMinute)}-${formatMinute(d.endMinute)}\n` +
      (d.cancelReason ? `Lý do: ${d.cancelReason}\n` : '') +
      `Tiền liên quan: ${formatVnd(d.amountVnd)}`,
  };
}

/** Mail NHẮC LỊCH (P2-B2) — cron bắn tại mốc T-24h và T-2h trước giờ chơi. */
export function reminderEmail(d: BookingMailData & { markLabel: 'T-24h' | 'T-2h' }): MailContent {
  const heading = d.markLabel === 'T-24h' ? 'Ngày mai bạn có trận! ⚽' : 'Sắp tới giờ chơi! ⏰';
  const body = `
    <p>Xin chào${d.customerName ? ` ${d.customerName}` : ''},</p>
    <p>Đơn đặt sân của bạn sẽ bắt đầu ${d.markLabel === 'T-24h' ? 'trong khoảng 24 tiếng tới' : 'trong khoảng 2 tiếng tới'}. Nhớ chuẩn bị sẵn tinh thần thể thao nhé!</p>
    ${bookingTable(d)}
    <p style="font-size:13px;color:${MUTED};">Mang mã đơn ${d.code} để check-in nhanh tại sân.</p>`;
  return {
    subject: `[CourtHub] Nhắc lịch đơn ${d.code} (${d.markLabel})`,
    html: layout(heading, body),
    text:
      `CourtHub: Nhắc lịch (${d.markLabel}) — đơn ${d.code}\n` +
      `Sân: ${d.courtName} - ${d.venueName}\n` +
      `Thời gian: ${vnDateLabel(d.date)}, ${formatMinute(d.startMinute)}-${formatMinute(d.endMinute)}`,
  };
}

/** Mail BIÊN NHẬN THANH TOÁN — gửi sau khi cổng xác nhận Payment PAID. */
export function paymentReceiptEmail(d: BookingMailData): MailContent {
  const body = `
    <p>Xin chào${d.customerName ? ` ${d.customerName}` : ''},</p>
    <p>CourtHub đã nhận được thanh toán cho đơn của bạn. Biên nhận chi tiết như sau:</p>
    ${bookingTable(d)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:#ecfdf5;border-radius:8px;padding:12px 16px;margin:0 0 16px 0;">
      <tr>
        <td style="color:${MUTED};font-size:14px;width:40%;">Số tiền đã nhận</td>
        <td style="font-size:18px;font-weight:bold;color:${BRAND_GREEN};">${formatVnd(d.amountVnd)}</td>
      </tr>
    </table>
    <p style="font-size:13px;color:${MUTED};">Biên nhận điện tử này thay thế hóa đơn giấy. Mang mã đơn ${d.code} để check-in tại sân.</p>`;
  return {
    subject: `[CourtHub] Biên nhận thanh toán đơn ${d.code}`,
    html: layout('Thanh toán thành công ✅', body),
    text:
      `CourtHub: Đã nhận thanh toán ${formatVnd(d.amountVnd)} cho đơn ${d.code}\n` +
      `Sân: ${d.courtName} - ${d.venueName}\n` +
      `Thời gian chơi: ${vnDateLabel(d.date)}, ${formatMinute(d.startMinute)}-${formatMinute(d.endMinute)}`,
  };
}
