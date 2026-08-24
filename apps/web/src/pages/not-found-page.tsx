import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { APP_NAME } from '@courthub/shared';
import { Button } from '../components/ui/button';

export function NotFoundPage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-7xl font-black text-primary/20">404</p>
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Đường dẫn bạn truy cập không tồn tại trong {APP_NAME}. Có thể link đã cũ hoặc bị gõ sai.
      </p>
      <Button asChild>
        <Link to="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
