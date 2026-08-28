import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { QrCode } from 'lucide-react';
import { User } from '../../../lib/auth-store';

export interface WalletQrModalProps {
  user: User | null;
  show: boolean;
  onClose: () => void;
}

export function WalletQrModal({
  user,
  show,
  onClose,
}: WalletQrModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 text-center">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between bg-card z-10">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-black text-foreground">Mã QR Pay Cá Nhân</CardTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="h-44 w-44 mx-auto bg-white p-3 rounded-2xl border border-border shadow-md flex items-center justify-center">
            <QrCode className="h-40 w-40 text-slate-900" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-foreground">{user?.fullName || 'Người Chơi SanGo'}</h4>
            <p className="text-[11px] text-muted-foreground">
              Đưa mã này cho quầy lễ tân cụm sân để thanh toán tiền giờ hoặc dịch vụ đi kèm.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="w-full text-xs font-bold"
          >
            Đã Xong
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
