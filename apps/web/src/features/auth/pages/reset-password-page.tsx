import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { resetPasswordApi } from '../api/auth-api';

export function ResetPasswordPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Mã khôi phục không hợp lệ hoặc đã hết hạn');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-border/80 shadow-md">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Đặt lại mật khẩu</CardTitle>
          <p className="text-xs text-muted-foreground">Tạo mật khẩu mới cho tài khoản của bạn.</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập bằng mật khẩu mới.
              </p>
              <Link to="/login" className="block pt-2">
                <Button className="w-full font-bold gap-1.5">
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mật khẩu mới</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
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
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Xác nhận mật khẩu</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  prefixIcon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              <Button type="submit" loading={loading} className="w-full font-bold shadow-xs mt-2">
                Cập nhật mật khẩu
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
