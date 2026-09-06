/**
 * P3 — Refund về thẻ qua API hoàn tiền VNPay (DR), flag VNPAY_REFUND_ENABLED mặc định OFF.
 *
 * Chuẩn VNPay DR (docs sandbox.vnpayment.vn/apis — mục "Yêu cầu hoàn tiền (Refund)"):
 * - POST JSON tới {origin của VNPAY_SANDBOX_URL}/merchant_webapi/api/transaction
 * - vnp_Command=refund, vnp_TransactionType='02' (hoàn tiền), vnp_Amount = số tiền * 100
 * - Checksum DR KHÔNG phải dạng "k=v&..." sorted như URL thanh toán, mà là
 *   HMAC-SHA512(secret, 13 trường nối bằng '|' ĐÚNG THỨ TỰ spec):
 *   vnp_RequestId | vnp_Version | vnp_Command | vnp_TmnCode | vnp_TransactionType |
 *   vnp_TxnRef | vnp_Amount | vnp_TransactionNo | vnp_TransactionDate | vnp_CreateBy |
 *   vnp_CreateDate | vnp_IpAddr | vnp_OrderInfo
 *
 * Luồng (bookings.service.cancelBooking — P3.2/P3.3):
 * - flag ON + payment gốc VNPAY PAID -> gọi DR; ok => Payment(REFUND) PAID, KHÔNG credit ví.
 * - flag OFF hoặc DR fail -> fallback giữ nguyên hành vi hiện tại (credit ví nội bộ,
 *   Payment(REFUND) làm chứng từ đối soát), không throw làm fail cancel.
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { signHmacSha512 } from './vnpay.util';

/** Đầu vào của một lệnh hoàn tiền DR (tiền đơn vị VND — chưa nhân 100). */
export interface VnpayDrRefundInput {
  /** vnp_TxnRef của giao dịch gốc đã PAID trên VNPay. */
  txnRef: string;
  /** Số tiền hoàn (VND). */
  amountVnd: number;
  /** Mô tả yêu cầu hoàn (vnp_OrderInfo). */
  orderInfo: string;
  /** Thời gian GD gốc theo GMT+7, yyyyMMddHHmmss (vnp_TransactionDate). */
  transDate: string;
  /** Mã GD VNPAY của GD gốc (vnp_TransactionNo) — thiếu thì gửi chuỗi rỗng theo spec. */
  transactionNo?: string;
  /** Người tạo yêu cầu hoàn (vnp_CreateBy) — mặc định 'sango-admin'. */
  createBy?: string;
  /** IP máy chủ gọi API. */
  ipAddr?: string;
}

export interface VnpayDrRefundResult {
  /** true CHỈ khi HTTP OK và vnp_ResponseCode === '00' (so sánh chuỗi chính xác — bài học F2). */
  ok: boolean;
  code?: string;
  message?: string;
  /** Body thô VNPAY trả về (lưu Payment.rawPayload phục vụ đối soát). */
  raw?: Record<string, unknown>;
}

/** yyyyMMddHHmmss theo GMT+7 (VNPay yêu cầu giờ VN). */
export function formatGmt7(date: Date): string {
  const vn = new Date(date.getTime() + 7 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    String(vn.getUTCFullYear()) +
    pad(vn.getUTCMonth() + 1) +
    pad(vn.getUTCDate()) +
    pad(vn.getUTCHours()) +
    pad(vn.getUTCMinutes()) +
    pad(vn.getUTCSeconds())
  );
}

/** Flag P3.3: mặc định OFF — chỉ bật khi có merchant thật. */
export function isVnpayRefundEnabled(): boolean {
  return process.env.VNPAY_REFUND_ENABLED === 'true';
}

/** URL API DR suy ra từ origin của VNPAY_SANDBOX_URL (cùng host merchant_webapi). */
export function vnpayDrApiUrl(): string {
  const payUrl =
    process.env.VNPAY_SANDBOX_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  return new URL('/merchant_webapi/api/transaction', new URL(payUrl).origin).toString();
}

/**
 * Dựng payload DR + chữ ký HMAC-SHA512 (hàm thuần — unit test ký payload ở đây).
 * vnp_RequestId: Alphanumeric[1,32], không trùng trong ngày -> 32 hex từ randomUUID.
 */
