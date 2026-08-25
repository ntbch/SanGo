import { z } from 'zod';
import { VenueServiceType } from '@prisma/client';

export const CreateVenueServiceSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên dịch vụ không được để trống')
    .max(100, 'Tên dịch vụ tối đa 100 ký tự'),
  price: z
    .number()
    .int()
    .min(1000, 'Giá dịch vụ tối thiểu 1.000đ')
    .max(10_000_000, 'Giá dịch vụ tối đa 10.000.000đ'),
  type: z.nativeEnum(VenueServiceType).default(VenueServiceType.OTHER),
  isAvailable: z.boolean().default(true),
});
export type CreateVenueServiceDto = z.infer<typeof CreateVenueServiceSchema>;

export const UpdateVenueServiceSchema = CreateVenueServiceSchema.partial();
export type UpdateVenueServiceDto = z.infer<typeof UpdateVenueServiceSchema>;

export const AddBookingAddOnsSchema = z.union([
  z.object({
    items: z
      .array(
        z.object({
          serviceId: z.string().uuid('serviceId phải là UUID'),
          quantity: z
            .number()
            .int()
            .min(1, 'Số lượng tối thiểu là 1')
            .max(100, 'Số lượng tối đa 100'),
        }),
      )
      .min(1, 'Cần ít nhất 1 dịch vụ'),
  }),
  z
    .object({
      serviceId: z.string().uuid('serviceId phải là UUID'),
      quantity: z
        .number()
        .int()
        .min(1, 'Số lượng tối thiểu là 1')
        .max(100, 'Số lượng tối đa 100')
        .default(1),
    })
    .transform((val) => ({ items: [{ serviceId: val.serviceId, quantity: val.quantity }] })),
]);
export type AddBookingAddOnsDto = z.infer<typeof AddBookingAddOnsSchema>;

export const VenueIdParamSchema = z.object({
  venueId: z.string().uuid('venueId phải là UUID'),
});
export type VenueIdParamDto = z.infer<typeof VenueIdParamSchema>;

export const VenueAndServiceIdParamSchema = z.object({
  venueId: z.string().uuid('venueId phải là UUID'),
  id: z.string().uuid('id dịch vụ phải là UUID'),
});
export type VenueAndServiceIdParamDto = z.infer<typeof VenueAndServiceIdParamSchema>;

export const BookingIdParamSchema = z.object({
  id: z.string().uuid('id đặt sân phải là UUID'),
});
export type BookingIdParamDto = z.infer<typeof BookingIdParamSchema>;
