import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

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
import { toast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { usePageMeta } from '../../../lib/seo';
import { requestResetPassword } from '../api';
import { AuthInput } from '../components/auth-input';
import { AUTH_CARD_CLASS, AuthShell } from '../components/auth-shell';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '../schemas';

/** Trang /dat-lai-mat-khau?token=... — đặt lại mật khẩu bằng token từ email (P1-F2). */
export function ResetPasswordPage(): ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  // SEO cơ bản cho trang public.
  usePageMeta('Đặt lại mật khẩu', 'Đặt lại mật khẩu tài khoản CourtHub bằng link gửi qua email.');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { token, newPassword: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await requestResetPassword(values);
      toast({
        title: 'Đổi mật khẩu thành công',
        description: 'Mật khẩu mới đã được áp dụng. Vui lòng đăng nhập lại.',
      });
      navigate('/login', { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Không đặt lại được mật khẩu',
        description: friendlyApiMessage(error),
      });
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <AuthShell>
      <Card className={AUTH_CARD_CLASS}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">
              Đặt lại mật khẩu {APP_NAME}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Nhập mật khẩu mới cho tài khoản của bạn. Mọi phiên đăng nhập cũ sẽ bị thoát.
            </p>
          </div>
        </div>

        {token === '' ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            Thiếu token đặt lại mật khẩu. Vui lòng mở đúng link trong email đã gửi.
          </p>
        ) : null}

        <Form {...form}>
          {/* Token lấy từ querystring, không hiện ô nhập; giữ trong form để validate độ dài. */}
          <input type="hidden" {...form.register('token')} />
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <AuthInput
                      icon={<Lock aria-hidden />}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhập lại mật khẩu mới</FormLabel>
                  <FormControl>
                    <AuthInput
                      icon={<ShieldCheck aria-hidden />}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting || token === ''}
              className="h-11 w-full rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
            >
              {isSubmitting ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
            </Button>
          </form>
        </Form>

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
