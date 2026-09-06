import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { EmptyState } from '../../../components/feedback';
import {
  Receipt,
  RotateCcw,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatVND, cn } from '../../../lib/utils';
import { WalletLedgerItem, WalletEntryType } from '../api/wallet-api';

export interface WalletLedgerTableProps {
  ledgerItems: WalletLedgerItem[];
  filteredLedger: WalletLedgerItem[];
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: 'ALL' | WalletEntryType;
  setTypeFilter: (t: 'ALL' | WalletEntryType) => void;
  timePreset: 'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | '30DAYS' | 'CUSTOM';
  setTimePreset: (tp: 'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | '30DAYS' | 'CUSTOM') => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  onResetFilters: () => void;
  onPageChange: (p: number) => void;
  onSelectReceipt: (item: WalletLedgerItem) => void;
}

export function WalletLedgerTable({
  ledgerItems,
  filteredLedger,
  isLoading,
  totalItems,
  currentPage,
  totalPages,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  timePreset,
  setTimePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onResetFilters,
  onPageChange,
  onSelectReceipt,
}: WalletLedgerTableProps): React.ReactElement {
  return (
    <Card className="border border-border/80 bg-card overflow-hidden" data-testid="wallet-ledger-primary">
      <CardHeader className="p-6 pb-4 border-b border-border/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <span>Lịch sử giao dịch</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground pt-0.5">
              Hệ thống lưu trữ minh bạch toàn bộ các biến động nạp tiền, cọc sân, hoàn tiền và tiền thưởng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm mã giao dịch / số tiền..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 text-xs w-60 bg-background"
            />
            {(typeFilter !== 'ALL' || timePreset !== 'ALL' || startDate || endDate || searchQuery) && (
              <Button
                size="sm"
                variant="outline"
                onClick={onResetFilters}
                className="h-8.5 text-xs font-bold gap-1 px-2.5 shrink-0 cursor-pointer active:scale-[0.98] transition-colors"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dual Filter Bars: Type + Date Range */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-border/50">
          {/* 1. Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-secondary/60 p-1 rounded-xl">
            {(
              [
                { key: 'ALL', label: 'Tất Cả Loại' },
                { key: 'TOPUP', label: 'Nạp Tiền' },
                { key: 'PAYMENT', label: 'Chi Tiêu' },
                { key: 'REFUND', label: 'Hoàn Tiền' },
                { key: 'CASHBACK', label: 'Thưởng' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTypeFilter(tab.key)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer',
                  typeFilter === tab.key
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 2. Time Range Presets & Date Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Presets */}
            <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {(
                [
                  { key: 'ALL', label: 'Tất Cả Thời Gian' },
                  { key: 'TODAY', label: 'Hôm Nay' },
                  { key: '7DAYS', label: '7 Ngày Qua' },
                  { key: 'THIS_MONTH', label: 'Tháng Này' },
                  { key: '30DAYS', label: '30 Ngày Qua' },
                ] as const
              ).map((tp) => (
                <button
                  key={tp.key}
                  type="button"
                  onClick={() => {
                    setTimePreset(tp.key);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={cn(
                    'px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-[0.98] cursor-pointer',
                    timePreset === tp.key && !startDate && !endDate
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tp.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-xl border border-border/50">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground px-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold">Từ:</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setTimePreset('CUSTOM');
                }}
                className="h-7 px-2 rounded-lg bg-background border border-input text-[11px] font-mono-num text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
              />

              <span className="text-[11px] text-muted-foreground font-bold px-0.5">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setTimePreset('CUSTOM');
                }}
                className="h-7 px-2 rounded-lg bg-background border border-input text-[11px] font-mono-num text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Search result count strip */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span>
            Đang hiển thị <strong className="text-foreground">{filteredLedger.length}</strong> / {ledgerItems.length} giao dịch
          </span>
          {(startDate || endDate || timePreset !== 'ALL') && (
            <span className="text-primary font-semibold">
              Bộ lọc thời gian: {startDate ? `từ ${startDate}` : ''} {endDate ? `đến ${endDate}` : ''} {timePreset !== 'CUSTOM' ? `(${timePreset})` : ''}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Đang tải danh sách giao dịch...
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="p-6 sm:p-8">
            <EmptyState
              title="Không có giao dịch nào"
              description="Không tìm thấy biến động số dư nào trong khoảng thời gian đã chọn."
              actionLabel="Đặt lại bộ lọc"
              onAction={onResetFilters}
            />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredLedger.map((item) => {
              const isCredit = item.direction === 'CREDIT';
              const formattedDate = new Date(item.createdAt).toLocaleString('vi-VN');

              let title = 'Biến Động Số Dư';
              let icon = <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
              let badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

              if (item.type === 'TOPUP') {
                title = 'Nạp Tiền Vào Ví SanGo';
                icon = <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
                badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
              } else if (item.type === 'PAYMENT') {
                title = item.refType.includes('WITHDRAW') ? 'Rút Tiền Về Ngân Hàng' : 'Thanh Toán Đặt Sân / Cọc Giải';
                icon = <ArrowUpRight className="h-4 w-4 text-rose-500" />;
                badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
              } else if (item.type === 'REFUND') {
                title = 'Hoàn Tiền Giữ Chỗ / Hủy Kèo';
                icon = <RotateCcw className="h-4 w-4 text-cyan-500" />;
                badgeClass = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
              } else if (item.type === 'CASHBACK') {
                title = 'Thưởng Điểm Uy Tín & Fair-Play';
                icon = <Award className="h-4 w-4 text-amber-500" />;
                badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectReceipt(item)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-secondary/30 active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Left Icon & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-center shrink-0 shadow-xs">
                      {icon}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {title}
                        </h4>
                        <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border', badgeClass)}>
                          {item.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono-num">
                        <span>Mã: <strong className="text-foreground">{item.refId}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Amount & Balance After */}
                  <div className="text-right shrink-0 space-y-0.5">
                    <div
                      className={cn(
                        'text-sm sm:text-base font-mono-num font-bold tabular-nums',
                        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
                      )}
                    >
                      {isCredit ? '+' : '-'}{formatVND(item.amount)}
                    </div>
                    <span className="text-[11px] font-mono-num tabular-nums text-muted-foreground block">
                      Số dư sau GD: <strong className="text-foreground">{formatVND(item.balanceAfter)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Hiển thị trang {currentPage} / {totalPages} ({totalItems} giao dịch)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="h-8 px-2.5 active:scale-[0.98] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="h-8 px-2.5 active:scale-[0.98] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
