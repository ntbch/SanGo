import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Star,
  Trophy,
  User,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
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
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../components/ui/use-toast';
import { changePassword } from '../../auth/api';
import { changePasswordFormSchema, type ChangePasswordFormValues } from '../../auth/schemas';
import { UserAvatar } from '../components/user-avatar';
import { updateMe } from '../api';
import { profileFormSchema } from '../schemas';
import { ReputationCard } from '../../reputation/components/reputation-card';
import { useMyReputation } from '../../reputation/queries';

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

  const reputationQuery = useMyReputation();

  usePageMeta('Hồ sơ cá nhân & Thể thao', 'Xem và cập nhật thông tin cá nhân, hồ sơ thể thao, điểm uy tín và bảo mật.');

  const [bannerUrl] = useState(
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  );

  const [sportsProfile, setSportsProfile] = useState({
    favoriteSport: 'FOOTBALL5',
    position: 'Tiền đạo cánh / Tiền vệ công',
    dominantFoot: 'Chân phải (Thuận cả 2 chân)',
    skillLevel: 'Phong trào khá / Bán chuyên',
  });

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

  function toNullableText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    try {
      const response = await updateMe({
        fullName: toNullableText(values.fullName) ?? '',
        phone: toNullableText(values.phone),
        avatarUrl: toNullableText(values.avatarUrl),
      });
      if (accessToken) {
        setSession(response.user, accessToken);
      }
      toast({ title: 'Đã lưu hồ sơ', description: 'Thông tin cá nhân của bạn đã được cập nhật thành công.' });
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

  const handleSaveSportsProfile = () => {
    toast({
      title: 'Đã cập nhật hồ sơ thể thao!',
      description: 'Thông tin sở trường sẽ hiển thị khi bạn tham gia các kèo ghép trận.',
    });
  };

  if (!user) {
    return <div className="py-10 text-sm text-muted-foreground text-center">Chưa đăng nhập.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header Profile Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-navy">
          <img src={bannerUrl} alt="Cover banner" className="size-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-md">
              <Sparkles className="size-3 text-turf-bright" /> Thành viên SanGo
            </span>
          </div>
        </div>

        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative size-28 sm:size-32 rounded-3xl border-4 border-background bg-card overflow-hidden shadow-xl">
                <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} size={120} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Hồ sơ cá nhân</h1>
                  <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">
                    {user.role}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-primary">{user.fullName}</p>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-3">
                  <span className="flex items-center gap-1"><Mail className="size-3.5" /> {user.email}</span>
                  {user.phone ? <span className="flex items-center gap-1"><Phone className="size-3.5" /> {user.phone}</span> : null}
                </p>
                <p className="text-xs text-foreground/80 max-w-lg pt-1 leading-relaxed">
                  Đam mê thể thao, tìm kèo đá bóng và cầu lông cuối tuần quanh khu vực Cầu Giấy.
                </p>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end gap-2">
              <div className="flex items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-center">
                <Star className="size-5 fill-amber-400 text-amber-400" />
                <div className="text-left">
                  <span className="font-score font-extrabold text-sm text-amber-700 dark:text-amber-300 block leading-none">
                    {reputationQuery.data?.score ?? 100}/100
                  </span>
                  <span className="text-[10px] text-muted-foreground">Uy tín</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Điểm Uy Tín Card (S3-F2) */}
      <ReputationCard reputation={reputationQuery.data} loading={reputationQuery.isPending} />

      {/* Main Grid: Form thông tin cá nhân & Đổi mật khẩu */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form Thông tin cá nhân */}
        <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="size-4 text-primary" />
              Thông tin cá nhân
            </CardTitle>
            <CardDescription className="text-xs">
              Cập nhật họ tên hiển thị và số điện thoại liên hệ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <Form {...profileForm}>
              <form onSubmit={onSaveProfile} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Họ tên</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Họ và tên"
                          className="rounded-xl font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-xs font-semibold">Email đăng nhập</FormLabel>
                  <FormControl>
                    <Input
                      disabled
                      value={user.email}
                      className="rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">Email không thể thay đổi sau khi đăng ký</p>
                </FormItem>

                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Số điện thoại</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: 0901234567"
                          className="rounded-xl font-score font-medium"
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
                      <FormLabel className="text-xs font-semibold">Ảnh đại diện (URL)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          className="rounded-xl text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting}
                  className="w-full rounded-xl font-bold mt-2"
                >
                  {profileForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Đang lưu…
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Form Đổi mật khẩu & Bảo mật */}
        <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              Đổi mật khẩu
            </CardTitle>
            <CardDescription className="text-xs">
              Bảo vệ tài khoản bằng mật khẩu mạnh có chữ hoa, số và ký tự đặc biệt
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <Form {...passwordForm}>
              <form onSubmit={onChangePassword} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Mật khẩu hiện tại</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="rounded-xl"
                          {...field}
                        />
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
                      <FormLabel className="text-xs font-semibold">Mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="rounded-xl"
                          {...field}
                        />
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
                      <FormLabel className="text-xs font-semibold">Nhập lại mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                  className="w-full rounded-xl font-bold mt-2"
                >
                  {passwordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Đang cập nhật…
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

      {/* Hồ sơ thể thao Card */}
      <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Trophy className="size-4 text-turf" />
              Hồ sơ thể thao & Kỹ năng
            </CardTitle>
            <CardDescription className="text-xs">
              Thông tin kỹ năng và vị trí sở trường khi tham gia ghép trận cộng đồng
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveSportsProfile}
            className="rounded-xl font-semibold text-xs"
          >
            Lưu hồ sơ thể thao
          </Button>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Môn thể thao yêu thích</label>
              <Input
                value={sportsProfile.favoriteSport}
                onChange={(e) => setSportsProfile({ ...sportsProfile, favoriteSport: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Vị trí thi đấu sở trường</label>
              <Input
                value={sportsProfile.position}
                onChange={(e) => setSportsProfile({ ...sportsProfile, position: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Chân / Tay thuận</label>
              <Input
                value={sportsProfile.dominantFoot}
                onChange={(e) => setSportsProfile({ ...sportsProfile, dominantFoot: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Trình độ tự đánh giá</label>
              <Input
                value={sportsProfile.skillLevel}
                onChange={(e) => setSportsProfile({ ...sportsProfile, skillLevel: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
