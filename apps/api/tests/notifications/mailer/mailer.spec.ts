import { createTransport } from 'nodemailer';
import { ConsoleMailer } from '../../../src/notifications/mailer/console.mailer';
import { SmtpMailer } from '../../../src/notifications/mailer/smtp.mailer';
import { createDefaultMailer } from '../../../src/notifications/mailer/mailer.factory';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const transport = jest.mocked(createTransport);
const input = { to: 'test@example.invalid', subject: 'Test', html: '<p>Test</p>' };

describe('Mailer transport failures', () => {
  beforeEach(() => {
    transport.mockReset();
  });

  it('SMTP_HOST đã cấu hình -> SmtpMailer', () => {
    expect(createDefaultMailer({ SMTP_HOST: 'smtp.gmail.com' })).toBeInstanceOf(SmtpMailer);
  });

  it('dùng env được inject (không phải process.env) cho host/port/from', async () => {
    const sendMail = jest.fn().mockResolvedValue({ rejected: [] });
    transport.mockReturnValue({ sendMail } as never);
    process.env.SMTP_HOST = 'process-env-host';
    process.env.SMTP_PORT = '2525';
    process.env.MAIL_FROM = 'process-env@sango.vn';
    try {
      const mailer = createDefaultMailer({
        SMTP_HOST: 'injected-host',
        SMTP_PORT: '587',
        MAIL_FROM: 'injected@sango.vn',
      });
      expect(transport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'injected-host',
          port: 587,
          secure: false,
          requireTLS: true,
        }),
      );
      await mailer.send(input);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'injected@sango.vn', to: input.to }),
      );
    } finally {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.MAIL_FROM;
    }
  });

  it('cổng 465 -> TLS ngầm định, không cần STARTTLS', () => {
    createDefaultMailer({ SMTP_HOST: 'injected-host', SMTP_PORT: '465' });
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true, requireTLS: false }),
    );
  });

  it('không có SMTP_HOST -> ConsoleMailer, ghi log đúng định dạng [MAIL]', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      expect(createDefaultMailer({})).toBeInstanceOf(ConsoleMailer);
      await createDefaultMailer({}).send(input);
      expect(log).toHaveBeenCalledWith(
        `[MAIL] to=${input.to} subject=${input.subject}`,
      );
    } finally {
      log.mockRestore();
    }
  });

  it('propagates SMTP failures instead of pretending to send', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
    transport.mockReturnValue({ sendMail } as never);
    await expect(new SmtpMailer({ SMTP_HOST: 'smtp.example.invalid' }).send(input))
      .rejects.toThrow('SMTP unavailable');
  });

  it('rejects when SMTP refuses the recipient', async () => {
    transport.mockReturnValue({ sendMail: jest.fn().mockResolvedValue({ rejected: [input.to] }) } as never);
    await expect(new SmtpMailer({ SMTP_HOST: 'smtp.example.invalid' }).send(input))
      .rejects.toThrow('SMTP từ chối người nhận email');
  });

  it('resolves only after SMTP accepts the recipient', async () => {
    let accept!: (value: { rejected: string[] }) => void;
    transport.mockReturnValue({ sendMail: jest.fn().mockReturnValue(new Promise((resolve) => { accept = resolve; })) } as never);
    let completed = false;
    const sending = new SmtpMailer({ SMTP_HOST: 'smtp.example.invalid' }).send(input).then(() => { completed = true; });
    await Promise.resolve();
    expect(completed).toBe(false);
    accept({ rejected: [] });
    await sending;
    expect(completed).toBe(true);
  });
});
