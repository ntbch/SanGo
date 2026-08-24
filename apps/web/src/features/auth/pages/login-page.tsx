import { zodResolver } from '@hookform/resolvers/zod';
import { Trophy } from 'lucide-react';
import { type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { APP_NAME } from '@courthub/shared';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { toast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { env } from '../../../lib/env';
import { login } from '../api';
import { loginSchema, type LoginValues } from '../schemas';

/** Tài khoản demo hiển thị khi chạy chế độ mock (VITE_USE_MOCK=true). */
const MOCK_HINT_ACCOUNTS = ['customer@courthub.vn', 'owner@courthub.vn', 'admin@courthub.vn'];

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { accessToken, user } = await login(values);
      setSession(user, accessToken);
      toast({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng trở lại, ' + user.fullName + '!',
      });
      const target = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(target, { replace: true });
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
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Trophy className="size-6" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Đăng nhập {APP_NAME}</CardTitle>
            <CardDescription>Đặt sân nhanh, giữ chỗ an toàn, check-in bằng mã QR.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <Input
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{'  '}
            <Link
              to="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Đăng ký
            </Link>
            {'  '}·{'  '}
            <Link to="/forgot-password" className="underline-offset-4 hover:underline">
              Quên mật khẩu?
            </Link>
          </p>

          {env.useMock && (
            <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Chế độ demo (mock)</p>
              Đăng nhập thử với mật khẩu <code className="text-primary">Courthub@2026</code>:
              <ul className="mt-1 list-inside list-disc">
                {MOCK_HINT_ACCOUNTS.map((account) => (
                  <li key={account} className="font-mono">
                    {account}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
