import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import {
  Sparkles,
  UserCheck,
  Calendar,
  Wallet,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../../../lib/auth-store';
import {
  changePasswordApi,
  updateProfileApi,
} from '../api/auth-api';
import { ProfileSidebar } from '../components/profile-sidebar';
import { ProfileOverviewTab } from '../components/profile-overview-tab';
import { ProfileInfoTab } from '../components/profile-info-tab';
import { ProfileBookingsTab } from '../components/profile-bookings-tab';
import { ProfileWalletTab } from '../components/profile-wallet-tab';
import { ProfileSecurityTab } from '../components/profile-security-tab';
import { ProfileNotificationsTab } from '../components/profile-notifications-tab';

export type ProfileTab = 'OVERVIEW' | 'PROFILE' | 'BOOKINGS' | 'WALLET' | 'SECURITY' | 'NOTIFICATIONS';

export function ProfilePage(): React.ReactElement {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = React.useState<ProfileTab>('OVERVIEW');

  // Form Profile states
  const [fullName, setFullName] = React.useState(user?.fullName || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || '');
  const [city, setCity] = React.useState('Hà Nội');
  const [district, setDistrict] = React.useState('Ba Đình');
  const [bio, setBio] = React.useState('Người đam mê thể thao phong trào.');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateMsg, setUpdateMsg] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Form Change Password states
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [isChangingPass, setIsChangingPass] = React.useState(false);
  const [passMsg, setPassMsg] = React.useState<{ text: string; isError?: boolean } | null>(null);

  // Notification toggles
  const [notifyMatchReminder, setNotifyMatchReminder] = React.useState(true);
  const [notifyMatchInvites, setNotifyMatchInvites] = React.useState(true);
  const [notifyVouchers, setNotifyVouchers] = React.useState(false);

  if (!user) {
    return (
      <div className="w-full py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Vui lòng đăng nhập để xem hồ sơ cá nhân.</p>
        <Link to="/login">
          <Button size="sm">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUpdateMsg({ text: 'Kích thước ảnh tối đa là 5MB.', isError: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setAvatarUrl(dataUrl);
      updateUser({ avatarUrl: dataUrl });
      updateProfileApi({ avatarUrl: dataUrl }).catch(() => {});
      setUpdateMsg({ text: 'Đã cập nhật ảnh đại diện thành công!' });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg(null);

    try {
      const updated = await updateProfileApi({ fullName, phone, avatarUrl });
      updateUser(updated);
      setUpdateMsg({ text: 'Đã lưu thông tin cá nhân thành công.' });
    } catch (err: any) {
      setUpdateMsg({ text: err.message || 'Cập nhật không thành công.', isError: true });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      setPassMsg({ text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.', isError: true });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassMsg({ text: 'Mật khẩu xác nhận không khớp.', isError: true });
      return;
    }

    setIsChangingPass(true);
    setPassMsg(null);

    try {
      await changePasswordApi({ currentPassword, newPassword });
      setPassMsg({ text: 'Đổi mật khẩu thành công.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPassMsg({ text: err.message || 'Đổi mật khẩu thất bại.', isError: true });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sideNavItems: { id: ProfileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'OVERVIEW', label: 'Tổng Quan & Thẻ VĐV', icon: Sparkles },
    { id: 'PROFILE', label: 'Thông Tin Cá Nhân & Avatar', icon: UserCheck },
    { id: 'BOOKINGS', label: 'Vé Đặt Sân Của Tôi', icon: Calendar },
    { id: 'WALLET', label: 'Ví Tiền SanGo', icon: Wallet },
    { id: 'SECURITY', label: 'Bảo Mật & Đổi Mật Khẩu', icon: ShieldCheck },
    { id: 'NOTIFICATIONS', label: 'Cài Đặt Thông Báo', icon: Bell },
  ];

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Sidebar */}
        <ProfileSidebar
          user={user}
          avatarUrl={avatarUrl}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAvatarFileChange={handleAvatarFileChange}
          onLogout={handleLogout}
          sideNavItems={sideNavItems}
        />

        {/* Right Tab Content */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {activeTab === 'OVERVIEW' && (
            <ProfileOverviewTab user={user} avatarUrl={avatarUrl} phone={phone} />
          )}

          {activeTab === 'PROFILE' && (
            <ProfileInfoTab
              user={user}
              fullName={fullName}
              onFullNameChange={setFullName}
              phone={phone}
              onPhoneChange={setPhone}
              avatarUrl={avatarUrl}
              city={city}
              onCityChange={setCity}
              district={district}
              onDistrictChange={setDistrict}
              bio={bio}
              onBioChange={setBio}
              isUpdating={isUpdating}
              updateMsg={updateMsg}
              onAvatarFileChange={handleAvatarFileChange}
              onSubmit={handleUpdateProfile}
            />
          )}

          {activeTab === 'BOOKINGS' && <ProfileBookingsTab />}

          {activeTab === 'WALLET' && <ProfileWalletTab />}

          {activeTab === 'SECURITY' && (
            <ProfileSecurityTab
              currentPassword={currentPassword}
              onCurrentPasswordChange={setCurrentPassword}
              newPassword={newPassword}
              onNewPasswordChange={setNewPassword}
              confirmNewPassword={confirmNewPassword}
              onConfirmNewPasswordChange={setConfirmNewPassword}
              isChangingPass={isChangingPass}
              passMsg={passMsg}
              onSubmit={handleChangePassword}
            />
          )}

          {activeTab === 'NOTIFICATIONS' && (
            <ProfileNotificationsTab
              notifyMatchReminder={notifyMatchReminder}
              onToggleMatchReminder={() => setNotifyMatchReminder(!notifyMatchReminder)}
              notifyMatchInvites={notifyMatchInvites}
              onToggleMatchInvites={() => setNotifyMatchInvites(!notifyMatchInvites)}
              notifyVouchers={notifyVouchers}
              onToggleVouchers={() => setNotifyVouchers(!notifyVouchers)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
