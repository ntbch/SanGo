import React from 'react';
import { Card } from '../../../components/ui/card';

interface ProfileNotificationsTabProps {
  notifyEmail?: boolean;
  notifyInApp?: boolean;
  onChange: (field: 'notifyEmail' | 'notifyInApp', value: boolean) => Promise<void>;
  isSaving: boolean;
  message: { text: string; isError?: boolean } | null;
}

export function ProfileNotificationsTab({ notifyEmail, notifyInApp, onChange, isSaving, message }: ProfileNotificationsTabProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card space-y-5">
      <div className="pb-3 border-b border-border/50">
        <h3 className="text-base font-bold text-foreground">Cài Đặt Thông Báo</h3>
        <p className="text-xs text-muted-foreground">Chọn kênh nhận thông báo. Thay đổi được lưu vào tài khoản.</p>
      </div>
      <div className="space-y-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          Nhận thông báo qua email
          <input type="checkbox" checked={notifyEmail ?? false} disabled={isSaving || notifyEmail === undefined} onChange={(event) => void onChange('notifyEmail', event.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm">
          Nhận thông báo trong ứng dụng
          <input type="checkbox" checked={notifyInApp ?? false} disabled={isSaving || notifyInApp === undefined} onChange={(event) => void onChange('notifyInApp', event.target.checked)} />
        </label>
      </div>
      {(notifyEmail === undefined || notifyInApp === undefined) && <p role="status" className="text-xs text-muted-foreground">Đang tải cài đặt tài khoản...</p>}
      {isSaving && <p role="status" className="text-xs text-muted-foreground">Đang lưu...</p>}
      {message && <p role={message.isError ? 'alert' : 'status'} className={message.isError ? 'text-xs text-destructive' : 'text-xs text-foreground'}>{message.text}</p>}
    </Card>
  );
}
