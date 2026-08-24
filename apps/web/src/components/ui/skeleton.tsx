import { type HTMLAttributes, type ReactElement } from 'react';

import { cn } from '../../lib/utils';

/** Khối xám nhấp nháy đại diện nội dung đang tải. */
function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export { Skeleton };