import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  KeyRound,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Building2,
  Sparkles,
  Camera,
  Upload,
  UserCheck,
  Calendar,
  Wallet,
  ShieldCheck,
  Bell,
  QrCode,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../../lib/auth-store';
import { UserRole, CITIES, DISTRICTS_BY_CITY } from '../../../lib/constants';
import {
  loginApi,
  registerApi,
  forgotPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  updateProfileApi,
} from '../api/auth-api';
import { cn, formatVND } from '../../../lib/utils';

function AuthBrandHeader() {
  return (
    <div className="flex flex-col items-center mb-6 space-y-2">
      <Link to="/" className="flex items-center gap-2 group cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
          SG
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xl font-black tracking-tight text-foreground leading-none">
            San<span className="text-primary">Go</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sports Hub
          </span>
        </div>
      </Link>
    </div>
  );
}

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

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

    const demoEmail = demoRole === 'OWNER' ? 'owner1@sango.vn' : 'player1@sango.vn';
    const demoPass = 'Password@123';

    try {
      const res = await loginApi({ email: demoEmail, password: demoPass });
      setSession(res.user, res.accessToken, res.refreshToken);

      if (res.user.role === UserRole.OWNER || res.user.role === UserRole.ADMIN) {
        navigate('/dashboard/owner/venues', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      // Fallback local mock session if backend is not reachable
      const mockUser = {
        id: demoRole === 'OWNER' ? 'u-owner-1' : 'u-cust-1',
        email: demoEmail,
        fullName: demoRole === 'OWNER' ? 'Nguyễn Văn Chủ Sân' : 'Trần Đức Người Chơi',
        role: demoRole === 'OWNER' ? UserRole.OWNER : UserRole.CUSTOMER,
        phone: '0987654321',
        reputationScore: 100,
      };
      setSession(mockUser, 'mock-jwt-token-demo');
      navigate(demoRole === 'OWNER' ? '/dashboard/owner/venues' : from, { replace: true });
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
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-background via-card/30 to-background">
      <AuthBrandHeader />

      <Card className="w-full max-w-md border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
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

export function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await forgotPasswordApi(email);
      setIsSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi yêu cầu khôi phục. Vui lòng thử lại.');
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
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-foreground">Quên Mật Khẩu</CardTitle>
          <p className="text-xs text-muted-foreground">Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {isSent ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-foreground">Đã gửi hướng dẫn khôi phục!</p>
              <p className="text-[11px] text-muted-foreground">
                Vui lòng kiểm tra hộp thư đến tại <strong>{email}</strong> và làm theo hướng dẫn.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button size="sm" variant="outline" className="text-xs font-bold">
                    Quay lại Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  size="lg"
                  className="w-full font-bold text-xs h-10 shadow-lg shadow-emerald-500/20"
                >
                  {isLoading ? 'Đang gửi mã...' : 'Gửi Liên Kết Khôi Phục'}
                </Button>
              </form>

              <div className="text-center text-xs text-muted-foreground pt-1">
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ResetPasswordPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = React.useState(tokenFromUrl);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ mã token và mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await resetPasswordApi(token, newPassword);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Mã token không hợp lệ hoặc đã hết hạn.');
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
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-foreground">Đặt Lại Mật Khẩu</CardTitle>
          <p className="text-xs text-muted-foreground">Nhập mã xác thực và thiết lập mật khẩu mới.</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {isSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-foreground">Đặt lại mật khẩu thành công!</p>
              <p className="text-[11px] text-muted-foreground">Đang tự động chuyển về trang Đăng nhập...</p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!tokenFromUrl && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Mã xác thực Token <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Nhập mã token từ email"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      className="h-10 text-xs font-mono-num"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Mật khẩu mới <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pl-10 h-10 text-xs font-mono-num"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Xác nhận mật khẩu mới <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 h-10 text-xs font-mono-num"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full font-bold text-xs h-10 shadow-lg shadow-emerald-500/20"
                >
                  {isLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export type ProfileTab = 'OVERVIEW' | 'PROFILE' | 'BOOKINGS' | 'WALLET' | 'SECURITY' | 'NOTIFICATIONS';

export function ProfilePage(): React.ReactElement {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = React.useState<ProfileTab>('OVERVIEW');

  // Form Profile states
  const [fullName, setFullName] = React.useState(user?.fullName || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || '');
  const [city, setCity] = React.useState('Hà Nội');
  const [district, setDistrict] = React.useState('Ba Đình');
  const [bio, setBio] = React.useState('Người đam mê thể thao phong trào.');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateMsg, setUpdateMsg] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Form Change Password states
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [isChangingPass, setIsChangingPass] = React.useState(false);
  const [passMsg, setPassMsg] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Notification toggles
  const [notifyMatchReminder, setNotifyMatchReminder] = React.useState(true);
  const [notifyMatchInvites, setNotifyMatchInvites] = React.useState(true);
  const [notifyVouchers, setNotifyVouchers] = React.useState(false);

  if (!user) {
    return (
      <div className="w-full py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Vui lòng đăng nhập để xem hồ sơ cá nhân.</p>
        <Link to="/login">
          <Button size="sm">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  // Xử lý upload avatar từ thiết bị
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn kích thước file <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUpdateMsg({ text: 'Kích thước ảnh tối đa là 5MB.', isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setAvatarUrl(dataUrl);
      updateUser({ avatarUrl: dataUrl });
      updateProfileApi({ avatarUrl: dataUrl }).catch(() => {});
      setUpdateMsg({ text: 'Đã cập nhật ảnh đại diện thành công!' });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg(null);

    try {
      const updated = await updateProfileApi({ fullName, phone, avatarUrl });
      updateUser(updated);
      setUpdateMsg({ text: 'Đã lưu thông tin cá nhân thành công.' });
    } catch (err: any) {
      setUpdateMsg({ text: err.message || 'Cập nhật không thành công.', isError: true });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      setPassMsg({ text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.', isError: true });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassMsg({ text: 'Mật khẩu xác nhận không khớp.', isError: true });
      return;
    }

    setIsChangingPass(true);
    setPassMsg(null);

    try {
      await changePasswordApi({ currentPassword, newPassword });
      setPassMsg({ text: 'Đổi mật khẩu thành công.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPassMsg({ text: err.message || 'Đổi mật khẩu thất bại.', isError: true });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sideNavItems: { id: ProfileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'OVERVIEW', label: 'Tổng Quan & Thẻ VĐV', icon: Sparkles },
    { id: 'PROFILE', label: 'Thông Tin Cá Nhân & Avatar', icon: UserCheck },
    { id: 'BOOKINGS', label: 'Vé Đặt Sân Của Tôi', icon: Calendar },
    { id: 'WALLET', label: 'Ví Tiền SanGo', icon: Wallet },
    { id: 'SECURITY', label: 'Bảo Mật & Đổi Mật Khẩu', icon: ShieldCheck },
    { id: 'NOTIFICATIONS', label: 'Cài Đặt Thông Báo', icon: Bell },
  ];

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      {/* 2-Column Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* =========================================
            1. LEFT SIDE PANEL (Sidebar Navigation)
           ========================================= */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-20">
          <Card className="p-5 border border-border/80 bg-card/95 backdrop-blur-md shadow-xl space-y-5">
            {/* Athlete Profile Mini Card */}
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border/60">
              {/* Avatar with Camera Upload Overlay */}
              <div className="relative group">
                <div className="h-20 w-20 rounded-3xl bg-primary/15 border-2 border-primary/40 text-primary font-black text-3xl flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/20">
                  {user.avatarUrl || avatarUrl ? (
                    <img
                      src={user.avatarUrl || avatarUrl || ''}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Tải ảnh đại diện từ thiết bị"
                  className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Name, Role & Compact Reputation Badge */}
              <div className="space-y-1 min-w-0 w-full">
                <h2 className="text-base font-black text-foreground truncate">{user.fullName}</h2>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="pt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
                    {user.role === UserRole.OWNER ? 'Chủ Cụm Sân' : user.role === UserRole.ADMIN ? 'Quản Trị' : 'Người Chơi'}
                  </span>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/80 text-[10px] font-bold">
                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="text-muted-foreground">Uy Tín:</span>
                    <span className="font-mono-num text-primary font-black">{user.reputationScore ?? 100}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Navigation Menu */}
            <nav className="space-y-1">
              {sideNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setUpdateMsg(null);
                      setPassMsg(null);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={cn('h-3.5 w-3.5 opacity-60', isActive && 'text-primary-foreground')} />
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </Card>
        </aside>

        {/* =========================================
            2. RIGHT CONTENT AREA (Active Tab Content)
           ========================================= */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* TAB 1: OVERVIEW & ATHLETE PASSPORT */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Athlete Sports Passport Card */}
              <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-2xl rounded-3xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-mono-num font-black text-2xl border border-primary/30 overflow-hidden">
                      {user.avatarUrl || avatarUrl ? (
                        <img src={user.avatarUrl || avatarUrl || ''} alt={user.fullName} className="h-full w-full object-cover" />
                      ) : (
                        user.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                        SanGo Athlete Passport
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground">{user.fullName}</h2>
                      <p className="text-xs text-muted-foreground font-mono-num">{user.email} · {phone || '0987654321'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 border border-border/80 text-foreground">
                      <QrCode className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>

                {/* 3 Athlete Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-6 text-center">
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Uy Tín</span>
                    <span className="font-mono-num font-black text-base sm:text-lg text-primary">100%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Số Trận Đã Đấu</span>
                    <span className="font-mono-num font-black text-base sm:text-lg text-foreground">12 Trận</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Đội Bóng</span>
                    <span className="font-mono-num font-black text-base sm:text-lg text-foreground">2 CLB</span>
                  </div>
                </div>
              </Card>

              {/* Quick Actions Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/venues" className="block">
                  <Card className="p-4 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Đặt Sân Mới</p>
                          <p className="text-[10px] text-muted-foreground">Chọn lịch 7 ngày</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                </Link>

                <Link to="/matches" className="block">
                  <Card className="p-4 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Ghép Kèo Tự Do</p>
                          <p className="text-[10px] text-muted-foreground">Tìm đối thủ giao hữu</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                </Link>

                <Link to="/wallet" className="block">
                  <Card className="p-4 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Ví Tiền SanGo</p>
                          <p className="text-[10px] text-muted-foreground">Nạp cọc giữ sân</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE EDIT & AVATAR UPLOAD */}
          {activeTab === 'PROFILE' && (
            <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6 animate-in fade-in-50 duration-200">
              <div className="pb-3 border-b border-border/50">
                <h3 className="text-base font-black text-foreground">Chỉnh Sửa Thông Tin Cá Nhân</h3>
                <p className="text-xs text-muted-foreground">Cập nhật ảnh đại diện, họ tên và thông tin liên hệ của bạn.</p>
              </div>

              {updateMsg && (
                <div
                  className={cn(
                    'p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5',
                    updateMsg.isError
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                  )}
                >
                  {updateMsg.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{updateMsg.text}</span>
                </div>
              )}

              {/* Avatar Upload Field */}
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col sm:flex-row items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-xl overflow-hidden border border-primary/30 shrink-0">
                  {avatarUrl || user.avatarUrl ? (
                    <img src={avatarUrl || user.avatarUrl || ''} alt="Avatar Preview" className="h-full w-full object-cover" />
                  ) : (
                    user.fullName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1">
                  <p className="text-xs font-bold text-foreground">Ảnh Đại Diện</p>
                  <p className="text-[11px] text-muted-foreground">Định dạng JPG, PNG tối đa 5MB.</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold gap-1.5 h-8"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Chọn ảnh từ máy</span>
                    </Button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Họ và tên</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Số điện thoại</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0987654321"
                      className="h-10 text-xs font-mono-num"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">Địa chỉ Email (Read-only)</label>
                    <Input value={user.email} disabled className="h-10 text-xs opacity-60 bg-muted/40 font-mono-num" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Thành phố</label>
                    <select
                      value={city}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        setCity(newCity);
                        const dists = DISTRICTS_BY_CITY[newCity as (typeof CITIES)[number]];
                        if (dists && dists.length > 0) setDistrict(dists[0]);
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Quận / Huyện</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                    >
                      {(DISTRICTS_BY_CITY[city as (typeof CITIES)[number]] || DISTRICTS_BY_CITY['Hà Nội']).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Tiểu sử / Giới thiệu</label>
                    <Input
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Môn sở trường, vị trí thi đấu..."
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isUpdating} size="lg" className="font-bold text-xs shadow-md shadow-emerald-500/20">
                  {isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 3: BOOKINGS SUMMARY */}
          {activeTab === 'BOOKINGS' && (
            <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <h3 className="text-base font-black text-foreground">Vé Đặt Sân Của Tôi</h3>
                  <p className="text-xs text-muted-foreground">Theo dõi và quản lý các lượt giữ chỗ & vé vào sân.</p>
                </div>
                <Link to="/bookings">
                  <Button size="sm" className="text-xs font-bold gap-1.5">
                    <span>Xem Tất Cả Vé</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="py-8 text-center space-y-3">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-foreground">Truy cập trung tâm vé đặt sân</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Quản lý mã QR check-in, hủy sân hoàn cọc và theo dõi lịch thi đấu sắp tới.
                </p>
                <Link to="/bookings" className="inline-block pt-2">
                  <Button variant="outline" size="sm" className="text-xs font-bold">
                    Mở Trang Quản Lý Vé
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* TAB 4: WALLET SUMMARY */}
          {activeTab === 'WALLET' && (
            <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <h3 className="text-base font-black text-foreground">Ví Tiền SanGo</h3>
                  <p className="text-xs text-muted-foreground">Quản lý số dư đặt cọc và thanh toán tiền sân.</p>
                </div>
                <Link to="/wallet">
                  <Button size="sm" className="text-xs font-bold gap-1.5">
                    <span>Nạp / Rút Ví</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-primary/5 border border-primary/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Số Dư Khả Dụng</span>
                <p className="font-mono-num font-black text-2xl sm:text-3xl text-primary">{formatVND(1500000)}</p>
                <p className="text-[11px] text-muted-foreground">Dùng để đặt cọc 30% nhanh chóng không cần qua cổng ngân hàng.</p>
              </div>
            </Card>
          )}

          {/* TAB 5: SECURITY & CHANGE PASSWORD */}
          {activeTab === 'SECURITY' && (
            <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
              <div className="pb-3 border-b border-border/50">
                <h3 className="text-base font-black text-foreground">Bảo Mật & Đổi Mật Khẩu</h3>
                <p className="text-xs text-muted-foreground">Thiết lập mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>
              </div>

              {passMsg && (
                <div
                  className={cn(
                    'p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5',
                    passMsg.isError
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                  )}
                >
                  {passMsg.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Mật khẩu hiện tại</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="h-10 text-xs font-mono-num"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-10 text-xs font-mono-num"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Xác nhận mật khẩu mới</label>
                  <Input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="h-10 text-xs font-mono-num"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPass || !currentPassword || !newPassword}
                  size="lg"
                  className="font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  {isChangingPass ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 6: NOTIFICATIONS PREFERENCES */}
          {activeTab === 'NOTIFICATIONS' && (
            <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
              <div className="pb-3 border-b border-border/50">
                <h3 className="text-base font-black text-foreground">Cài Đặt Thông Báo</h3>
                <p className="text-xs text-muted-foreground">Tùy chỉnh thông báo nhắc giờ thi đấu và lời mời ghép trận.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Nhắc nhở trước trận 60 phút</p>
                    <p className="text-[11px] text-muted-foreground">Gửi thông báo nhắc giờ xuất phát đến sân thi đấu.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyMatchReminder(!notifyMatchReminder)}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                      notifyMatchReminder ? 'bg-primary' : 'bg-muted/80',
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5',
                        notifyMatchReminder ? 'left-5' : 'left-0.5',
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Lời mời tham gia ghép trận</p>
                    <p className="text-[11px] text-muted-foreground">Nhận thông báo khi có đội bóng tìm đối gần khu vực của bạn.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyMatchInvites(!notifyMatchInvites)}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                      notifyMatchInvites ? 'bg-primary' : 'bg-muted/80',
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5',
                        notifyMatchInvites ? 'left-5' : 'left-0.5',
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Ưu đãi giờ vàng & Voucher</p>
                    <p className="text-[11px] text-muted-foreground">Nhận mã giảm giá từ các cụm sân bạn thường xuyên chơi.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyVouchers(!notifyVouchers)}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                      notifyVouchers ? 'bg-primary' : 'bg-muted/80',
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5',
                        notifyVouchers ? 'left-5' : 'left-0.5',
                      )}
                    />
                  </button>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
