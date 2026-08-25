import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Phone, ShieldCheck, User, UserPlus } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { APP_NAME } from '@courthub/shared';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
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
import { register } from '../api';
import { AuthInput } from '../components/auth-input';
import { AUTH_CARD_CLASS, AuthShell } from '../components/auth-shell';
import { registerFormSchema, type RegisterFormValues } from '../schemas';

export function RegisterPage(): ReactElement {
  const navigate = useNavigate();
  const [successOpen, setSuccessOpen] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register(values);
      setSuccessOpen(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Đăng ký thất bại',
        description: friendlyApiMessage(error),
      });
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <>
      <AuthShell>
        <Card className={AUTH_CARD_CLASS}>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <UserPlus className="size-5" aria-hidden />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight">
                Tạo tài khoản {APP_NAME}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Miễn phí cho khách đặt sân. Chủ sân đăng ký kinh doanh sau khi đăng nhập.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <AuthInput
                        icon={<User aria-hidden />}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <AuthInput
                        icon={<Phone aria-hidden />}
                        type="tel"
                        inputMode="tel"
                        placeholder="0901234567 (không bắt buộc)"
                        autoComplete="tel"
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
                        placeholder="Tối thiểu 8 ký tự"
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
                    <FormLabel>Nhập lại mật khẩu</FormLabel>
                    <FormControl>
                      <AuthInput
                        icon={<ShieldCheck aria-hidden />}
                        type="password"
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
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
              >
                {isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{'  '}
            <RouterLink
              to="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Đăng nhập
            </RouterLink>
          </p>
        </Card>
      </AuthShell>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo tài khoản thành công 🎉</DialogTitle>
            <DialogDescription>
              Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập để bắt đầu tìm và đặt sân thể thao.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuccessOpen(false)}>
              Để sau
            </Button>
            <Button onClick={() => navigate('/login', { replace: true })}>Đăng nhập ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
