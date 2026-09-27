import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import type { MailerPort, SendMailInput } from './mailer.port';

/** Transport SMTP thật; lỗi gửi được chuyển tới NotifyService.sendMailSafe. */
@Injectable()
export class SmtpMailer implements MailerPort {
  private readonly transporter;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const port = Number(env.SMTP_PORT ?? 587);
    // 465 = TLS ngầm định; mọi cổng khác phải nâng cấp STARTTLS, nếu server không
    // quảng bá thì fail chứ không gửi AUTH (và khoá) dạng rõ.
    const secure = port === 465;
    this.transporter = createTransport({
      host: env.SMTP_HOST,
      port,
      secure,
      requireTLS: !secure,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
      // Không chờ mãi: chặn treo request khi host sai/chặn mạng.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
    this.from = env.MAIL_FROM ?? 'SanGo <no-reply@sango.vn>';
  }

  private readonly from: string;

  async send(input: SendMailInput): Promise<void> {
    const result = await this.transporter.sendMail({ from: this.from, ...input });
    if (result.rejected.length > 0) {
      throw new Error('SMTP từ chối người nhận email');
    }
  }
}
