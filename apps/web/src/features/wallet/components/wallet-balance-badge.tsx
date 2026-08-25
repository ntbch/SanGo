import { Wallet } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { formatVnd } from '../../public/format';
import { useMyWallet } from '../queries';

/** Badge số dư nhỏ ở topbar dashboard — bấm sang trang Ví (F6). */
export function WalletBalanceBadge(): ReactElement {
  const { data, isLoading } = useMyWallet(1, 1);

  return (
    <Link
      to="/dashboard/wallet"
      title="Xem ví của bạn"
      className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent sm:flex"
    >
      <Wallet className="size-3.5 text-primary" aria-hidden />
      <span className="font-score">{isLoading ? '—' : formatVnd(data?.balance ?? 0)}</span>
    </Link>
  );
}
