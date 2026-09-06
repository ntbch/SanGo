import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CITIES, DISTRICTS_BY_CITY } from '../../../lib/constants';
import { User } from '../../../lib/auth-store';
import { cn } from '../../../lib/utils';

interface ProfileInfoTabProps {
  user: User;
  fullName: string;
  onFullNameChange: (name: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  avatarUrl: string;
  city: string;
  onCityChange: (city: string) => void;
  district: string;
  onDistrictChange: (district: string) => void;
  bio: string;
  onBioChange: (bio: string) => void;
  isUpdating: boolean;
  updateMsg: { text: string; isError?: boolean } | null;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ProfileInfoTab({
  user,
  fullName,
  onFullNameChange,
  phone,
  onPhoneChange,
  avatarUrl,
  city,
  onCityChange,
  district,
  onDistrictChange,
  bio,
  onBioChange,
  isUpdating,
  updateMsg,
  onAvatarFileChange,
  onSubmit,
}: ProfileInfoTabProps): React.ReactElement {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6 animate-in fade-in-50 duration-200">
      <div className="pb-3 border-b border-border/50">
        <h3 className="text-base font-black text-foreground">Chỉnh Sửa Thông Tin Cá Nhân</h3>
        <p className="text-xs text-muted-foreground">Cập nhật ảnh, tên và thông tin liên hệ.</p>
      </div>

      {updateMsg && (
        <div
          className={cn(
            'p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5',
            updateMsg.isError
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
          )}
        >
          {updateMsg.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{updateMsg.text}</span>
        </div>
      )}

      {/* Avatar Upload Field */}
      <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col sm:flex-row items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-xl overflow-hidden border border-primary/30 shrink-0">
          {avatarUrl || user.avatarUrl ? (
            <img src={avatarUrl || user.avatarUrl || ''} alt="Avatar Preview" className="h-full w-full object-cover" />
          ) : (
            user.fullName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <p className="text-xs font-bold text-foreground">Ảnh Đại Diện</p>
          <p className="text-[11px] text-muted-foreground">Định dạng JPG, PNG tối đa 5MB.</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold gap-1.5 h-8 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Chọn ảnh từ máy</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">Họ và tên</label>
            <Input
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              required
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">Số điện thoại</label>
            <Input
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="0987654321"
              className="h-10 text-xs font-mono-num"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground block">Địa chỉ Email (Read-only)</label>
            <Input value={user.email} disabled className="h-10 text-xs opacity-60 bg-muted/40 font-mono-num" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">Thành phố</label>
            <select
              value={city}
              onChange={(e) => {
                const newCity = e.target.value;
                onCityChange(newCity);
                const dists = DISTRICTS_BY_CITY[newCity as (typeof CITIES)[number]];
                if (dists && dists.length > 0) onDistrictChange(dists[0]);
              }}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">Quận / Huyện</label>
            <select
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
            >
              {(DISTRICTS_BY_CITY[city as (typeof CITIES)[number]] || DISTRICTS_BY_CITY['Hà Nội']).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">Tiểu sử / Giới thiệu</label>
            <Input
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="Môn sở trường, vị trí thi đấu..."
              className="h-10 text-xs"
            />
          </div>
        </div>

        <Button type="submit" disabled={isUpdating} size="lg" className="font-bold text-xs shadow-md cursor-pointer">
          {isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}
        </Button>
      </form>
    </Card>
  );
}
