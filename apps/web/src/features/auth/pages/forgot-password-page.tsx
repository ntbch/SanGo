import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { forgotPasswordApi } from '../api/auth-api';

export function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await forgotPasswordApi(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
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
          <CardTitle className="text-xl font-bold tracking-tight">Quên mật khẩu</CardTitle>
          <p className="text-xs text-muted-foreground">
            {submitted
              ? 'Đã gửi hướng dẫn khôi phục mật khẩu.'
              : 'Nhập email để nhận liên kết khôi phục.'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong className="text-foreground">{email}</strong>. Vui lòng kiểm tra hộp thư.
              </p>
              <Link to="/login" className="block pt-2">
                <Button variant="outline" className="w-full text-xs font-semibold gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Quay lại đăng nhập</span>
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email đăng ký</label>
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

              <Button type="submit" loading={loading} className="w-full font-bold shadow-xs mt-2">
                Gửi mã khôi phục
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Quay lại đăng nhập</span>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
