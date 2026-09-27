import { ConsoleMailer } from './console.mailer';
import { SmtpMailer } from './smtp.mailer';
import type { MailerPort } from './mailer.port';

/**
 * Chọn adapter mail theo môi trường:
 * - SMTP_HOST chưa cấu hình (mặc định dev/demo) -> ConsoleMailer.
 * - SMTP_HOST đã cấu hình -> SmtpMailer; lỗi gửi được ghi nhận bởi sendMailSafe.
 */
export function createDefaultMailer(env: NodeJS.ProcessEnv = process.env): MailerPort {
  return env.SMTP_HOST ? new SmtpMailer(env) : new ConsoleMailer();
}
