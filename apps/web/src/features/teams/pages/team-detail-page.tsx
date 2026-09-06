import React from 'react';
import { useParams } from 'react-router-dom';
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

export type TeamTab = 'MEMBERS' | 'SPLIT' | 'TREASURY';

export function TeamDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [team, setTeam] = React.useState<Team | null>(null);
  const [expenses, setExpenses] = React.useState<ExpenseShare[]>([]);
  const [treasury, setTreasury] = React.useState<TreasuryOverview | null>(null);
  const [activeTab, setActiveTab] = React.useState<TeamTab>('MEMBERS');
  const [isLoading, setIsLoading] = React.useState(true);

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
  const [fundMsg, setFundMsg] = React.useState<string | null>(null);

  const fetchTeamData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [teamData, expData, trData] = await Promise.all([
        getTeamApi(id),
        getTeamExpensesApi(id),
        getTreasuryOverviewApi(id),
      ]);
      setTeam(teamData);
      setExpenses(expData);
      setTreasury(trData);
      if (teamData.members) {
        setSelectedMemberIds(teamData.members.map((m) => m.userId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTeamData();
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
      await addMemberApi(id, { emailOrPhone: inviteEmail, role: 'MEMBER' });
      setInviteMsg('Đã gửi lời mời tham gia đội!');
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteMsg(null);
        fetchTeamData();
      }, 1200);
    } catch {
      setInviteMsg('Không thể thêm thành viên');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id || !window.confirm('Bạn có chắc muốn xoá thành viên này?')) return;
    await removeMemberApi(id, memberId);
    fetchTeamData();
  };

  const handleSplitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBookingId = splitBookingCode.trim();
    if (!id || !cleanBookingId || selectedMemberIds.length === 0) return;
    try {
      await splitBookingApi(id, {
        bookingId: cleanBookingId,
        memberIds: selectedMemberIds,
        note: `Chia tiền đơn ${cleanBookingId}`,
      });
      setSplitMsg(`Đã tạo khoản chia tiền thành công cho ${selectedMemberIds.length} người!`);
      setTimeout(() => {
        setSplitMsg(null);
        fetchTeamData();
      }, 1500);
    } catch {
      setSplitMsg('Chia tiền thất bại');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const num = parseInt(fundAmount, 10);
    if (!num || num <= 0) return;
    try {
      await contributeTreasuryApi(id, { amount: num, note: 'Đóng quỹ tháng' });
      setFundMsg(`Đã đóng quỹ ${formatVND(num)} thành công!`);
      setTimeout(() => {
        setFundMsg(null);
        fetchTeamData();
      }, 1500);
    } catch {
      setFundMsg('Đóng quỹ thất bại');
    }
  };

  if (isLoading || !team) {
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

  const isCaptain = team.captainId === user?.id || team.members?.find((m) => m.userId === user?.id)?.role === 'CAPTAIN';

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
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

      {activeTab === 'SPLIT' && (
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

      {activeTab === 'TREASURY' && (
        <TeamTreasuryTab
          treasury={treasury}
          fundAmount={fundAmount}
          onFundAmountChange={setFundAmount}
          fundMsg={fundMsg}
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
