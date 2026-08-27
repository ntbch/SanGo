import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus, AlertCircle, Building2, UserCheck } from 'lucide-react';
import { registerApi } from '../api/auth-api';
import { useAuthStore } from '../../../lib/auth-store';
import { UserRole } from '../../../lib/constants';
import { cn } from '../../../lib/utils';

export function RegisterPage(): React.ReactElement {
  const [role, setRole] = React.useState<UserRole>(UserRole.CUSTOMER);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await registerApi({
        fullName,
        email,
        phone: phone || undefined,
        password,
        role,
      });
      setSession(res.user, res.accessToken, res.refreshToken);
      navigate(role === UserRole.OWNER ? '/dashboard/owner/venues' : '/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-border/80 shadow-md">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Tạo tài khoản</CardTitle>
          <p className="text-xs text-muted-foreground">Đăng ký để đặt sân hoặc quản lý cụm sân thể thao.</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selector Pill */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary/80 border border-border/50">
            <button
              type="button"
              onClick={() => setRole(UserRole.CUSTOMER)}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                role === UserRole.CUSTOMER
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <UserCheck className="h-4 w-4" />
              <span>Người chơi</span>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.OWNER)}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                role === UserRole.OWNER
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Building2 className="h-4 w-4" />
              <span>Chủ cụm sân</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Họ và tên</label>
              <Input
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                prefixIcon={<User className="h-4 w-4" />}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input
                type="email"
                placeholder="ten@vidu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Số điện thoại (tùy chọn)</label>
              <Input
                type="tel"
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                prefixIcon={<Phone className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mật khẩu</label>
              <Input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock className="h-4 w-4" />}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Xác nhận mật khẩu</label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefixIcon={<Lock className="h-4 w-4" />}
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full font-bold shadow-xs mt-2">
              Đăng ký tài khoản
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border/60">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
