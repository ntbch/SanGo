/**
 * Các tiện ích chuẩn hoá định dạng ngày giờ theo quy chuẩn Việt Nam (dd/MM/yyyy).
 */

/**
 * Phân tích an toàn giá trị đầu vào thành đối tượng Date.
 */
export function parseToDate(val: string | Date | number | null | undefined): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const str = val.trim();
    if (!str) return null;
    // Khớp mẫu chuẩn YYYY-MM-DD
    const matchYmd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
    if (matchYmd) {
      const year = parseInt(matchYmd[1], 10);
      const month = parseInt(matchYmd[2], 10) - 1;
      const day = parseInt(matchYmd[3], 10);
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Định dạng ngày sang 'dd/MM/yyyy'.
 * Vd: '2026-08-26' -> '26/08/2026'
 */
export function formatDate(
  val: string | Date | number | null | undefined,
  fallback: string = '—',
): string {
  if (val === null || val === undefined || val === '') return fallback;

  if (typeof val === 'string') {
    const str = val.trim();
    // Xử lý nhanh chuỗi YYYY-MM-DD để tránh lệch múi giờ
    const matchYmd = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (matchYmd && (str.length === 10 || !str.includes('T'))) {
      return `${matchYmd[3]}/${matchYmd[2]}/${matchYmd[1]}`;
    }
    // Chuỗi đã có định dạng dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      return str;
    }
  }

  const d = parseToDate(val);
  if (!d) return typeof val === 'string' && val.trim() ? val : fallback;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ sang 'HH:mm dd/MM/yyyy'.
 * Vd: ISO -> '14:30 26/08/2026'
 */
export function formatDateTime(
  val: string | Date | number | null | undefined,
  fallback: string = '—',
): string {
  if (val === null || val === undefined || val === '') return fallback;

  const d = parseToDate(val);
  if (!d) return typeof val === 'string' && val.trim() ? val : fallback;

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

/**
 * Định dạng ngày ngắn sang 'dd/MM'.
 * Vd: '2026-08-26' -> '26/08'
 */
export function formatDateShort(
  val: string | Date | number | null | undefined,
  fallback: string = '—',
): string {
  if (val === null || val === undefined || val === '') return fallback;

  if (typeof val === 'string') {
    const str = val.trim();
    const matchYmd = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (matchYmd && (str.length === 10 || !str.includes('T'))) {
      return `${matchYmd[3]}/${matchYmd[2]}`;
    }
  }

  const d = parseToDate(val);
  if (!d) return fallback;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Định dạng giờ sang 'HH:mm'.
 * Vd: Date -> '14:30'
 */
export function formatTime(
  val: string | Date | number | null | undefined,
  fallback: string = '—',
): string {
  if (val === null || val === undefined || val === '') return fallback;

  const d = parseToDate(val);
  if (!d) return fallback;

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Chuyển Date hoặc chuỗi về dạng 'YYYY-MM-DD' cho thẻ input type="date".
 */
export function toInputDateFormat(date?: Date | string | null): string {
  if (!date) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof date === 'string') {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(date.trim());
    if (match) return match[1];
  }
  const d = parseToDate(date);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
