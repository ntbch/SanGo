import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { ShieldCheck, Handshake } from 'lucide-react';

export function AboutPage(): React.ReactElement {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Về SanGo</h1>
      </div>
      <Card>
        <CardContent className="p-6 space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            Nền tảng đặt sân thể thao trực tuyến tại Hà Nội và TP. Hồ Chí Minh.
          </p>
          <p>
            Hỗ trợ giữ chỗ 10 phút, chia tiền sân trong đội và check-in bằng mã QR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function PartnerPage(): React.ReactElement {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Handshake className="h-6 w-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dành Cho Chủ Sân</h1>
      </div>
      <Card>
        <CardContent className="p-6 space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <p>
            Liên kết cụm sân với SanGo để tự động hóa quy trình quản lý lịch và tăng doanh thu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
