import React from 'react';
import { Card } from '../../../components/ui/card';
import { Camera, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import { UserRole } from '../../../lib/constants';
import { cn } from '../../../lib/utils';
import { User } from '../../../lib/auth-store';
import { ProfileTab } from '../pages/profile-page';

interface ProfileSidebarProps {
  user: User;
  avatarUrl: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  sideNavItems: { id: ProfileTab; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

export function ProfileSidebar({
  user,
  avatarUrl,
  activeTab,
  onTabChange,
  onAvatarFileChange,
  onLogout,
  sideNavItems,
}: ProfileSidebarProps): React.ReactElement {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <aside className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-20">
      <Card className="p-5 border border-border/80 bg-card/95 backdrop-blur-md shadow-xl space-y-5">
        {/* Athlete Profile Mini Card */}
        <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border/60">
          {/* Avatar with Camera Upload Overlay */}
          <div className="relative group">
            <div className="h-20 w-20 rounded-3xl bg-primary/15 border-2 border-primary/40 text-primary font-black text-3xl flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/20">
              {user.avatarUrl || avatarUrl ? (
                <img
                  src={user.avatarUrl || avatarUrl || ''}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Tải ảnh đại diện từ thiết bị"
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Name, Role & Compact Reputation Badge */}
          <div className="space-y-1 min-w-0 w-full">
            <h2 className="text-base font-black text-foreground truncate">{user.fullName}</h2>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="pt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
                {user.role === UserRole.OWNER ? 'Chủ Cụm Sân' : user.role === UserRole.ADMIN ? 'Quản Trị' : 'Người Chơi'}
              </span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/80 text-[10px] font-bold">
                <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">Uy Tín:</span>
                <span className="font-mono-num text-primary font-black">{user.reputationScore ?? 100}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Navigation Menu */}
        <nav className="space-y-1">
          {sideNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-emerald-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={cn('h-3.5 w-3.5 opacity-60', isActive && 'text-primary-foreground')} />
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </Card>
    </aside>
  );
}
