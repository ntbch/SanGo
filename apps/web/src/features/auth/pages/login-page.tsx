import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, LogIn, Mail } from 'lucide-react';
import { type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { APP_NAME } from '@sango/shared';
import { safeInternalTarget } from '../../../components/auth/guards';
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
import { useAuthStore } from '../../../lib/auth/auth-store';
import { env } from '../../../lib/env';
import { login } from '../api';
import { AuthInput } from '../components/auth-input';
import { AUTH_CARD_CLASS, AuthShell } from '../components/auth-shell';
import { loginSchema, type LoginDto } from '../schemas';

/** Tài khoản demo hiển thị khi chạy chế độ mock (VITE_USE_MOCK=true). */
const MOCK_HINT_ACCOUNTS = ['customer@sango.vn', 'owner@sango.vn', 'admin@sango.vn'];

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { accessToken, user } = await login(values);
      // P1-F1: ?next=<đường hiện tại> từ hành động khách cần tài khoản (Giữ chỗ/
      // Tham gia trận/AI giữ chỗ); fallback state.from của ProtectedRoute rồi /dashboard.
      const target =
        safeInternalTarget(searchParams.get('next')) ??
        safeInternalTarget((location.state as { from?: string } | null)?.from ?? null) ??
        '/dashboard';
      // QA-T4-01: điều hướng TRƯỚC khi setSession — nếu setSession trước,
      // GuestRoute thấy user!=null sẽ <Navigate to=/dashboard> ghi đè đích next.
      navigate(target, { replace: true });
      setSession(user, accessToken);
      toast({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng trở lại, ' + user.fullName + '!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Đăng nhập thất bại',
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
            <LogIn className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">Đăng nhập {APP_NAME}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Đặt sân nhanh, giữ chỗ an toàn, check-in bằng mã QR.
            </p>
          </div>
        </div>

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
                      placeholder="ban@sango.vn"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <AuthInput
                      icon={<Lock aria-hidden />}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
              {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>
          </form>
        </Form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{'  '}
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Đăng ký
          </Link>
          {'  '}·{'  '}
          <Link
            to="/quen-mat-khau"
            className="underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </p>

        {env.useMock && (
          <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Chế độ demo (mock)</p>
            Đăng nhập thử với mật khẩu{' '}
            <code className="font-score text-primary">Sango@2026</code>:
            <ul className="mt-1 list-inside list-disc">
              {MOCK_HINT_ACCOUNTS.map((account) => (
                <li key={account} className="font-score">
                  {account}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </AuthShell>
  );
}
