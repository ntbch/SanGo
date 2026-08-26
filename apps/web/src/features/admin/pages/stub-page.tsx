import { Construction } from 'lucide-react';
import type { ReactElement } from 'react';

import { Card, CardContent } from '../../../components/ui/card';

/**
 * Placeholder dùng chung cho các trang quản trị chưa triển khai (t5).
 * Chỉ hiển thị — không chứa hành động nào.
 */
export function StubPage(options: { title: string; description?: string }): ReactElement {
  const { title, description } = options;
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <Card className="border-dashed" data-testid="admin-stub-placeholder">
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <Construction className="size-10 text-muted-foreground/50" aria-hidden />
          <p className="text-lg font-bold">Đang triển khai</p>
          <p className="text-sm text-muted-foreground">
            Tính năng này sẽ ra mắt trong giai đoạn tiếp theo của SanGo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
