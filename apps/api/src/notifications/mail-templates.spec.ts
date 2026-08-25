import {
  bookingCancelledEmail,
  bookingConfirmedEmail,
  formatMinute,
  formatVnd,
  paymentReceiptEmail,
  vnDateLabel,
  type BookingMailData,
} from './mail-templates';

const DATA: BookingMailData = {
  code: 'CH-20260825-0001',
  customerName: 'Nguyễn Văn A',
  courtName: 'Sân 5A',
  venueName: 'KĐT Sân Cỏ',
  venueAddress: '12 Đường ABC, Cầu Giấy',
  date: '2026-09-01',
  startMinute: 600,
  endMinute: 690,
  amountVnd: 250000,
};

describe('mail-templates', () => {
  it('helpers: phút -> HH:mm, ngày VN, tiền VND nhóm 3 số', () => {
    expect(formatMinute(600)).toBe('10:00');
    expect(formatMinute(0)).toBe('00:00');
    expect(vnDateLabel('2026-09-01')).toBe('Thứ ba, 01/09/2026');
    expect(vnDateLabel('2026-08-30')).toBe('Chủ nhật, 30/08/2026');
    expect(formatVnd(250000)).toBe('250.000₫');
    expect(formatVnd(1234567)).toBe('1.234.567₫');
  });

  it('mail xác nhận đơn: subject + mã đơn + khung giờ + brand CourtHub', () => {
    const mail = bookingConfirmedEmail(DATA);
    expect(mail.subject).toBe('[CourtHub] Đã xác nhận đơn CH-20260825-0001');
    expect(mail.html).toContain('CourtHub');
    expect(mail.html).toContain('xác nhận thành công');
    expect(mail.html).toContain('Thứ ba, 01/09/2026');
    expect(mail.html).toContain('10:00–11:30');
    expect(mail.html).toContain('250.000₫');
    expect(mail.text).toContain('CH-20260825-0001');
  });

  it('mail hủy đơn: nêu lý do khi có và tiền liên quan', () => {
    const mail = bookingCancelledEmail({ ...DATA, cancelReason: 'Sân bảo trì' });
    expect(mail.subject).toContain('đã bị hủy');
    expect(mail.html).toContain('Sân bảo trì');
    expect(mail.text).toContain('Lý do: Sân bảo trì');
    // Không lý do -> không có dòng "Lý do hủy"
    const noReason = bookingCancelledEmail(DATA);
    expect(noReason.html).not.toContain('Lý do hủy');
  });

  it('biên nhận thanh toán: nổi bật số tiền đã nhận + mã check-in', () => {
    const mail = paymentReceiptEmail(DATA);
    expect(mail.subject).toBe('[CourtHub] Biên nhận thanh toán đơn CH-20260825-0001');
    expect(mail.html).toContain('Số tiền đã nhận');
    expect(mail.html).toContain('250.000₫');
    expect(mail.text).toContain('250.000₫');
  });

  it('không có customerName -> lời chào chung, vẫn render đủ', () => {
    const mail = bookingConfirmedEmail({
      ...DATA,
      customerName: undefined,
      venueAddress: undefined,
    });
    expect(mail.html).toContain('<p>Xin chào,</p>');
    expect(mail.html).not.toContain('Địa chỉ');
  });
});
