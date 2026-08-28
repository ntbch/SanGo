import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Swords, Wallet, QrCode, CheckCircle2 } from 'lucide-react';
import { Tournament } from '../api/tournaments-api';
import { MyTeamMembership } from '../../teams/api/teams-api';
import { formatVND, cn } from '../../../lib/utils';

export interface TournamentRegisterModalProps {
  show: boolean;
  onClose: () => void;
  tournament: Tournament;
  captainTeams: MyTeamMembership[];
  selectedTeamId: string;
  setSelectedTeamId: (id: string) => void;
  captainName: string;
  setCaptainName: (name: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
  paymentMethod: 'WALLET' | 'QR';
  setPaymentMethod: (m: 'WALLET' | 'QR') => void;
  agreeTerms: boolean;
  setAgreeTerms: (agreed: boolean) => void;
  isRegistering: boolean;
  actionMsg: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function TournamentRegisterModal({
  show,
  onClose,
  tournament,
  captainTeams,
  selectedTeamId,
  setSelectedTeamId,
  captainName,
  setCaptainName,
  contactPhone,
  setContactPhone,
  paymentMethod,
  setPaymentMethod,
  agreeTerms,
  setAgreeTerms,
  isRegistering,
  actionMsg,
  onSubmit,
}: TournamentRegisterModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-black text-foreground">
              Đăng Ký Đội Tham Gia Giải Đấu
            </CardTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {actionMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{actionMsg}</span>
            </div>
          )}

          {captainTeams.length === 0 ? (
            <div className="p-6 text-center space-y-3 bg-secondary/30 rounded-2xl border border-border">
              <p className="text-xs text-muted-foreground">
                Bạn chưa làm Đội Trưởng của câu lạc bộ nào để đăng ký giải đấu.
              </p>
              <Button size="sm" onClick={() => (window.location.href = '/teams')} className="text-xs font-bold">
                Tạo Đội Bóng Ngay
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Select Team */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Chọn Câu Lạc Bộ Của Bạn <span className="text-destructive">*</span>
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                >
                  {captainTeams.map((m) => (
                    <option key={m.team.id} value={m.team.id}>
                      {m.team.name} ({m.team.sportType}) - {m.team.memberCount ?? 0} thành viên
                    </option>
                  ))}
                </select>
              </div>

              {/* Captain Name & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Tên Đại Diện <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Số Điện Thoại <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="h-10 text-xs font-mono-num"
                  />
                </div>
              </div>

              {/* Fee & Deposit Info */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lệ phí giải đấu:</span>
                  <span className="font-mono-num font-black text-foreground">
                    {formatVND(tournament.entryFee ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-muted-foreground font-bold">Số tiền cần đặt cọc ngay:</span>
                  <span className="font-mono-num font-black text-primary text-sm">
                    {formatVND(tournament.entryFee ?? 0)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">
                  Phương Thức Đặt Cọc Lệ Phí
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('WALLET')}
                    className={cn(
                      'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer',
                      paymentMethod === 'WALLET'
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border/60 bg-secondary/30 hover:border-border',
                    )}
                  >
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <Wallet className="h-4 w-4 shrink-0" />
                      <span>Ví SanGo Pay</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">Trừ trực tiếp số dư ví</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QR')}
                    className={cn(
                      'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer',
                      paymentMethod === 'QR'
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border/60 bg-secondary/30 hover:border-border',
                    )}
                  >
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <QrCode className="h-4 w-4 shrink-0" />
                      <span>VietQR Chuyển Khoản</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">Quét mã thanh toán</span>
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  Tôi cam kết đội bóng thi đấu đúng lịch trình ban tổ chức sắp xếp, tuân thủ tinh thần thể thao fair-play và quy chế giải đấu.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isRegistering || !agreeTerms || !selectedTeamId}
                  size="sm"
                  className="font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  {isRegistering ? 'Đang xác nhận...' : `Xác Nhận Đặt Cọc ${formatVND(tournament.entryFee ?? 0)}`}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
