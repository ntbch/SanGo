import { Injectable } from '@nestjs/common';
import type { MailerPort, SendMailInput } from './mailer.port';

/** Adapter dev: ghi log ra console, không gửi thật — dùng khi chưa cấu hình SMTP_HOST. */
@Injectable()
export class ConsoleMailer implements MailerPort {
  async send(input: SendMailInput): Promise<void> {
    console.log(`[MAIL] to=${input.to} subject=${input.subject}`);
  }
}
