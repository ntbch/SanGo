/**
 * Kiểu dữ liệu F1 Team Profile & Sổ quỹ chia tiền (Sprint 2) —
 * khớp contract backend teams.controller.ts.
 */

export type TeamRole = 'CAPTAIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'PENDING';
export type ExpenseStatus = 'UNPAID' | 'PAID';

/** Thành viên trong đội — kèm thông tin user rút gọn. */
export interface TeamMemberInfo {
  id: string;
  role: TeamRole;
  status: MemberStatus;
  joinedAt: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

/** Đội thể thao — chi tiết đầy đủ. */
export interface Team {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  sportType: string;
  captainId: string;
  captain: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  members: TeamMemberInfo[];
  createdAt?: string;
}

/** Một dòng trong danh sách đội của tôi. */
export interface MyTeamMembership {
  membershipId: string;
  role: TeamRole;
  status: MemberStatus;
  joinedAt: string;
  team: {
    id: string;
    name: string;
    logoUrl?: string | null;
    description?: string | null;
    sportType: string;
    captainId: string;
    captain: { id: string; fullName: string; avatarUrl?: string | null };
    memberCount: number;
    createdAt?: string;
  };
}

/** Khoản chia tiền (ExpenseShare) — track-only, KHÔNG liên quan WalletLedger. */
export interface ExpenseShareItem {
  id: string;
  teamId: string;
  bookingId?: string | null;
  booking?: { id: string; code: string; date: string } | null;
  payerId: string;
  debtorId: string;
  amount: number;
  note?: string | null;
  status: ExpenseStatus;
  createdAt: string;
  payer: { id: string; fullName: string; avatarUrl?: string | null };
  debtor: { id: string; fullName: string; avatarUrl?: string | null };
}

/** Nhật ký thu chi quỹ đội (Spec P5). */
export interface TeamFundLog {
  id: string;
  teamId: string;
  type: 'INCOME' | 'EXPENSE';
  title: string;
  amount: number;
  creatorName: string;
  billImageUrl?: string | null;
  createdAt: string;
}

/** Phản hồi GET /teams/:id/expenses — danh sách + tổng quan nợ của chính tôi + treasury. */
export interface TeamExpensesResponse {
  treasuryBalance?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  totalUnpaid: number;
  myOwed: number;
  myReceivable: number;
  shares: ExpenseShareItem[];
  fundLogs?: TeamFundLog[];
}