export function buildVnpayDrRefundPayload(
  input: VnpayDrRefundInput,
  opts: { tmnCode: string; hashSecret: string; now?: Date; requestId?: string },
) {
  const now = opts.now ?? new Date();
  const requestId = opts.requestId ?? randomUUID().replace(/-/g, '');
  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'refund',
    vnp_TmnCode: opts.tmnCode,
    vnp_TransactionType: '02', // 02 = hoàn tiền theo spec Refund (03 = hoàn một phần — phase sau)
    vnp_TxnRef: input.txnRef,
    vnp_Amount: String(input.amountVnd * 100),
    vnp_TransactionNo: input.transactionNo ?? '',
    vnp_TransactionDate: input.transDate,
    vnp_CreateBy: input.createBy ?? 'sango-admin',
    vnp_CreateDate: formatGmt7(now),
    vnp_IpAddr: input.ipAddr ?? '127.0.0.1',
    vnp_OrderInfo: input.orderInfo,
  };
  // Chuẩn DR: checksum = HMAC-SHA512(secret, 13 trường nối '|' đúng thứ tự spec
  // sandbox.vnpayment.vn/apis — "Yêu cầu hoàn tiền (Refund)").
  const signData = [
    requestId,
    params.vnp_Version,
    params.vnp_Command,
    params.vnp_TmnCode,
    params.vnp_TransactionType,
    params.vnp_TxnRef,
    params.vnp_Amount,
    params.vnp_TransactionNo,
    params.vnp_TransactionDate,
    params.vnp_CreateBy,
    params.vnp_CreateDate,
    params.vnp_IpAddr,
    params.vnp_OrderInfo,
  ].join('|');
  const secureHash = signHmacSha512(signData, opts.hashSecret);
  const body: Record<string, string> = {
    vnp_RequestId: requestId,
    ...params,
    vnp_SecureHash: secureHash,
  };
  return { requestId, signData, secureHash, body };
}

/**
 * Đọc phản hồi DR. CHỈ vnp_ResponseCode === '00' (chuỗi chính xác) là thành công —
 * không truthy-check lỏng (bài học F2: '000'/'0'/'00 ' đều phải bị từ chối).
 */
export function parseVnpayDrResponse(raw: unknown): VnpayDrRefundResult {
  if (raw === null || typeof raw !== 'object') {
    return { ok: false, message: 'VNPAY_DR_BAD_RESPONSE' };
  }
  const rec = raw as Record<string, unknown>;
  const code =
    typeof rec.vnp_ResponseCode === 'string'
      ? rec.vnp_ResponseCode
      : rec.vnp_ResponseCode == null
        ? undefined
        : String(rec.vnp_ResponseCode);
  const message = typeof rec.vnp_Message === 'string' ? rec.vnp_Message : undefined;
  return { ok: code === '00', code, message, raw: rec };
}

/**
 * Client API hoàn tiền VNPay (DR). Vô trạng thái, chỉ bọc fetch + env nên
 * BookingsService tự dựng (BookingsModule import PaymentsModule sẽ vòng phụ thuộc).
 */
@Injectable()
export class VnpayRefundService {
  private readonly logger = new Logger(VnpayRefundService.name);

  /**
   * Gọi DR hoàn tiền. KHÔNG BAO GIỜ throw: thiếu credentials / lỗi mạng / parse lỗi
   * đều trả ok:false để caller fallback hoàn ví nội bộ (P3.3), không fail cancel.
   */
  async requestRefund(input: VnpayDrRefundInput): Promise<VnpayDrRefundResult> {
    const tmnCode = process.env.VNPAY_TMN_CODE;
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    if (!tmnCode || !hashSecret) {
      this.logger.warn('VNPay DR bỏ qua: thiếu VNPAY_TMN_CODE/VNPAY_HASH_SECRET');
      return { ok: false, message: 'MISSING_VNPAY_CREDENTIALS' };
    }
    const { body } = buildVnpayDrRefundPayload(input, { tmnCode, hashSecret });
    try {
      const res = await fetch(vnpayDrApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const raw = (await res.json().catch(() => undefined)) as unknown;
      const result = parseVnpayDrResponse(raw);
      if (!result.ok) {
        this.logger.warn(
          'VNPay DR từ chối: code=' + (result.code ?? 'N/A') + ' message=' + (result.message ?? 'N/A'),
        );
      }
      return result;
    } catch (e) {
      this.logger.warn('VNPay DR gọi lỗi: ' + (e as Error).message);
      return { ok: false, message: 'VNPAY_DR_UNREACHABLE' };
    }
  }
}
