import { Injectable, Logger } from '@nestjs/common';

/**
 * Gửi email giao dịch (đặc tả §3.9 dùng Resend).
 * Chưa cấu hình RESEND_API_KEY => chỉ log link ra console để demo dev.
 * TODO(env): bổ sung RESEND_API_KEY + MAIL_FROM khi bật email thật.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendPasswordResetLink(email: string, resetLink: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // TODO(env): khi có RESEND_API_KEY sẽ gửi thật thay vì log.
      this.logger.warn(
        `[DEV-ONLY] RESEND_API_KEY chưa cấu hình — link đặt lại mật khẩu cho ${email}: ${resetLink}`,
      );
      return;
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.MAIL_FROM ?? 'SanGo <no-reply@sango.vn>',
          to: [email],
          subject: 'SanGo — Đặt lại mật khẩu',
          html: `<p>Bạn vừa yêu cầu đặt lại mật khẩu SanGo.</p><p><a href="${resetLink}">Nhấn vào đây để đặt mật khẩu mới</a> (hết hạn sau 30 phút).</p><p>Nếu không phải bạn, hãy bỏ qua email này.</p>`,
        }),
      });
      if (!res.ok) {
        this.logger.error(`Resend trả lỗi ${res.status} khi gửi email đặt lại mật khẩu`);
      }
    } catch (e) {
      // Không bao giờ làm fail luồng forgot-password vì lỗi mailer.
      this.logger.error('Gửi email qua Resend thất bại', e as Error);
    }
  }
}
