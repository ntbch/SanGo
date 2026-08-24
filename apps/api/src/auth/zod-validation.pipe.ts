import { type ArgumentMetadata, BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Pipe validate body bằng zod schema (đặc tả §7: "Validate toàn bộ input").
 * Lỗi trả thống nhất { statusCode, message, code } với code=VALIDATION_FAILED.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Dữ liệu gửi lên không hợp lệ',
        code: 'VALIDATION_FAILED',
        errors: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    return result.data;
  }
}
