/**
 * Trang /dashboard/profile (P1-F2): xem/sửa fullName/phone/avatarUrl
 * (PATCH /users/me) + form đổi mật khẩu (POST /auth/change-password).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

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
import { useToast } from '../../../components/ui/use-toast';
import { changePassword } from '../../auth/api';
import { changePasswordFormSchema, type ChangePasswordFormValues } from '../../auth/schemas';
import { UserAvatar } from '../components/user-avatar';
import { updateMe } from '../api';
import { profileFormSchema } from '../schemas';

import { friendlyApiMessage } from '../../../lib/api/api-error';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { usePageMeta } from '../../../lib/seo';

export function ProfilePage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { toast } = useToast();
  const navigate = useNavigate();

  // SEO cơ bản — trang nằm trong dashboard nhưng vẫn nên có title riêng.
  usePageMeta(
    'Hồ sơ cá nhân',
    'Xem và cập nhật thông tin cá nhân, đổi mật khẩu tài khoản CourtHub.',
  );

  const profileForm = useForm<{
    fullName: string;
    phone: string;
    avatarUrl: string;
  }>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  /** Chuẩn hoá trường tuỳ chọn: rỗng/null -> null (xoá trắng), còn lại trim. */
  function toNullableText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    try {
      // Lưu ý: zodResolver trả về dữ liệu đã qua preprocess (ô bỏ trống -> null).
      const response = await updateMe({
        fullName: toNullableText(values.fullName) ?? '',
        // Bỏ trống -> null để xoá trắng trường (khớp contract PATCH /users/me).
        phone: toNullableText(values.phone),
        avatarUrl: toNullableText(values.avatarUrl),
      });
      // Đồng bộ lại store phiên với user mới nhất (giữ nguyên access token).
      if (accessToken !== null && accessToken !== undefined && accessToken !== '') {
        setSession(response.user, accessToken);
      }
      toast({ title: 'Đã lưu hồ sơ', description: 'Thông tin cá nhân của bạn đã được cập nhật.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Không lưu được hồ sơ',
        description: friendlyApiMessage(error),
      });
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await changePassword(values);
      // Backend thu hồi mọi phiên cũ + xoá cookie refresh -> client đăng xuất sạch.
      clearSession();
      toast({
        title: 'Đổi mật khẩu thành công',
        description: 'Vui lòng đăng nhập lại bằng mật khẩu mới.',
      });
      navigate('/login', { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Không đổi được mật khẩu',
        description: friendlyApiMessage(error),
      });
    }
  });

  if (user === null || user === undefined) {
    // ProtectedRoute đã chặn khách, đây chỉ là lưới an toàn kiểu dữ liệu.
    return <div className="py-10 text-sm text-muted-foreground">Chưa đăng nhập.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} size={64} />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      {/* Thông tin cá nhân */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật họ tên, số điện thoại và ảnh đại diện.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={onSaveProfile} className="space-y-4" noValidate>
              <FormField
                control={profileForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0901234567"
                        autoComplete="tel"
                        inputMode="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL ảnh đại diện</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
                className="rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
              >
                {profileForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Đang lưu…
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Đổi mật khẩu */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <KeyRound className="size-5" aria-hidden />
            </span>
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Đổi xong mọi phiên đăng nhập cũ sẽ bị thoát trên tất cả thiết bị.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={onChangePassword} className="space-y-4" noValidate>
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu hiện tại</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhập lại mật khẩu mới</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Đang đổi…
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
