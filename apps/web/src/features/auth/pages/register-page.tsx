import { zodResolver } from '@hookform/resolvers/zod';
import { Trophy } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

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
import { Input } from '../../../components/ui/input';
import { toast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { register } from '../api';
import { registerSchema, type RegisterValues } from '../schemas';

export function RegisterPage(): ReactElement {
  const navigate = useNavigate();
  const [successOpen, setSuccessOpen] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
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
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Trophy className="size-6" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Tạo tài khoản {APP_NAME}</CardTitle>
            <CardDescription>
              Miễn phí cho khách đặt sân. Chủ sân đăng ký kinh doanh sau khi đăng nhập.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" autoComplete="name" {...field} />
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
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{'  '}
            <RouterLink
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Đăng nhập
            </RouterLink>
          </p>
        </CardContent>
      </Card>

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
    </div>
  );
}
