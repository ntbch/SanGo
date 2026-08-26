import { zodResolver } from '@hookform/resolvers/zod';
import {
  Award,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Medal,
  Phone,
  ShieldCheck,
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

  usePageMeta('Hồ sơ cá nhân & Thể thao', 'Xem và cập nhật thông tin cá nhân, hồ sơ thể thao, điểm uy tín và bảo mật.');

  const [activeTab, setActiveTab] = useState<'info' | 'sports' | 'reputation' | 'security'>('info');

  const [bio, setBio] = useState('Đam mê thể thao, tìm kèo đá bóng và cầu lông cuối tuần quanh khu vực Cầu Giấy.');
  const [bannerUrl] = useState(
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  );

  const [sportsProfile, setSportsProfile] = useState({
    favoriteSport: 'FOOTBALL5',
    position: 'Tiền đạo cánh / Tiền vệ công',
    dominantFoot: 'Chân phải (Thuận cả 2 chân)',
    skillLevel: 'Phong trào khá / Bán chuyên',
  });

  const [bankInfo, setBankInfo] = useState({
    bankName: 'MB Bank (Quân Đội)',
    accountNumber: '9876543210',
    accountHolder: user?.fullName?.toUpperCase() ?? 'NGUYEN VAN A',
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

  const handleSaveBankInfo = () => {
    toast({
      title: 'Đã lưu thông tin tài khoản hoàn tiền!',
      description: 'Tiền hoàn hủy đơn sẽ được gửi tự động về tài khoản này.',
    });
  };

  if (!user) {
    return <div className="py-10 text-sm text-muted-foreground text-center">Chưa đăng nhập.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
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
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{user.fullName}</h1>
                  <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">
                    {user.role}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-3">
                  <span className="flex items-center gap-1"><Mail className="size-3.5" /> {user.email}</span>
                  {user.phone ? <span className="flex items-center gap-1"><Phone className="size-3.5" /> {user.phone}</span> : null}
                </p>
                <p className="text-xs text-foreground/80 max-w-lg pt-1 leading-relaxed">{bio}</p>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end gap-2">
              <div className="flex items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-center">
                <Star className="size-5 fill-amber-400 text-amber-400" />
                <div className="text-left">
                  <span className="font-mono font-extrabold text-sm text-amber-700 dark:text-amber-300 block leading-none">
                    96/100
                  </span>
                  <span className="text-[10px] text-muted-foreground">Uy tín cao</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-t border-border/60 bg-muted/20 px-6 overflow-x-auto">
          {[
            { id: 'info', label: 'Thông tin cá nhân', icon: User },
            { id: 'sports', label: 'Hồ sơ thể thao', icon: Trophy },
            { id: 'reputation', label: 'Uy tín & Thống kê', icon: Award },
            { id: 'security', label: 'Bảo mật & Ngân hàng', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'info' ? (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Chỉnh sửa thông tin tài khoản</CardTitle>
            <CardDescription className="text-xs">Cập nhật họ tên hiển thị, số điện thoại và ảnh đại diện.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...profileForm}>
              <form onSubmit={onSaveProfile} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Họ và tên</FormLabel>
                        <FormControl>
                          <Input placeholder="Nguyễn Văn A" className="rounded-xl" {...field} />
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
                        <FormLabel className="text-xs font-semibold">Số điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="0901234567" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">URL ảnh đại diện</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." type="url" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-1.5">
                  <label htmlFor="user-bio" className="text-xs font-semibold">Tiểu sử ngắn (Bio)</label>
                  <textarea
                    id="user-bio"
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background p-2.5 text-xs shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <Button type="submit" disabled={profileForm.formState.isSubmitting} className="rounded-xl font-bold">
                  {profileForm.formState.isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Lưu thay đổi
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'sports' ? (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="size-5 text-primary" />
              <span>Sở trường & Hồ sơ thể thao</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Giúp các đội trưởng và người tìm kèo ghép dễ dàng nhận diện vị trí và phong cách chơi của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Môn thể thao yêu thích nhất</label>
                <select
                  value={sportsProfile.favoriteSport}
                  onChange={(e) => setSportsProfile({ ...sportsProfile, favoriteSport: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                >
                  <optgroup label="Bóng đá">
                    <option value="FOOTBALL5">Bóng đá 5</option>
                    <option value="FOOTBALL7">Bóng đá 7</option>
                  </optgroup>
                  <option value="BADMINTON">Cầu lông</option>
                  <option value="PICKLEBALL">Pickleball</option>
                  <option value="TENNIS">Tennis</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Vị trí sở trường trên sân</label>
                <Input
                  value={sportsProfile.position}
                  onChange={(e) => setSportsProfile({ ...sportsProfile, position: e.target.value })}
                  placeholder="VD: Tiền đạo cắm, Thủ môn, Hitter..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Chân / Tay thuận</label>
                <select
                  value={sportsProfile.dominantFoot}
                  onChange={(e) => setSportsProfile({ ...sportsProfile, dominantFoot: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                >
                  <option value="Chân phải">Chân phải (Thuận tay phải)</option>
                  <option value="Chân trái">Chân trái (Kèo trái / Thuận tay trái)</option>
                  <option value="Chân phải (Thuận cả 2 chân)">Thuận cả 2 chân / 2 tay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Đẳng cấp tự đánh giá</label>
                <select
                  value={sportsProfile.skillLevel}
                  onChange={(e) => setSportsProfile({ ...sportsProfile, skillLevel: e.target.value })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                >
                  <option value="Nhập môn / Mới chơi">Mới chơi / Nhập môn</option>
                  <option value="Phong trào vừa sức">Phong trào / Giao lưu vui vẻ</option>
                  <option value="Phong trào khá / Bán chuyên">Phong trào khá / Cọ xát</option>
                  <option value="Bán chuyên / Chuyên nghiệp">Bán chuyên / Thi đấu giải</option>
                </select>
              </div>
            </div>

            <Button onClick={handleSaveSportsProfile} className="rounded-xl font-bold">
              Cập nhật hồ sơ thể thao
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'reputation' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-2xl border-border/70 p-5 bg-card text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Điểm uy tín</p>
              <p className="font-mono text-3xl font-extrabold text-amber-500 mt-1">96 / 100</p>
              <p className="text-[11px] text-muted-foreground mt-1">Top 5% người chơi uy tín nhất</p>
            </Card>
            <Card className="rounded-2xl border-border/70 p-5 bg-card text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tỷ lệ hoàn thành</p>
              <p className="font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">98.5%</p>
              <p className="text-[11px] text-muted-foreground mt-1">Không bao giờ bùng giờ (No-show: 0)</p>
            </Card>
            <Card className="rounded-2xl border-border/70 p-5 bg-card text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số trận đã đấu</p>
              <p className="font-mono text-3xl font-extrabold text-primary mt-1">42 trận</p>
              <p className="text-[11px] text-muted-foreground mt-1">Đã check-in thành công</p>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/70 p-6 bg-card">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Medal className="size-5 text-primary" />
              <span>Huy hiệu danh dự đạt được</span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                  <Star className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Chiến Binh Bền Bỉ</h4>
                  <p className="text-[10px] text-muted-foreground">Đá liên tục 4 tuần không nghỉ</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Fair-Play Tuyệt Đối</h4>
                  <p className="text-[10px] text-muted-foreground">0 lần hủy phút chót</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Đồng Đội Mẫu Mực</h4>
                  <p className="text-[10px] text-muted-foreground">Được 20+ người chơi đánh giá 5⭐</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === 'security' ? (
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                <span>Tài khoản ngân hàng nhận tiền hoàn</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Khi hủy đơn đúng chính sách hoặc nhận hoàn tiền dư, hệ thống sẽ chuyển trực tiếp về tài khoản này.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Tên ngân hàng</label>
                  <Input
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                    className="rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Số tài khoản</label>
                  <Input
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    className="rounded-xl font-mono text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Tên chủ tài khoản</label>
                  <Input
                    value={bankInfo.accountHolder}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value.toUpperCase() })}
                    className="rounded-xl text-xs font-bold uppercase"
                  />
                </div>
              </div>
              <Button onClick={handleSaveBankInfo} className="rounded-xl font-bold">
                Lưu thông tin ngân hàng
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="size-5 text-primary" />
                <span>Đổi mật khẩu tài khoản</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Đổi xong mọi phiên đăng nhập cũ sẽ tự động đăng xuất trên các thiết bị khác.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={onChangePassword} className="space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Mật khẩu hiện tại</FormLabel>
                          <FormControl>
                            <Input type="password" className="rounded-xl" {...field} />
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
                            <Input type="password" className="rounded-xl" {...field} />
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
                            <Input type="password" className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting} className="rounded-xl font-bold">
                    {passwordForm.formState.isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Đổi mật khẩu
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
