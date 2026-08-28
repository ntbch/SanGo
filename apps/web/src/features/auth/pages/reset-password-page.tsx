import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resetPasswordApi } from '../api/auth-api';
import { AuthBrandHeader } from '../components/auth-brand-header';

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
