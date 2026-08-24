import * as crypto from 'node:crypto';

export interface VnpayCallbackQuery {
  [key: string]: string | undefined;
}

/** Sắp xếp key a-z, bỏ hash fields, nối k=v bằng & (chuẩn VNPay). */
export function buildSignData(params: VnpayCallbackQuery): string {
  return Object.keys(params)
    .filter(
      (k) =>
        k !== 'vnp_SecureHash' &&
        k !== 'vnp_SecureHashType' &&
        params[k] !== undefined &&
        params[k] !== '',
    )
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
}

export function signHmacSha512(data: string, secret: string): string {
  return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
}

/** Xác minh chữ ký callback VNPay (so sánh không phân biệt hoa thường). */
export function verifyVnpaySignature(params: VnpayCallbackQuery, secret: string): boolean {
  const secureHash = params.vnp_SecureHash;
  if (!secureHash) return false;
  const expected = signHmacSha512(buildSignData(params), secret);
  return expected.toLowerCase() === secureHash.toLowerCase();
}

/** Dựng URL thanh toán sandbox VNPay cho một lệnh checkout. */
export function buildVnpayPaymentUrl(opts: {
  baseUrl: string;
  tmnCode: string;
  hashSecret: string;
  txnRef: string;
  amountVnd: number;
  orderInfo: string;
  returnUrl: string;
  ipAddr: string;
  locale?: string;
}): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const createDate =
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours() + 7) + // giờ VN
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds());

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: opts.tmnCode,
    vnp_Amount: String(opts.amountVnd * 100),
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: opts.ipAddr,
    vnp_Locale: opts.locale ?? 'vn',
    vnp_OrderInfo: opts.orderInfo,
    vnp_OrderType: 'billpayment',
    vnp_ReturnUrl: opts.returnUrl,
    vnp_TxnRef: opts.txnRef,
  };
  const signData = buildSignData(params);
  const secureHash = signHmacSha512(signData, opts.hashSecret);
  const qs = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join('&');
  return `${opts.baseUrl}?${qs}&vnp_SecureHash=${secureHash}`;
}

/** txnRef định danh lệnh: "<holdId>.<DEPOSIT|FULL>" — parse ngược được, unique theo hold+type. */
export function makeTxnRef(holdId: string, type: 'DEPOSIT' | 'FULL'): string {
  const short = Math.random().toString(36).slice(2, 6);
  return `${holdId}.${type}.${short}`;
}
