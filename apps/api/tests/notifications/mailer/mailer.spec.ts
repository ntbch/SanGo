import { ConsoleMailer } from '../../../src/notifications/mailer/console.mailer';
import { SmtpMailer } from '../../../src/notifications/mailer/smtp.mailer';
import { createDefaultMailer } from '../../../src/notifications/mailer/mailer.factory';

describe('MailerPort adapters', () => {
  describe('createDefaultMailer (chọn adapter theo env)', () => {
    it('SMTP_HOST trống -> ConsoleMailer (dev/demo)', () => {
      expect(createDefaultMailer({} as NodeJS.ProcessEnv)).toBeInstanceOf(ConsoleMailer);
    });

    it('SMTP_HOST đã cấu hình -> SmtpMailer', () => {
      expect(
        createDefaultMailer({ SMTP_HOST: 'smtp.gmail.com' } as NodeJS.ProcessEnv),
      ).toBeInstanceOf(SmtpMailer);
    });
  });

  describe('ConsoleMailer', () => {
    it('ghi log đúng định dạng [MAIL] to=... subject=...', async () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      try {
        await new ConsoleMailer().send({
          to: 'khach@sango.vn',
          subject: '[SanGo] Đã xác nhận đơn CH-20260825-0001',
          html: '<p>x</p>',
        });
        expect(log).toHaveBeenCalledWith(
          '[MAIL] to=khach@sango.vn subject=[SanGo] Đã xác nhận đơn CH-20260825-0001',
        );
      } finally {
        log.mockRestore();
      }
    });
  });

  describe('SmtpMailer stub', () => {
    it('thiếu nodemailer -> tự fallback console, KHÔNG ném lỗi làm vỡ nghiệp vụ', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const err = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      try {
        await new SmtpMailer().send({ to: 'a@b.vn', subject: 's', html: '<p/>' });
        expect(log).toHaveBeenCalledWith('[MAIL] to=a@b.vn subject=s');
      } finally {
        warn.mockRestore();
        err.mockRestore();
        log.mockRestore();
      }
    });
  });
});
