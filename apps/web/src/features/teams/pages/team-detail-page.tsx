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
  type Team,
  type ExpenseShare,
  type TreasuryOverview,
} from '../api/teams-api';
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
  const [splitBookingCode, setSplitBookingCode] = React.useState('SG-20260828-001');
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
  const [splitMsg, setSplitMsg] = React.useState<string | null>(null);

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
    if (!id || selectedMemberIds.length === 0) return;
    try {
      await splitBookingApi(id, {
        bookingId: 'b-mock-1',
        memberIds: selectedMemberIds,
        note: `Chia tiền đơn ${splitBookingCode}`,
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
      <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center space-y-3">
        <div className="h-8 w-48 bg-muted rounded mx-auto animate-pulse" />
        <p className="text-xs text-muted-foreground">Đang nạp dữ liệu phòng đội...</p>
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
