import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuthStore } from '../../lib/auth-store';
import { loginApi, registerApi } from '../../features/auth/api/auth-api';
import { UserRole } from '../../lib/constants';
import { ShieldCheck, Lock, Mail, Phone, User, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Đăng Nhập Để Tiếp Tục',
  subtitle = 'Vui lòng đăng nhập hoặc tạo tài khoản để xem lịch, đặt sân và tham gia các tính năng thể thao SanGo.',
}: AuthModalProps): React.ReactElement | null {
  const [tab, setTab] = React.useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loginIdentifier, setLoginIdentifier] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  
  // Register state
  const [fullName, setFullName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [registerPassword, setRegisterPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>(UserRole.CUSTOMER);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { setSession } = useAuthStore();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginApi({ email: loginIdentifier, password: loginPassword });
      setSession(res.user, res.accessToken);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !registerPassword) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await registerApi({
        fullName,
        phone: phoneNumber,
        email: email || `${phoneNumber}@sango.vn`,
        password: registerPassword,
        role,
      });
      setSession(res.user, res.accessToken);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (accRole: UserRole) => {
    if (accRole === UserRole.CUSTOMER) {
      setLoginIdentifier('player1@sango.vn');
      setLoginPassword('123456');
    } else {
      setLoginIdentifier('owner1@sango.vn');
      setLoginPassword('123456');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border border-border bg-card shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <CardHeader className="p-6 pb-4 border-b border-border/60 bg-gradient-to-r from-card to-primary/5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 h-8 w-8 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>SanGo Sports ID</span>
          </div>
          <CardTitle className="text-xl font-black text-foreground tracking-tight pt-1">
            {title}
          </CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            {subtitle}
          </p>

          {/* 2 Tabs */}
          <div className="flex rounded-2xl bg-secondary/60 p-1 mt-4">
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                tab === 'LOGIN'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('REGISTER');
                setErrorMsg(null);
              }}
              className={cn(
                'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                tab === 'REGISTER'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Tạo Tài Khoản
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Số điện thoại hoặc Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="VD: 0912345678 hoặc player1@sango.vn"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    className="h-10 pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-10 pl-9 text-xs"
                  />
                </div>
              </div>

              {/* Quick demo accounts */}
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Tài khoản dùng thử nhanh:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount(UserRole.CUSTOMER)}
                    className="flex-1 py-1 rounded-xl bg-card border border-border/60 hover:border-primary text-[11px] font-bold text-foreground transition-colors cursor-pointer"
                  >
                    Người chơi (Khách hàng)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount(UserRole.OWNER)}
                    className="flex-1 py-1 rounded-xl bg-card border border-border/60 hover:border-primary text-[11px] font-bold text-foreground transition-colors cursor-pointer"
                  >
                    Chủ sân thể thao
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !loginIdentifier || !loginPassword}
                className="w-full h-10 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập & Tiếp Tục'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-9 pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    Số điện thoại <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="0912345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="h-9 pl-8 text-xs font-mono-num"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="a@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 pl-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Mật khẩu <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự..."
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-9 pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">Vai trò</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.CUSTOMER)}
                    className={cn(
                      'p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center',
                      role === UserRole.CUSTOMER
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 bg-secondary/30 text-muted-foreground',
                    )}
                  >
                    Người chơi (Đặt sân)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.OWNER)}
                    className={cn(
                      'p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center',
                      role === UserRole.OWNER
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 bg-secondary/30 text-muted-foreground',
                    )}
                  >
                    Chủ sân thể thao
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !fullName || !phoneNumber || !registerPassword}
                className="w-full h-10 font-bold text-xs shadow-md shadow-emerald-500/20 mt-2"
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký & Đăng Nhập Ngay'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
