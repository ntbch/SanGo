import { useParams } from 'react-router-dom';

import { usePageMeta } from '../../lib/seo';
import { useVenue } from '../../features/public/queries';

interface PageMetaProps {
  title?: string;
  description?: string;
}

/** Component khai báo SEO (P1-F1) ngay trong cây route — không rải hook vào từng trang. */
export function PageMeta({ title, description }: PageMetaProps): null {
  usePageMeta(title, description);
  return null;
}

/** SEO cho trang chi tiết sân: title theo tên cụm sân sau khi tải xong. */
export function VenueDetailPageMeta(): null {
  const { slug = '' } = useParams();
  const { data: venue } = useVenue(slug);

  const title = venue !== undefined ? venue.name : 'Chi tiết cụm sân';
  const description =
    venue !== undefined
      ? venue.address + ' — xem giá từng slot, tiện ích, đánh giá và giữ chỗ online tại SanGo.'
      : undefined;
  usePageMeta(title, description);
  return null;
}

/** SEO cho trang chọn giờ đặt sân (công khai xem lịch, đăng nhập để giữ chỗ). */
export function BookingCalendarPageMeta(): null {
  const { slug = '' } = useParams();
  const { data: venue } = useVenue(slug);

  usePageMeta(
    venue !== undefined ? 'Chọn giờ · ' + venue.name : 'Chọn giờ đặt sân',
    venue !== undefined
      ? 'Lịch trống realtime của ' +
          venue.name +
          ' — chọn khung giờ liền kề và giữ chỗ trong 10 phút.'
      : undefined,
  );
  return null;
}
