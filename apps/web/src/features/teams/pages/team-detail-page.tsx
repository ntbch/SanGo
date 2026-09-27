import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getTeamApi,
  addMemberApi,
  removeMemberApi,
  splitBookingApi,
  getTeamExpensesApi,
  getTreasuryOverviewApi,
  contributeTreasuryApi,
  updateExpenseShareStatusApi,
  payExpenseShareApi,
  respondInviteApi,
  type Team,
  type ExpenseShare,
  type TreasuryOverview,
} from '../api/teams-api';
import { getMyWalletApi } from '../../wallet/api/wallet-api';
import { ApiError } from '../../../lib/api-client';
import { useAuthStore } from '../../../lib/auth-store';
import { formatVND } from '../../../lib/utils';
import { TeamHeroHeader } from '../components/team-hero-header';
import { TeamTabs } from '../components/team-tabs';
import { TeamRosterList } from '../components/team-roster-list';
import { TeamSplitTab } from '../components/team-split-tab';
import { TeamTreasuryTab } from '../components/team-treasury-tab';
import { TeamInviteModal } from '../components/team-invite-modal';
import { Button } from '../../../components/ui/button';

export type TeamTab = 'MEMBERS' | 'SPLIT' | 'TREASURY';

export function TeamDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [team, setTeam] = React.useState<Team | null>(null);
  const [expenses, setExpenses] = React.useState<ExpenseShare[]>([]);
  const [treasury, setTreasury] = React.useState<TreasuryOverview | null>(null);
  const [activeTab, setActiveTab] = React.useState<TeamTab>('MEMBERS');
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [responding, setResponding] = React.useState(false);

  // Modals & form states
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteMsg, setInviteMsg] = React.useState<string | null>(null);

  // Split booking form
  const [splitBookingCode, setSplitBookingCode] = React.useState('');
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
  const [splitMsg, setSplitMsg] = React.useState<string | null>(null);

  // Phase 1 (T1.1/T1.3): số dư ví + thông báo hành động trên khoản chia tiền
  const [walletBalance, setWalletBalance] = React.useState<number | null>(null);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);

  // Treasury contribute form
  const [fundAmount, setFundAmount] = React.useState('200000');
  const [fundMsg, setFundMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isContributing, setIsContributing] = React.useState(false);
  const contributionInFlight = React.useRef(false);
  const loadVersion = React.useRef(0);


  const fetchTeamData = React.useCallback(async () => {
    if (!id) return;
    const version = ++loadVersion.current;
    setIsLoading(true);
    setLoadError(null);
    setTeam(null);
    setExpenses([]);
    setTreasury(null);
    try {
      const teamData = await getTeamApi(id);
      if (version !== loadVersion.current) return;
      setTeam(teamData);
      setSelectedMemberIds(teamData.members?.filter((m) => m.status === 'ACTIVE').map((m) => m.userId) ?? []);
      const membership = teamData.members?.find((m) => m.userId === user?.id);
      if (membership?.status === 'ACTIVE') {
        const [expData, trData] = await Promise.all([getTeamExpensesApi(id), getTreasuryOverviewApi(id)]);
        if (version !== loadVersion.current) return;
        setExpenses(expData);
        setTreasury(trData);
      }
    } catch (e) {
      if (version === loadVersion.current) {
        setLoadError(e instanceof ApiError ? e.message : 'Không thể tải dữ liệu đội. Vui lòng thử lại.');
      }
    } finally {
      if (version === loadVersion.current) {
        setIsLoading(false);
      }
    }
  }, [id, user?.id]);

  React.useEffect(() => {
    fetchTeamData();
    return () => { ++loadVersion.current; };
  }, [fetchTeamData]);

  /** Nạp lại đúng list khoản chia tiền (không bật skeleton cả trang) — dùng sau optimistic update. */
  const refetchExpenses = React.useCallback(async () => {
    if (!id) return;
    try {
      setExpenses(await getTeamExpensesApi(id));
    } catch {
      // giữ nguyên state hiện tại nếu refetch lỗi
    }
  }, [id]);

  const fetchWalletBalance = React.useCallback(async () => {
    try {
      const w = await getMyWalletApi({ page: 1, pageSize: 1 });
      setWalletBalance(w.balance);
    } catch {
      // không chặn trang đội vì lỗi ví — FE hiển thị '—'
    }
  }, []);

  React.useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  /** Phase 1 (T1.1): payer/captain xác nhận đã nhận tiền — optimistic + refetch, lỗi rollback. */ 
  const handleMarkPaid = async (shareId: string) => {
    if (!id) return;
    const prev = expenses;
    setExpenses((es) =>
      es.map((x) => (x.id === shareId ? { ...x, status: 'PAID' as const } : x)),
    );
    try {
      await updateExpenseShareStatusApi(id, shareId, 'PAID');
      setActionMsg('Đã xác nhận khoản chia tiền ĐÃ TRẢ');
      await refetchExpenses();
    } catch (e) {
      setExpenses(prev); // rollback optimistic
      await refetchExpenses();
      const code = e instanceof ApiError ? e.code : '';
      setActionMsg(
        code === 'EXPENSE_FORBIDDEN'
          ? 'Chỉ người ứng tiền hoặc đội trưởng mới được xác nhận'
          : 'Xác nhận thất bại, vui lòng thử lại',
      );
    }
  };

  /** Phase 1 (T1.3): debtor trả nợ qua ví — BE atomic; lỗi 409 thiếu tiền báo ngay. */
  const handlePayViaWallet = async (shareId: string) => {
    if (!id) return;
    try {
      await payExpenseShareApi(id, shareId);
      setActionMsg('Đã trả khoản nợ qua ví thành công');
      await Promise.all([refetchExpenses(), fetchWalletBalance()]);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      if (code === 'WALLET_INSUFFICIENT_FUNDS') {
        setActionMsg('Số dư ví không đủ. Hãy nạp thêm tiền vào ví');
      } else if (code === 'EXPENSE_FORBIDDEN') {
        setActionMsg('Chỉ người nợ mới được trả khoản này qua ví');
      } else {
        setActionMsg('Trả qua ví thất bại, vui lòng thử lại');
      }
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail) return;
    try {
      await addMemberApi(id, { email: inviteEmail, role: 'MEMBER' });
      setInviteMsg('Đã gửi lời mời tham gia đội!');
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteMsg(null);
        fetchTeamData();
      }, 1200);
    } catch (e) {
      setInviteMsg(e instanceof ApiError ? e.message : 'Không thể thêm thành viên');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !window.confirm('Bạn có chắc muốn xoá thành viên này?')) return;
    try {
      await removeMemberApi(id, userId);
      await fetchTeamData();
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : 'Không thể xoá thành viên. Vui lòng thử lại.');
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    if (!id || responding) return;
    setResponding(true);
    setActionMsg(null);
    try {
      await respondInviteApi(id, accept);
      if (accept) await fetchTeamData();
      else navigate('/teams', { replace: true });
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : 'Không thể trả lời lời mời. Vui lòng thử lại.');
    } finally {
      setResponding(false);
    }
  };

  const handleSplitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const bookingCode = splitBookingCode.trim();
    if (!id || !bookingCode || selectedMemberIds.length === 0) return;
    try {
      await splitBookingApi(id, {
        bookingCode,
        memberIds: selectedMemberIds,
        note: `Chia tiền đơn ${bookingCode}`,
      });
      setSplitMsg(`Đã tạo khoản chia tiền thành công cho ${selectedMemberIds.length} người!`);
      setTimeout(() => {
        setSplitMsg(null);
        fetchTeamData();
      }, 1500);
    } catch (e) {
      setSplitMsg(e instanceof ApiError ? e.message : 'Chia tiền thất bại');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || contributionInFlight.current) return;
    const num = Number(fundAmount);
    if (!Number.isSafeInteger(num) || num <= 0) return;
    contributionInFlight.current = true;
    setIsContributing(true);
    setFundMsg(null);
    try {
      // CHỈ giao dịch tiền nằm trong try. Endpoint không idempotent, nên nếu refresh
      // hỏng mà bị báo như "đóng quỹ thất bại" thì người dùng bấm lại -> bị trừ 2 lần.
      const res = await contributeTreasuryApi(id, { amount: num, note: 'Đóng quỹ tháng' });
      setFundMsg({ type: 'success', text: `Đã đóng quỹ ${formatVND(num)} thành công!` });
      if (typeof res?.newBalance === 'number') setWalletBalance(res.newBalance);
    } catch (e) {
      setFundMsg({ type: 'error', text: e instanceof ApiError ? e.message : 'Không thể xác nhận đóng quỹ. Kiểm tra sổ quỹ trước khi thử lại.' });
      return;
    } finally {
      contributionInFlight.current = false;
      setIsContributing(false);
    }
    // Refresh nền: lỗi ở đây KHÔNG được phủ lên thông báo đóng quỹ thành công.
    try {
      setTreasury(await getTreasuryOverviewApi(id));
    } catch {
      // Giữ số liệu cũ, không báo sai là giao dịch thất bại.
    }
    void fetchWalletBalance();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-6">
        <div className="h-32 rounded-2xl bg-card border border-border p-6 flex flex-col justify-center space-y-3">
          <div className="h-6 w-56 bg-muted/60 rounded-md" />
          <div className="h-4 w-80 bg-muted/40 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-card border border-border p-6 space-y-4">
            <div className="h-5 w-32 bg-muted/60 rounded-md" />
            <div className="h-10 w-full bg-muted/40 rounded-md" />
            <div className="h-10 w-full bg-muted/40 rounded-md" />
          </div>
          <div className="md:col-span-2 h-64 rounded-2xl bg-card border border-border p-6 space-y-4">
            <div className="h-5 w-40 bg-muted/60 rounded-md" />
            <div className="h-8 w-full bg-muted/40 rounded-md" />
            <div className="h-8 w-full bg-muted/40 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return <div className="p-6 space-y-4"><p role="alert">{loadError || 'Không tìm thấy đội.'}</p><Button onClick={fetchTeamData}>Thử lại</Button><Link to="/teams">Về danh sách đội</Link></div>;
  }
  const membership = team.members?.find((m) => m.userId === user?.id);
  if (membership?.status === 'PENDING') {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-bold">Lời mời tham gia {team.name}</h1>
        <p>Bạn cần chấp nhận lời mời trước khi xem quỹ và chia tiền của đội.</p>
        {actionMsg && <p role="alert">{actionMsg}</p>}
        <div className="flex gap-4">
          <Button disabled={responding} onClick={() => handleRespondInvite(true)}>Chấp nhận</Button>
          <Button variant="outline" disabled={responding} onClick={() => handleRespondInvite(false)}>Từ chối</Button>
        </div>
      </div>
    );
  }
  const isCaptain = team.captainId === user?.id;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      {loadError && <div role="alert" className="space-y-2"><p>{loadError}</p><Button variant="outline" onClick={fetchTeamData}>Thử lại</Button></div>}
      {activeTab === 'MEMBERS' && actionMsg && <p role="status">{actionMsg}</p>}
      <TeamHeroHeader
        team={team}
        isCaptain={Boolean(isCaptain)}
        expenses={expenses}
        treasury={treasury}
        onOpenInviteModal={() => setShowInviteModal(true)}
      />

      <TeamTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        memberCount={team.members?.length || 0}
      />

      {activeTab === 'MEMBERS' && (
        <TeamRosterList
          team={team}
          isCaptain={Boolean(isCaptain)}
          onOpenInviteModal={() => setShowInviteModal(true)}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {activeTab === 'SPLIT' && !loadError && (
        <TeamSplitTab
          team={team}
          expenses={expenses}
          splitBookingCode={splitBookingCode}
          onSplitBookingCodeChange={setSplitBookingCode}
          selectedMemberIds={selectedMemberIds}
          onSelectedMemberIdsChange={setSelectedMemberIds}
          splitMsg={splitMsg}
          onSubmitSplit={handleSplitBooking}
          currentUserId={user?.id ?? null}
          walletBalance={walletBalance}
          actionMsg={actionMsg}
          onMarkPaid={handleMarkPaid}
          onPayViaWallet={handlePayViaWallet}
        />
      )}

      {activeTab === 'TREASURY' && !loadError && (
        <TeamTreasuryTab
          treasury={treasury}
          fundAmount={fundAmount}
          onFundAmountChange={setFundAmount}
          fundMsg={fundMsg}
          isContributing={isContributing}
          onSubmitContribute={handleContribute}
        />
      )}

      <TeamInviteModal
        show={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteEmail={inviteEmail}
        onInviteEmailChange={setInviteEmail}
        inviteMsg={inviteMsg}
        onSubmitInvite={handleInviteMember}
      />
    </div>
  );
}
