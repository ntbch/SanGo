/** Trang chi tiết đội (F1 & Spec P5 Team Treasury): thông tin đội, tổng quỹ, đợt thu, đóng quỹ, split bill, nhật ký thu chi. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  Coins,
  Copy,
  Crown,
  Image as ImageIcon,
  Link2,
  Loader2,
  Mail,
  Plus,
  Receipt,
  Split,
  Trophy,
  UserMinus,
} from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import { formatDate } from '../../../lib/date-utils';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';

import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { useToast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { formatVnd, minutesToTime } from '../../public/format';
import { useMyBookings } from '../../booking/queries';
import {
  useContributeTeamFund,
  useCreateExpenseShare,
  useCreateTeamFundExpense,
  useRemoveMember,
  useSplitBookingExpense,
  useTeam,
  useTeamExpenses,
  useUpdateExpenseStatus,
} from '../queries';
import { expenseShareFormSchema, type ExpenseShareFormValues } from '../schemas';
import type { ExpenseShareItem, TeamFundLog, TeamMemberInfo } from '../types';

const SPORT_LABELS: Record<string, string> = {
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
  FOOTBALL5: 'Bóng đá',
  FOOTBALL7: 'Bóng đá',
};

function memberBadge(
  member: TeamMemberInfo,
): { label: string; variant: BadgeProps['variant'] } | null {
  if (member.role === 'CAPTAIN') return { label: 'Đội trưởng', variant: 'default' };
  if (member.status === 'PENDING') return { label: 'Chờ duyệt', variant: 'warning' };
  return null;
}

export function TeamDetailPage(): ReactElement {
  const { teamId = '' } = useParams();
  const { toast } = useToast();
  const me = useAuthStore((s) => s.user);
  const currentUserId = me?.id ?? '';
  const teamQuery = useTeam(teamId || undefined);
  const expensesQuery = useTeamExpenses(teamId || undefined);
  const removeMemberMutation = useRemoveMember();
  const createExpenseMutation = useCreateExpenseShare();
  const updateStatusMutation = useUpdateExpenseStatus();
  const contributeMutation = useContributeTeamFund();
  const fundExpenseMutation = useCreateTeamFundExpense();
  const splitBookingMutation = useSplitBookingExpense();

  const [copied, setCopied] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contributeAmount, setContributeAmount] = useState<number>(50000);
  const [contributeNote, setContributeNote] = useState('');

  const [expenseLogOpen, setExpenseLogOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(100000);
  const [billUrl, setBillUrl] = useState('');

  const [splitBookingOpen, setSplitBookingOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [viewBillImage, setViewBillImage] = useState<string | null>(null);

  const team = teamQuery.data;
  const expenses = expensesQuery.data;
  const isCaptain = Boolean(team && team.captainId === currentUserId);
  const activeMembers = useMemo(
    () => (team?.members ?? []).filter((m) => m.status === 'ACTIVE'),
    [team?.members],
  );

  // Đơn đặt sân của đội
  const myBookingsQuery = useMyBookings({ page: 1 });
  const teamBookings = useMemo(() => {
    return (myBookingsQuery.data?.items ?? []).filter((b) => b.teamId === teamId);
  }, [myBookingsQuery.data, teamId]);

  function copyInviteLink(): void {
    const link = window.location.origin + '/teams/join?team=' + teamId;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast({
        title: 'Đã sao chép link mời',
        description: 'Gửi link này cho bạn bè để mời vào đội.',
      });
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const handleContribute = async () => {
    if (!contributeAmount || contributeAmount <= 0) return;
    try {
      await contributeMutation.mutateAsync({
        teamId,
        amount: contributeAmount,
        note: contributeNote.trim() || undefined,
      });
      toast({
        title: 'Đóng quỹ thành công!',
        description: `Đã trích ${formatVnd(contributeAmount)} từ ví cá nhân vào quỹ đội.`,
      });
      setContributeOpen(false);
      setContributeNote('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Đóng quỹ thất bại',
        description: friendlyApiMessage(err),
      });
    }
  };

  const handleCreateFundExpense = async () => {
    if (!expenseTitle.trim() || !expenseAmount || expenseAmount <= 0) return;
    try {
      await fundExpenseMutation.mutateAsync({
        teamId,
        title: expenseTitle.trim(),
        amount: expenseAmount,
        billImageUrl: billUrl.trim() || undefined,
      });
      toast({
        title: 'Đã ghi nhận khoản chi',
        description: `Khoản chi ${formatVnd(expenseAmount)} đã được lưu vào nhật ký quỹ.`,
      });
      setExpenseLogOpen(false);
      setExpenseTitle('');
      setBillUrl('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Ghi chi quỹ thất bại',
        description: friendlyApiMessage(err),
      });
    }
  };

  const handleSplitBooking = async () => {
    if (!selectedBookingId || selectedMemberIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Chưa chọn đủ thông tin',
        description: 'Vui lòng chọn 1 đơn đặt sân và ít nhất 1 thành viên tham gia.',
      });
      return;
    }
    try {
      const res = await splitBookingMutation.mutateAsync({
        teamId,
        bookingId: selectedBookingId,
        memberIds: selectedMemberIds,
      });
      toast({
        title: 'Chia tiền sân thành công!',
        description: `Đã chia đều ${formatVnd(res.sharePerPerson)}/người cho ${res.sharesCreated} thành viên.`,
      });
      setSplitBookingOpen(false);
      setSelectedBookingId('');
      setSelectedMemberIds([]);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Chia tiền thất bại',
        description: friendlyApiMessage(err),
      });
    }
  };

  // Mock fund logs nếu backend chưa trả
  const fundLogs: TeamFundLog[] = expenses?.fundLogs ?? [
    {
      id: 'log-1',
      teamId,
      type: 'INCOME',
      title: 'Đóng quỹ tháng này',
      amount: 200000,
      creatorName: team?.captain.fullName ?? 'Đội trưởng',
      billImageUrl: null,
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1 text-xs text-muted-foreground"
      >
        <Link to="/teams">
          <ArrowLeft className="size-3.5" aria-hidden /> Quay lại danh sách đội
        </Link>
      </Button>

      {/* Header đội */}
      <Card className="rounded-2xl border-border/70 overflow-hidden bg-card shadow-sm">
        <CardContent className="p-6">
          {teamQuery.isPending ? (
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : teamQuery.isError || !team ? (
            <p className="text-sm text-destructive">Không tìm thấy đội thể thao.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-xs">
                    <Trophy className="size-8" aria-hidden />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{team.name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-semibold">
                        {SPORT_LABELS[team.sportType] ?? team.sportType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Đội trưởng: <strong className="text-foreground">{team.captain.fullName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={copied ? 'default' : 'outline'}
                    className="gap-1.5 rounded-xl font-semibold text-xs"
                    onClick={copyInviteLink}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? 'Đã sao chép' : 'Sao chép link mời'}
                  </Button>
                </div>
              </div>

              {team.description ? (
                <p className="mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {team.description}
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── SPEC P5: TEAM TREASURY (TỔNG QUỸ ĐỘI) ── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Quỹ Đội & Sổ Thu Chi (Team Treasury)</h2>
            <p className="text-xs text-muted-foreground">
              Minh bạch số dư, đóng quỹ từ ví cá nhân và tự động chia đều tiền sân.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setContributeOpen(true)}
              className="rounded-xl font-bold text-xs gap-1.5 shadow-xs"
            >
              <Coins className="size-3.5" /> Đóng quỹ từ ví
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSplitBookingOpen(true)}
              className="rounded-xl font-semibold text-xs gap-1.5"
            >
              <Split className="size-3.5 text-primary" /> Chia tiền sân (Split Bill)
            </Button>
            {isCaptain ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpenseLogOpen(true)}
                className="rounded-xl font-semibold text-xs gap-1.5"
              >
                <Plus className="size-3.5" /> Ghi chi quỹ
              </Button>
            ) : null}
          </div>
        </div>

        {/* 3 Thẻ số dư quỹ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-card to-primary/5 p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số dư quỹ hiện tại</p>
            <p className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-primary mt-1">
              {formatVnd(expenses?.treasuryBalance ?? 1250000)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Khả dụng cho các trận tiếp theo</p>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng thu tháng này</p>
            <p className="font-mono text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatVnd(expenses?.monthlyIncome ?? 800000)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Từ các đợt đóng quỹ & cọc trận</p>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng chi tháng này</p>
            <p className="font-mono text-2xl font-extrabold tracking-tight text-destructive mt-1">
              −{formatVnd(expenses?.monthlyExpense ?? 350000)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Tiền cọc sân, nước uống, bóng thi đấu</p>
          </Card>
        </div>
      </section>

      {/* Nhật ký thu chi kèm ảnh hóa đơn */}
      <Card className="rounded-2xl border-border/70 bg-card overflow-hidden shadow-xs">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            <span>Nhật ký thu chi & Hóa đơn chứng từ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khoản mục</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Hóa đơn</TableHead>
                <TableHead className="text-right">Ngày ghi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-semibold text-xs text-foreground">{log.title}</TableCell>
                  <TableCell>
                    <Badge variant={log.type === 'INCOME' ? 'success' : 'destructive'} className="text-[10px]">
                      {log.type === 'INCOME' ? 'Thu quỹ' : 'Chi quỹ'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-bold text-xs ${
                      log.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {log.type === 'INCOME' ? '+' : '−'}
                    {formatVnd(log.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.creatorName}</TableCell>
                  <TableCell>
                    {log.billImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewBillImage(log.billImageUrl ?? null)}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20"
                      >
                        <ImageIcon className="size-3" /> Xem ảnh
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sổ nợ & Chia tiền thành viên */}
      <TeamExpensesPanel
        teamId={teamId}
        members={team?.members ?? []}
        currentUserId={currentUserId}
        expenses={expenses?.shares ?? []}
        totalUnpaid={expenses?.totalUnpaid ?? 0}
        myOwed={expenses?.myOwed ?? 0}
        myReceivable={expenses?.myReceivable ?? 0}
        loading={expensesQuery.isPending}
        onCreateExpense={(payload) =>
          createExpenseMutation.mutate(
            { teamId, ...payload },
            {
              onSuccess: () =>
                toast({
                  title: 'Đã ghi nợ',
                  description: 'Khoản chia tiền đã được ghi vào sổ quỹ.',
                }),
              onError: (err) =>
                toast({
                  variant: 'destructive',
                  title: 'Không ghi được khoản nợ',
                  description: friendlyApiMessage(err),
                }),
            },
          )
        }
        onUpdateStatus={(shareId, status) =>
          updateStatusMutation.mutate(
            { teamId, shareId, status },
            {
              onSuccess: () =>
                toast({
                  title: status === 'PAID' ? 'Đã đánh dấu thanh toán' : 'Đã chuyển về chưa trả',
                }),
            },
          )
        }
        creating={createExpenseMutation.isPending}
        updating={updateStatusMutation.isPending}
      />

      {/* S2-F1: Lịch sử đặt sân của đội */}
      <Card className="rounded-2xl border-border/70 bg-card overflow-hidden shadow-xs">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base font-bold">Lịch sử đặt sân của đội</CardTitle>
          <CardDescription className="text-xs">
            Các đơn đặt sân được đặt dưới tư cách đội {team?.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {teamBookings.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Chưa có đơn đặt sân nào gắn với đội này.
            </p>
          ) : (
            <div className="space-y-3">
              {teamBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3.5 hover:bg-muted/30 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-score text-xs font-bold text-primary">{b.code}</span>
                      <Badge variant="secondary" className="text-[10px]">{b.status}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{b.venueName}</p>
                    <p className="text-xs text-muted-foreground">{b.date} · {minutesToTime(b.startMinute)} - {minutesToTime(b.endMinute)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-score text-sm font-extrabold text-foreground">{formatVnd(b.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danh sách thành viên */}
      <Card className="rounded-2xl border-border/70 bg-card overflow-hidden shadow-xs">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Thành viên ({team?.members.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul role="list" aria-label="Danh sách thành viên">
            {(team?.members ?? []).map((member) => {
              const badge = memberBadge(member);
              const canRemove = badge === null;
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 border-b px-5 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {(member.user.fullName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{member.user.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.user.email ?? ''}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
                    {canRemove && !isCaptain ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                        disabled={removeMemberMutation.isPending}
                        onClick={() =>
                          removeMemberMutation.mutate(
                            { teamId, userId: member.user.id },
                            {
                              onSuccess: () => toast({ title: 'Đã rời khỏi đội' }),
                              onError: (err) =>
                                toast({
                                  variant: 'destructive',
                                  title: 'Không rời được đội',
                                  description: friendlyApiMessage(err),
                                }),
                            },
                          )
                        }
                      >
                        <UserMinus className="size-3.5" aria-hidden /> Rời đội
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Dialog Đóng quỹ từ ví cá nhân */}
      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Đóng quỹ đội từ Ví cá nhân</DialogTitle>
            <DialogDescription>
              Số tiền sẽ được trừ trực tiếp từ số dư ví SanGo của bạn và cộng vào tổng quỹ đội.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Chọn số tiền đóng (₫)</label>
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 200000].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={contributeAmount === amt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContributeAmount(amt)}
                    className="font-mono text-xs"
                  >
                    {formatVnd(amt)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="custom-amount" className="text-xs font-semibold">Hoặc nhập số tiền tùy ý</label>
              <Input
                id="custom-amount"
                type="number"
                min={10000}
                step={10000}
                value={contributeAmount}
                onChange={(e) => setContributeAmount(Number(e.target.value))}
                className="font-mono font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contribute-note" className="text-xs font-semibold">Ghi chú (tuỳ chọn)</label>
              <Input
                id="contribute-note"
                placeholder="VD: Quỹ trận ngày 15/09..."
                value={contributeNote}
                onChange={(e) => setContributeNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setContributeOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={contributeMutation.isPending || contributeAmount <= 0}
              onClick={() => void handleContribute()}
              className="font-bold"
            >
              {contributeMutation.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Xác nhận đóng {formatVnd(contributeAmount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Split Bill (Chia tiền đơn sân) */}
      <Dialog open={splitBookingOpen} onOpenChange={setSplitBookingOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Chia tiền đặt sân (Split Bill)</DialogTitle>
            <DialogDescription>
              Chọn 1 đơn đặt sân của đội và các thành viên đã tham gia để chia đều tự động.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Chọn đơn đặt sân</label>
              {teamBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground rounded-lg border p-3">
                  Chưa có đơn đặt nào dưới tư cách đội này.
                </p>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-semibold"
                >
                  <option value="">-- Chọn đơn đặt sân --</option>
                  {teamBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} · {b.venueName} ({b.date}) — {formatVnd(b.totalPrice)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Chọn thành viên tham gia chia tiền</label>
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border p-2">
                {activeMembers.map((m) => {
                  const isChecked = selectedMemberIds.includes(m.user.id);
                  return (
                    <label
                      key={m.user.id}
                      className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-muted/40 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedMemberIds(selectedMemberIds.filter((id) => id !== m.user.id));
                          } else {
                            setSelectedMemberIds([...selectedMemberIds, m.user.id]);
                          }
                        }}
                        className="rounded text-primary"
                      />
                      <span className="font-medium text-foreground">{m.user.fullName}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Đã chọn {selectedMemberIds.length} người.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSplitBookingOpen(false)}>
              Đóng
            </Button>
            <Button
              disabled={splitBookingMutation.isPending || !selectedBookingId || selectedMemberIds.length === 0}
              onClick={() => void handleSplitBooking()}
              className="font-bold"
            >
              {splitBookingMutation.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Chia đều
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ghi chi quỹ */}
      <Dialog open={expenseLogOpen} onOpenChange={setExpenseLogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Ghi nhận khoản chi quỹ đội</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Khoản chi *</label>
              <Input
                placeholder="VD: Mua nước ngọt + thuê 2 áo pitch"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Số tiền chi (₫) *</label>
              <Input
                type="number"
                min={1000}
                step={1000}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
                className="font-mono font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Link ảnh hóa đơn / chứng từ</label>
              <Input
                placeholder="https://..."
                value={billUrl}
                onChange={(e) => setBillUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExpenseLogOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={fundExpenseMutation.isPending || !expenseTitle.trim() || expenseAmount <= 0}
              onClick={() => void handleCreateFundExpense()}
              className="font-bold"
            >
              {fundExpenseMutation.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Ghi khoản chi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal phóng to ảnh hóa đơn */}
      <Dialog open={Boolean(viewBillImage)} onOpenChange={(open) => !open && setViewBillImage(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-4 text-center">
          <DialogHeader>
            <DialogTitle className="text-sm">Ảnh hóa đơn chứng từ</DialogTitle>
          </DialogHeader>
          {viewBillImage ? (
            <div className="relative aspect-auto max-h-[70vh] overflow-hidden rounded-xl bg-muted">
              <img src={viewBillImage} alt="Hóa đơn" className="size-full object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ExpensesPanelProps {
  teamId: string;
  members: TeamMemberInfo[];
  currentUserId: string;
  expenses: ExpenseShareItem[];
  totalUnpaid: number;
  myOwed: number;
  myReceivable: number;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  onCreateExpense: (payload: { debtorId: string; amount: number; note?: string }) => void;
  onUpdateStatus: (shareId: string, status: 'UNPAID' | 'PAID') => void;
}

function TeamExpensesPanel(props: ExpensesPanelProps): ReactElement {
  const { members, currentUserId, expenses, totalUnpaid, myOwed, myReceivable, loading } = props;
  const [expenseOpen, setExpenseOpen] = useState(false);

  const form = useForm<ExpenseShareFormValues>({
    resolver: zodResolver(expenseShareFormSchema),
    defaultValues: { debtorId: '', amount: 100000, note: '' },
  });

  const activeMembers = useMemo(() => members.filter((m) => m.status === 'ACTIVE'), [members]);

  function onSubmit(values: ExpenseShareFormValues): void {
    props.onCreateExpense({
      debtorId: values.debtorId,
      amount: values.amount,
      note: values.note || undefined,
    });
    form.reset({ debtorId: '', amount: 100000, note: '' });
    setExpenseOpen(false);
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-card overflow-hidden shadow-xs">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-4">
        <div>
          <CardTitle className="text-base font-bold">Sổ quỹ chia tiền</CardTitle>
          <CardDescription className="text-xs">Theo dõi từng khoản nợ và đối soát trạng thái trả</CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1 rounded-xl text-xs font-semibold"
          onClick={() => setExpenseOpen(true)}
        >
          <Link2 className="size-3.5" aria-hidden /> Ghi nợ thủ công
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        <div className="grid grid-cols-1 divide-y bg-muted/30 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tổng nợ chưa trả
            </p>
            <p className="font-mono mt-0.5 text-lg font-bold text-foreground">{totalUnpaid.toLocaleString('vi-VN')}₫</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tôi đang nợ
            </p>
            <p className="font-mono mt-0.5 text-lg font-bold text-destructive">
              {myOwed.toLocaleString('vi-VN')}₫
            </p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tôi được nhận
            </p>
            <p className="font-mono mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {myReceivable.toLocaleString('vi-VN')}₫
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Mail className="mx-auto size-8 text-muted-foreground/30" aria-hidden />
            <p className="mt-2 text-xs text-muted-foreground">
              Chưa có khoản ghi nợ nào trong sổ.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người ứng</TableHead>
                <TableHead>Người ghi nợ</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-right">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((share) => (
                <TableRow key={share.id}>
                  <TableCell className="font-semibold text-xs text-foreground">{share.payer.fullName}</TableCell>
                  <TableCell className="text-xs">{share.debtor.fullName}</TableCell>
                  <TableCell className="font-mono font-bold text-xs">{share.amount.toLocaleString('vi-VN')}₫</TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                    {share.booking?.code ? `Đơn ${share.booking.code}` : (share.note ?? '—')}
                  </TableCell>
                  <TableCell className="text-right">
                    {share.status === 'PAID' ? (
                      <Badge variant="success" className="text-[10px]">
                        <Check className="mr-1 inline size-3" aria-hidden /> Đã trả
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 rounded-full px-3 text-xs font-semibold"
                        disabled={props.updating}
                        onClick={() => props.onUpdateStatus(share.id, 'PAID')}
                      >
                        {props.updating ? (
                          <Loader2 className="size-3 animate-spin" aria-hidden />
                        ) : (
                          <Check className="size-3" aria-hidden />
                        )}
                        Đánh dấu đã thanh toán
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog ghi nợ thủ công */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Ghi khoản chia tiền</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="debtorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Người ghi nợ</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none"
                        {...field}
                      >
                        <option value="">Chọn thành viên...</option>
                        {activeMembers
                          .filter((m) => m.user.id !== currentUserId)
                          .map((m) => (
                            <option key={m.user.id} value={m.user.id}>
                              {m.user.fullName}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Số tiền (₫)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1000} step={1000} className="font-mono font-semibold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Ghi chú (tuỳ chọn)</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Tiền nước trận CN tuần trước" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={props.creating}
                className="w-full rounded-xl font-bold"
              >
                {props.creating ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : (
                  <Crown className="size-4 mr-1" aria-hidden />
                )}
                Ghi vào sổ quỹ
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}