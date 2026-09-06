import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { forgotPasswordApi } from '../api/auth-api';
import { AuthBrandHeader } from '../components/auth-brand-header';

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
      setErrorMessage(err.message || 'Không thể gửi yêu cầu khôi phục. thử lại.');
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
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-foreground">Quên Mật Khẩu</CardTitle>
          <p className="text-xs text-muted-foreground">Nhập email nhận link đổi mật khẩu.</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {isSent ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-foreground">Đã gửi hướng dẫn khôi phục!</p>
              <p className="text-[11px] text-muted-foreground">
                kiểm tra hộp thư đến tại <strong>{email}</strong> và làm theo hướng dẫn.
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
                  className="w-full font-bold text-xs h-10 shadow-lg"
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
