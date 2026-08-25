import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { APP_NAME } from '@courthub/shared';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { forgotPassword } from '../api';
import { AuthInput } from '../components/auth-input';
import { AUTH_CARD_CLASS, AuthShell } from '../components/auth-shell';
import { forgotPasswordSchema, type ForgotPasswordDto } from '../schemas';

export function ForgotPasswordPage(): ReactElement {
  const [sentTo, setSentTo] = useState<string | null>(null);
  // Mock mode: server trả kèm link đặt lại để demo không cần đọc console.
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await forgotPassword(values);
      setDevResetLink(response.devResetLink ?? null);
      setSentTo(values.email.trim().toLowerCase());
    } catch {
      // Không tiết lộ email có tồn tại hay không — luôn hiện thông báo chung.
      setDevResetLink(null);
      setSentTo(values.email.trim().toLowerCase());
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <AuthShell>
      <Card className={AUTH_CARD_CLASS}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">
              Quên mật khẩu {APP_NAME}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Nhập email đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
            </p>
          </div>
        </div>

        {sentTo === null ? (
          <Form {...form}>
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <AuthInput
                        icon={<Mail aria-hidden />}
                        type="email"
                        placeholder="ban@courthub.vn"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
              >
                {isSubmitting ? 'Đang gửi…' : 'Gửi hướng dẫn đặt lại mật khẩu'}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="mt-6 space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <MailCheck className="size-5" aria-hidden /> Đã gửi email hướng dẫn
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Nếu <span className="font-score">{sentTo}</span> tồn tại trong hệ thống, bạn sẽ nhận
              được email đặt lại mật khẩu trong ít phút. Kiểm tra cả mục thư rác nhé.
            </p>
            {/* Mock/dev mode: mở thẳng form đặt lại mà không cần đọc console API. */}
            {devResetLink !== null ? (
              <p className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2 text-xs text-muted-foreground">
                Chế độ demo — link đặt lại mật khẩu:{' '}
                <Link
                  to={devResetLink}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Đặt lại mật khẩu ngay →
                </Link>
              </p>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setSentTo(null)}
            >
              Gửi lại cho email khác
            </Button>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Nhớ lại mật khẩu rồi?{'  '}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
