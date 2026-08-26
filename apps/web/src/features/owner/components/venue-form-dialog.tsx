import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { cn } from '../../../lib/utils';

import { SUPPORTED_CITIES, districtsOfCity } from '@sango/shared';

import { AMENITY_OPTIONS, venueFormSchema, type VenueFormValues } from '../schemas';

const STEPS = ['Thông tin', 'Ảnh & tiện ích', 'Giờ & cọc'] as const;

interface VenueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Venue đang sửa; undefined = tạo mới. */
  venue?: VenueFormValues & { id?: string };
  onSubmit: (values: VenueFormValues) => Promise<void> | void;
  submitting?: boolean;
  serverError?: string | null;
}

const DEFAULT_VALUES: VenueFormValues = {
  name: '',
  address: '',
  city: 'Hà Nội',
  district: '',
  lat: 21.0285,
  lng: 105.8542,
  openHour: 6,
  closeHour: 23,
  depositPercent: 30,
  images: [],
  amenities: [],
};

/** Wizard tạo/sửa cụm sân 3 bước: Thông tin → Ảnh & tiện ích → Giờ & cọc. */
export function VenueFormDialog({
  open,
  onOpenChange,
  venue,
  onSubmit,
  submitting,
  serverError,
}: VenueFormDialogProps): ReactElement {
  const [step, setStep] = useState(0);
  const [newImage, setNewImage] = useState('');
  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: venue ?? DEFAULT_VALUES,
  });
  // Dialog render thường trực — reset form mỗi lần MỞ để (a) prefill đúng venue đang sửa,
  // (b) không giữ dữ liệu của venue trước (nguy cơ ghi đè nhầm lên bản ghi khác).
  useEffect(() => {
    if (open) {
      setStep(0);
      form.reset(venue ?? DEFAULT_VALUES);
    }
  }, [open, venue, form]);
  const images = form.watch('images');
  const amenities = form.watch('amenities');
  const selectedCity = form.watch('city');
  const districtOptions = districtsOfCity(selectedCity);

  function addImage(): void {
    const url = newImage.trim();
    if (url === '') return;
    form.setValue('images', [...images, url], { shouldDirty: true });
    setNewImage('');
  }

  function removeImage(index: number): void {
    form.setValue(
      'images',
      images.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  }

  async function next(): Promise<void> {
    const fieldsByStep: (keyof VenueFormValues)[][] = [
      ['name', 'address', 'city', 'district', 'lat', 'lng'],
      ['images'],
      ['openHour', 'closeHour', 'depositPercent'],
    ];
    const valid = await form.trigger(fieldsByStep[step]);
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function toggleAmenity(option: string): void {
    const current = amenities ?? [];
    form.setValue(
      'amenities',
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
      { shouldDirty: true },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setStep(0);
          form.reset(venue ?? DEFAULT_VALUES);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{venue?.id === undefined ? 'Tạo cụm sân mới' : 'Sửa cụm sân'}</DialogTitle>
          <DialogDescription>
            Bước {step + 1}/{STEPS.length} — {STEPS[step]}. Sân mới sẽ ở trạng thái chờ admin duyệt.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1.5" aria-hidden>
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                'h-1.5 flex-1 rounded-full transition',
                index <= step ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            setStep(0);
          })}
          className="space-y-4"
        >
          {step === 0 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="venue-name">Tên cụm sân</Label>
                <Input
                  id="venue-name"
                  {...form.register('name')}
                  placeholder="vd: Sân Pickleball Saigon"
                />
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venue-address">Địa chỉ</Label>
                <Input id="venue-address" {...form.register('address')} />
                {form.formState.errors.address ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="venue-city">Thành phố</Label>
                  <select
                    id="venue-city"
                    aria-label="Chọn thành phố"
                    value={selectedCity}
                    onChange={(event) => {
                      form.setValue('city', event.target.value as VenueFormValues['city'], {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      // Đổi thành phố -> quận cũ không còn hợp lệ, reset để chọn lại
                      form.setValue('district', '', { shouldDirty: true, shouldValidate: true });
                    }}
                    className={cn(
                      'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors',
                      'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    {SUPPORTED_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.city ? (
                    <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="venue-district">Quận / Huyện</Label>
                  <select
                    id="venue-district"
                    aria-label="Chọn quận huyện"
                    {...form.register('district')}
                    className={cn(
                      'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors',
                      'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.district ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.district.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="venue-lat">Vĩ độ</Label>
                  <Input id="venue-lat" type="number" step="any" {...form.register('lat')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="venue-lng">Kinh độ</Label>
                  <Input id="venue-lng" type="number" step="any" {...form.register('lng')} />
                </div>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="venue-image">Ảnh (URL Cloudinary)</Label>
                <div className="flex gap-2">
                  <Input
                    id="venue-image"
                    value={newImage}
                    onChange={(event) => setNewImage(event.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Thêm ảnh"
                    onClick={addImage}
                  >
                    +
                  </Button>
                </div>
                {images.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {images.map((url, index) => (
                      <li
                        key={url + '-' + index}
                        className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
                      >
                        <img src={url} alt="" className="size-8 rounded object-cover" />
                        <span className="line-clamp-1 flex-1 text-muted-foreground">{url}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Xoá ảnh ${index + 1}`}
                          onClick={() => removeImage(index)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chưa có ảnh nào — sân không ảnh vẫn gửi duyệt được.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Tiện ích</Label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_OPTIONS.map((option) => {
                    const active = (amenities ?? []).includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleAmenity(option)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-accent',
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="venue-open">Mở cửa từ (giờ)</Label>
                  <Input
                    id="venue-open"
                    type="number"
                    min={0}
                    max={23}
                    {...form.register('openHour')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="venue-close">Đến (giờ)</Label>
                  <Input
                    id="venue-close"
                    type="number"
                    min={1}
                    max={24}
                    {...form.register('closeHour')}
                  />
                </div>
              </div>
              {form.formState.errors.closeHour ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.closeHour.message}
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="venue-deposit">Đặt cọc (%)</Label>
                <Input
                  id="venue-deposit"
                  type="number"
                  min={0}
                  max={100}
                  {...form.register('depositPercent')}
                />
              </div>
            </>
          ) : null}

          {serverError != null && serverError !== '' ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              {serverError}
            </p>
          ) : null}

          <DialogFooter className="gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => current - 1)}
              >
                <ArrowLeft className="size-4" aria-hidden /> Quay lại
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => {
                  void next();
                }}
              >
                Tiếp tục <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {venue?.id === undefined ? 'Gửi duyệt' : 'Lưu thay đổi'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
