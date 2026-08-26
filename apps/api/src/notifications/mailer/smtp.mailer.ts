import { Injectable, Logger } from '@nestjs/common';
import type { MailerPort, SendMailInput } from './mailer.port';

/**
 * Adapter SMTP — hiện đang là STUB:
 * TODO(nodemailer): `pnpm --filter @sango/api add nodemailer` (+ @types/nodemailer)
 * rồi thay khối try bên dưới bằng transporter thật:
 *
 *   const nodemailer = require('nodemailer');
 *   this.transporter = nodemailer.createTransport({
 *     host: process.env.SMTP_HOST,
 *     port: Number(process.env.SMTP_PORT ?? 587),
 *     secure: Number(process.env.SMTP_PORT ?? 587) === 465,
 *     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
 *   });
 *   await this.transporter.sendMail({ from: process.env.MAIL_FROM, ...input });
 *
 * Cho đến khi cài đặt, nếu SMTP_HOST được đặt mà thiếu dependency thì tự rơi về
 * log console (không làm vỡ luồng nghiệp vụ gọi mail).
 */
@Injectable()
export class SmtpMailer implements MailerPort {
  private readonly logger = new Logger(SmtpMailer.name);

  async send(input: SendMailInput): Promise<void> {
    try {
      // Chỉ chạy được sau khi cài nodemailer — xem TODO phía trên.
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy load stub, dep chưa có trong package.json
      const nodemailer = require('nodemailer') as {
        createTransport(opts: unknown): { sendMail(opts: unknown): Promise<unknown> };
      };
      const port = Number(process.env.SMTP_PORT ?? 587);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
      await transporter.sendMail({
        from: process.env.MAIL_FROM ?? 'SanGo <no-reply@sango.vn>',
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
    } catch {
      this.logger.warn(
        'SMTP_HOST đã cấu hình nhưng nodemailer chưa cài / gửi lỗi — fallback console',
      );
      console.log(`[MAIL] to=${input.to} subject=${input.subject}`);
    }
  }
}
