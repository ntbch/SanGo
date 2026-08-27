import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { useAuthStore } from '../../../lib/auth-store';
import { User, Phone, Mail, Shield, Award, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateProfileApi, changePasswordApi } from '../api/auth-api';

export function ProfilePage(): React.ReactElement {
  const { user, updateUser } = useAuthStore();

  // Profile Form State
  const [fullName, setFullName] = React.useState(user?.fullName || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pwdLoading, setPwdLoading] = React.useState(false);
  const [pwdMsg, setPwdMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      setProfileMsg({ type: 'error', text: 'Họ và tên không được để trống' });
      return;
    }

    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const updated = await updateProfileApi({ fullName, phone: phone || undefined });
      updateUser(updated);
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin thành công' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Không thể cập nhật hồ sơ' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPwdMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ mật khẩu' });
      return;
    }

    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setPwdLoading(true);
    setPwdMsg(null);

    try {
      await changePasswordApi({ currentPassword, newPassword });
      setPwdMsg({ type: 'success', text: 'Đổi mật khẩu thành công' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Đổi mật khẩu không thành công' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary font-black text-xl border border-primary/20">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{user?.fullName}</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/50 text-xs font-semibold">
            <Shield className="h-4 w-4 text-primary" />
            <span>Vai trò: <strong className="text-foreground">{user?.role}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Award className="h-4 w-4" />
            <span>Điểm uy tín: <strong>{user?.reputationScore ?? 100}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full sm:w-80 grid-cols-2">
          <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile Info */}
        <TabsContent value="profile">
          <Card className="max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chỉnh sửa hồ sơ</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileMsg && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                      profileMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-primary'
                        : 'bg-destructive/10 border border-destructive/20 text-destructive'
                    }`}
                  >
                    {profileMsg.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Họ và tên</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    prefixIcon={<User className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    prefixIcon={<Mail className="h-4 w-4" />}
                    className="opacity-70 bg-muted/40 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">Email tài khoản không thể thay đổi.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Số điện thoại</label>
                  <Input
                    type="tel"
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    prefixIcon={<Phone className="h-4 w-4" />}
                  />
                </div>

                <Button type="submit" loading={profileLoading} className="font-bold shadow-xs">
                  Lưu thay đổi
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Change Password */}
        <TabsContent value="password">
          <Card className="max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Đổi mật khẩu tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {pwdMsg && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                      pwdMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-primary'
                        : 'bg-destructive/10 border border-destructive/20 text-destructive'
                    }`}
                  >
                    {pwdMsg.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Mật khẩu hiện tại</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    prefixIcon={<KeyRound className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    prefixIcon={<KeyRound className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Xác nhận mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    prefixIcon={<KeyRound className="h-4 w-4" />}
                    required
                  />
                </div>

                <Button type="submit" loading={pwdLoading} className="font-bold shadow-xs">
                  Cập nhật mật khẩu
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
