import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

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
import { usePageMeta } from '../../../lib/seo';
import { requestResetPassword } from '../api';
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
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <KeyRound className="size-6" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Đặt lại mật khẩu {APP_NAME}</CardTitle>
            <CardDescription>
              Nhập mật khẩu mới cho tài khoản của bạn. Mọi phiên đăng nhập cũ sẽ bị thoát.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {token === '' ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              Thiếu token đặt lại mật khẩu. Vui lòng mở đúng link trong email đã gửi.
            </p>
          ) : null}
          <Form {...form}>
            {/* Token lấy từ querystring, không hiện ô nhập; giữ trong form để validate độ dài. */}
            <input type="hidden" {...form.register('token')} />
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input
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
                      <Input
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
              <Button type="submit" className="w-full" disabled={isSubmitting || token === ''}>
                {isSubmitting ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Nhớ lại mật khẩu rồi?{'  '}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Quay lại đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
