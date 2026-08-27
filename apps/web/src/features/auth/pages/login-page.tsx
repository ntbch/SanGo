import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { loginApi } from '../api/auth-api';
import { useAuthStore } from '../../../lib/auth-store';

export function LoginPage(): React.ReactElement {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginApi({ email, password });
      setSession(res.user, res.accessToken, res.refreshToken);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-border/80 shadow-md">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LogIn className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Đăng nhập</CardTitle>
          <p className="text-xs text-muted-foreground">Nhập thông tin tài khoản SanGo của bạn.</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Mật khẩu</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock className="h-4 w-4" />}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full font-bold shadow-xs mt-2">
              Đăng nhập
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border/60">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
