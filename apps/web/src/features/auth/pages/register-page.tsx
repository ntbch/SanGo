import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  User,
  Phone,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '../../../lib/auth-store';
import { UserRole } from '../../../lib/constants';
import { registerApi } from '../api/auth-api';
import { cn } from '../../../lib/utils';
import { AuthBrandHeader } from '../components/auth-brand-header';

export function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = React.useState<UserRole>(UserRole.CUSTOMER);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMessage('Vui lòng điền các trường bắt buộc.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerApi({
        fullName,
        email,
        phone: phone || undefined,
        password,
        role,
      });
      setSession(res.user, res.accessToken, res.refreshToken);

      if (res.user.role === UserRole.OWNER) {
        navigate('/dashboard/owner/venues', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký không thành công. Email có thể đã được sử dụng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
      <AuthBrandHeader />

      <Card className="w-full max-w-md border border-border bg-card shadow-md">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-foreground">Tạo Tài Khoản Mới</CardTitle>
          <p className="text-xs text-muted-foreground">Tham gia mạng lưới thể thao phong trào SanGo.</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Role Selection Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Bạn tham gia với tư cách <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary/50 border border-border/60">
              <button
                type="button"
                onClick={() => setRole(UserRole.CUSTOMER)}
                className={cn(
                  'py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                  role === UserRole.CUSTOMER
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <User className="h-3.5 w-3.5" />
                <span>Người Chơi</span>
              </button>

              <button
                type="button"
                onClick={() => setRole(UserRole.OWNER)}
                className={cn(
                  'py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                  role === UserRole.OWNER
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Chủ Cụm Sân</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Họ và tên <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10 h-10 text-xs"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Địa chỉ Email <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-10 text-xs"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Số điện thoại (tùy chọn)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="0987654321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-10 text-xs font-mono-num"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Mật khẩu <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-10 text-xs font-mono-num"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Xác nhận mật khẩu <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-10 text-xs font-mono-num"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full font-bold text-xs h-10 shadow-lg shadow-emerald-500/20 mt-2"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}
            </Button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-muted-foreground pt-1">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-extrabold hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
