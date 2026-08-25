/**
 * SEO cơ bản cho các trang public (P1-F1): đặt <title> + meta description
 * theo từng trang. Hook chỉ chạm DOM head, không phụ thuộc thư viện ngoài.
 */
import { useEffect } from 'react';

import { APP_NAME } from '@courthub/shared';

/** Title mặc định khi trang không truyền title riêng (landing "/"). */
export const DEFAULT_SITE_TITLE = APP_NAME + ' — Đặt và quản lý sân thể thao trực tuyến';
/** Description mặc định cho landing và làm fallback. */
export const DEFAULT_SITE_DESCRIPTION =
  'Tìm kiếm, giữ chỗ 10 phút, đặt cọc online và check-in QR cho cụm sân thể thao tại Hà Nội với CourtHub.';

function upsertMetaDescription(content: string): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta === null) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
  return meta;
}

/**
 * Đặt title + description của trang.
 * @param title Tiêu đề riêng của trang (đã thêm " · CourtHub"); bỏ trống dùng mặc định.
 * @param description Mô tả SEO; bỏ trống dùng mô tả mặc định.
 */
export function usePageMeta(title?: string, description?: string): void {
  useEffect(() => {
    document.title =
      title !== undefined && title !== '' ? title + ' · ' + APP_NAME : DEFAULT_SITE_TITLE;
    upsertMetaDescription(description ?? DEFAULT_SITE_DESCRIPTION);
  }, [title, description]);
}
