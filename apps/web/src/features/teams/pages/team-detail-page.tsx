/** Trang chi tiết đội (F1): thông tin đội, thành viên, mời qua link, sổ quỹ chia tiền. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Link2,
  Loader2,
  Mail,
  Trophy,
  UserMinus,
  Users,
} from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';

import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
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
  useCreateExpenseShare,
  useRemoveMember,
  useTeam,
  useTeamExpenses,
  useUpdateExpenseStatus,
} from '../queries';
import { expenseShareFormSchema, type ExpenseShareFormValues } from '../schemas';
import type { ExpenseShareItem, TeamMemberInfo } from '../types';

const SPORT_LABELS: Record<string, string> = {
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
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

  // F1: Mã mời 1 chạm — dùng chính teamId làm mã mời (đơn giản hoá demo-first).
  const [copied, setCopied] = useState(false);

  const team = teamQuery.data;
  const expenses = expensesQuery.data;
  const isCaptain = Boolean(team && team.captainId === currentUserId);

  function copyInviteLink(): void {
    const link = window.location.origin + '/dashboard/teams/join?team=' + teamId;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast({
        title: 'Đã sao chép link mời',
        description: 'Gửi link này cho bạn bè để mời vào đội.',
      });
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1 text-xs text-muted-foreground"
      >
        <Link to="/dashboard/teams">
          <ArrowLeft className="size-3.5" aria-hidden /> Quay lại danh sách đội
        </Link>
      </Button>

      {/* Header đội */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-5 sm:p-6">
          {teamQuery.isPending ? (
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : teamQuery.isError || !team ? (
            <p className="text-sm text-destructive">Không tìm thấy đội thể thao.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-primary/15">
                    <Trophy className="size-7 text-primary" aria-hidden />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight">{team.name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        {SPORT_LABELS[team.sportType] ?? team.sportType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Đội trưởng: <strong>{team.captain.fullName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mời qua link — copy 1 chạm (mọi thành viên đều chia sẻ được) */}
                <Button
                  type="button"
                  size="sm"
                  variant={copied ? 'default' : 'outline'}
                  className="gap-1.5 rounded-lg font-semibold"
                  onClick={copyInviteLink}
                >
                  {copied ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <Copy className="size-3.5" aria-hidden />
                  )}
                  {copied ? 'Đã sao chép' : 'Sao chép link mời'}
                </Button>
              </div>

              {team.description ? (
                <p className="mt-3 text-sm text-muted-foreground">{team.description}</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Danh sách thành viên */}
      <Card className="rounded-xl border-border/60 p-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Thành viên ({team?.members.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {teamQuery.isPending ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <ul role="list" aria-label="Danh sách thành viên">
              {(team?.members ?? []).map((member) => {
                const badge = memberBadge(member);
                const canRemove = badge === null; // member thường mới hiện nút rời đội
                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(member.user.fullName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{member.user.fullName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {member.user.email ?? ''}
                        </p>
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
          )}
        </CardContent>
      </Card>

      {/* S2-F1: Lịch sử đặt sân của đội */}
      <TeamBookingHistory teamId={teamId} loading={teamQuery.isPending} />

      {/* Sổ quỹ chia tiền */}
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
              onError: (err) =>
                toast({
                  variant: 'destructive',
                  title: 'Cập nhật trạng thái thất bại',
                  description: friendlyApiMessage(err),
                }),
            },
          )
        }
        creating={createExpenseMutation.isPending}
        updating={updateStatusMutation.isPending}
      />
    </div>
  );
}

/** Badge trạng thái đơn cho lịch sử đội. */
function bookingStatusBadge(status: string): { label: string; variant: BadgeProps['variant'] } {
  if (status === 'COMPLETED') return { label: 'Hoàn tất', variant: 'success' };
  if (status === 'CANCELLED' || status === 'NO_SHOW')
    return { label: 'Đã huỷ', variant: 'destructive' };
  if (status === 'PENDING_PAYMENT') return { label: 'Chờ thanh toán', variant: 'warning' };
  if (status === 'CHECKED_IN') return { label: 'Đang chơi', variant: 'default' };
  return { label: 'Sắp chơi', variant: 'default' };
}

/**
 * S2-F1: Lịch sử đặt sân của đội — các đơn do chính bạn đặt với tư cách thành viên đội.
 * Dữ liệu lấy từ danh sách đơn của tôi, lọc theo teamId gắn trên đơn.
 */
function TeamBookingHistory({
  teamId,
  loading,
}: {
  teamId: string;
  loading: boolean;
}): ReactElement {
  const upcoming = useMyBookings({ filter: 'upcoming' });
  const past = useMyBookings({ filter: 'history' });

  const rows = useMemo(() => {
    const all = [...(upcoming.data?.items ?? []), ...(past.data?.items ?? [])];
    return all
      .filter((b) => b.teamId != null && b.teamId === teamId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);
  }, [upcoming.data, past.data, teamId]);

  return (
    <Card className="rounded-xl border-border/60 p-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Lịch sử đặt sân của đội</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-11 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
            <Users className="size-4 shrink-0" aria-hidden />
            Chưa có đơn nào. Chọn &quot;Tư cách: Đội...&quot; ở bước chọn giờ để đơn vào đây và mở
            chia tiền quỹ đội.
          </div>
        ) : (
          <ul role="list" aria-label="Lịch sử đặt sân của đội">
            {rows.map((b) => {
              const badge = bookingStatusBadge(b.status);
              return (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {b.venueName} · {b.courtName}
                    </p>
                    <p className="font-score text-[11px] text-muted-foreground">
                      {b.code} — {b.date.slice(8, 10)}/{b.date.slice(5, 7)}/{b.date.slice(0, 4)} ·{' '}
                      {minutesToTime(b.startMinute)}–{minutesToTime(b.endMinute)}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
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
    <Card className="rounded-xl border-border/60 p-0">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-4">
        <CardTitle className="text-base">Sổ quỹ chia tiền</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1 rounded-lg font-semibold"
          onClick={() => setExpenseOpen(true)}
        >
          <Link2 className="size-3.5" aria-hidden /> Ghi nợ thủ công
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        {/* Tổng quan */}
        <div className="grid grid-cols-1 divide-y rounded-b-xl bg-muted/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tổng nợ chưa trả
            </p>
            <p className="font-score mt-0.5 text-lg font-bold">{formatVnd(totalUnpaid)}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tôi đang nợ
            </p>
            <p className="font-score mt-0.5 text-lg font-bold text-destructive">
              {formatVnd(myOwed)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Tôi được nhận
            </p>
            <p className="font-score mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatVnd(myReceivable)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Mail className="mx-auto size-8 text-muted-foreground/30" aria-hidden />
            <p className="mt-2 text-sm text-muted-foreground">
              Chưa có khoản chia tiền nào trong sổ quỹ.
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
                  <TableCell className="font-medium">{share.payer.fullName}</TableCell>
                  <TableCell>{share.debtor.fullName}</TableCell>
                  <TableCell className="font-score font-bold">{formatVnd(share.amount)}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                    {share.booking?.code ? `Đơn ${share.booking.code}` : (share.note ?? '—')}
                  </TableCell>
                  <TableCell className="text-right">
                    {share.status === 'PAID' ? (
                      <Badge variant="success">
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
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Ghi khoản chia tiền</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="debtorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người ghi nợ</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none"
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
                    <FormLabel>Số tiền (đồng)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1000} step={1000} {...field} />
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
                    <FormLabel>Ghi chú (tuỳ chọn)</FormLabel>
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
                className="w-full rounded-lg font-bold"
              >
                {props.creating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Crown className="size-4" aria-hidden />
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
