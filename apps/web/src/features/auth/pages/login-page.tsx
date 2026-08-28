import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  User,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../../lib/auth-store';
import { UserRole } from '../../../lib/constants';
import { loginApi } from '../api/auth-api';
import { AuthBrandHeader } from '../components/auth-brand-header';

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const from =
    typeof (location.state as any)?.from === 'string'
      ? (location.state as any).from
      : (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginApi({ email, password });
      setSession(res.user, res.accessToken, res.refreshToken);

      if (res.user.role === UserRole.OWNER || res.user.role === UserRole.ADMIN) {
        navigate('/dashboard/owner/venues', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'CUSTOMER' | 'OWNER') => {
    setIsLoading(true);
    setErrorMessage(null);

    const demoEmail = demoRole === 'OWNER' ? 'owner@sango.vn' : 'customer@sango.vn';
    const demoPass = 'Sango@2026';

    try {
      const res = await loginApi({ email: demoEmail, password: demoPass });
      setSession(res.user, res.accessToken, res.refreshToken);

      if (res.user.role === UserRole.OWNER || res.user.role === UserRole.ADMIN) {
        navigate('/dashboard/owner/venues', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đăng nhập bằng tài khoản mẫu. Vui lòng kiểm tra lại kết nối backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-background via-card/30 to-background">
      <AuthBrandHeader />

      <Card className="w-full max-w-md border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-foreground">Đăng Nhập Tài Khoản</CardTitle>
          <p className="text-xs text-muted-foreground">Nhập thông tin tài khoản SanGo để tiếp tục đặt sân.</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground block">
                  Mật khẩu <span className="text-destructive">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full font-bold text-xs h-10 shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}
            </Button>
          </form>

          {/* Quick Demo Login Bar */}
          <div className="space-y-2 pt-3 border-t border-border/60">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block text-center">
              Đăng nhập thử nghiệm nhanh
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => handleDemoLogin('CUSTOMER')}
                className="text-[11px] font-bold h-8 gap-1.5"
              >
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Người Chơi</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => handleDemoLogin('OWNER')}
                className="text-[11px] font-bold h-8 gap-1.5"
              >
                <Building2 className="h-3.5 w-3.5 text-amber-500" />
                <span>Chủ Cụm Sân</span>
              </Button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="text-center text-xs text-muted-foreground pt-1">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary font-extrabold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
