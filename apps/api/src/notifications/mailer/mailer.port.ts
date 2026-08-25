/** Một email cần gửi — nội dung HTML đã render sẵn từ template. */
export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  /** Bản plain-text dự phòng cho client không đọc HTML được. */
  text?: string;
}

/**
 * Port gửi mail (hexagonal): nghiệp vụ chỉ phụ thuộc interface này.
 * Adapter mặc định là ConsoleMailer (dev/khi chưa cấu hình SMTP);
 * SmtpMailer là stub TODO nodemailer cho môi trường thật.
 */
export const MAILER_PORT = Symbol('MAILER_PORT');

export interface MailerPort {
  send(input: SendMailInput): Promise<void>;
}
