import React from 'react';
import { Card, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { X } from 'lucide-react';

interface TeamInviteModalProps {
  show: boolean;
  onClose: () => void;
  inviteEmail: string;
  onInviteEmailChange: (email: string) => void;
  inviteMsg: string | null;
  onSubmitInvite: (e: React.FormEvent) => Promise<void>;
}

export function TeamInviteModal({
  show,
  onClose,
  inviteEmail,
  onInviteEmailChange,
  inviteMsg,
  onSubmitInvite,
}: TeamInviteModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <h3 className="text-sm font-black text-foreground">Mời Cầu Thủ Vào Đội</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <div className="p-5 space-y-4">
          {inviteMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {inviteMsg}
            </div>
          )}
          <form onSubmit={onSubmitInvite} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">Email Cầu Thủ</label>
              <Input
                type="email"
                placeholder="cauthu@vidu.com"
                value={inviteEmail}
                onChange={(e) => onInviteEmailChange(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold cursor-pointer"
              >
                Hủy
              </Button>
              <Button type="submit" size="sm" className="font-bold text-xs cursor-pointer">
                Gửi Lời Mời
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
