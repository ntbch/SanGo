import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ProfileSecurityTabProps {
  currentPassword: string;
  onCurrentPasswordChange: (pass: string) => void;
  newPassword: string;
  onNewPasswordChange: (pass: string) => void;
  confirmNewPassword: string;
  onConfirmNewPasswordChange: (pass: string) => void;
  isChangingPass: boolean;
  passMsg: { text: string; isError?: boolean } | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ProfileSecurityTab({
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmNewPassword,
  onConfirmNewPasswordChange,
  isChangingPass,
  passMsg,
  onSubmit,
}: ProfileSecurityTabProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
      <div className="pb-3 border-b border-border/50">
        <h3 className="text-base font-black text-foreground">Bảo Mật &amp; Đổi Mật Khẩu</h3>
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

      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">Mật khẩu hiện tại</label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
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
            onChange={(e) => onNewPasswordChange(e.target.value)}
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
            onChange={(e) => onConfirmNewPasswordChange(e.target.value)}
            required
            className="h-10 text-xs font-mono-num"
          />
        </div>

        <Button
          type="submit"
          disabled={isChangingPass || !currentPassword || !newPassword}
          size="lg"
          className="font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          {isChangingPass ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
        </Button>
      </form>
    </Card>
  );
}
