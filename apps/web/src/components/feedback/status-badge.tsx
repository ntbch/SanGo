import * as React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  PauseCircle,
  ShieldAlert,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export type SystemStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'PAID'
  | 'UNPAID'
  | 'EXPIRED'
  | 'HELD'
  | 'ACTIVE'
  | 'LOCKED'
  | 'MAINTENANCE';

interface StatusConfig {
  label: string;
  variant: 'default' | 'primary' | 'available' | 'peak' | 'holding' | 'booked' | 'maintenance' | 'destructive' | 'outline';
  icon: React.ReactElement;
}

const STATUS_MAP: Record<SystemStatus, StatusConfig> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    variant: 'available',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CHECKED_IN: {
    label: 'Đã nhận sân',
    variant: 'primary',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  CANCELLED: {
    label: 'Đã hủy',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
  },
  NO_SHOW: {
    label: 'Vắng mặt',
    variant: 'destructive',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  PENDING: {
    label: 'Chờ duyệt',
    variant: 'peak',
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: 'Đã duyệt',
    variant: 'available',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: 'Bị từ chối',
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
  },
  SUSPENDED: {
    label: 'Tạm đình chỉ',
    variant: 'destructive',
    icon: <PauseCircle className="h-3 w-3" />,
  },
  PAID: {
    label: 'Đã thanh toán',
    variant: 'available',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  UNPAID: {
    label: 'Chưa thanh toán',
    variant: 'peak',
    icon: <Clock className="h-3 w-3" />,
  },
  EXPIRED: {
    label: 'Hết hạn',
    variant: 'destructive',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  HELD: {
    label: 'Đang giữ chỗ',
    variant: 'holding',
    icon: <Sparkles className="h-3 w-3" />,
  },
  ACTIVE: {
    label: 'Hoạt động',
    variant: 'available',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  LOCKED: {
    label: 'Đã khóa',
    variant: 'destructive',
    icon: <Lock className="h-3 w-3" />,
  },
  MAINTENANCE: {
    label: 'Bảo trì',
    variant: 'maintenance',
    icon: <Wrench className="h-3 w-3" />,
  },
};

export interface StatusBadgeProps {
  status: SystemStatus | string;
  className?: string;
  customLabel?: string;
}

export function StatusBadge({ status, className, customLabel }: StatusBadgeProps): React.ReactElement {
  const config = STATUS_MAP[status as SystemStatus] || {
    label: customLabel || status,
    variant: 'default' as const,
    icon: <ShieldAlert className="h-3 w-3" />,
  };

  return (
    <Badge variant={config.variant} className={cn('gap-1 py-0.5 text-[11px]', className)}>
      {config.icon}
      <span>{customLabel || config.label}</span>
    </Badge>
  );
}
