import React, { useEffect, useState } from 'react';
import {
  getOwnerVenuesApi,
  getVenueCourtsApi,
  createCourtApi,
  updateCourtApi,
  deleteCourtApi,
  getCourtPricingRulesApi,
  replaceCourtPricingRulesApi,
  getVenueServicesApi,
  createOwnerServiceApi,
  updateOwnerServiceApi,
  deleteOwnerServiceApi,
  getOwnerVouchersApi,
  createOwnerVoucherApi,
  updateOwnerVoucherApi,
  deleteOwnerVoucherApi,
  getOwnerAnalyticsApi,
  getOwnerBookingsApi,
  checkInBookingApi,
  markNoShowBookingApi,
  type OwnerVenue,
  type Court,
  type PricingRule,
  type VenueService,
  type OwnerVoucher,
  type OwnerAnalyticsResponse,
  type OwnerBookingItem,
  type SportType,
  type DayType,
  type ServiceType,
  type BookingStatus,
} from '../api/owner-api';
import { DashboardLayout } from '../layouts/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { formatVND, formatMinutesToTime, cn } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/auth-store';
import {
  RevenueTrendAreaChart,
  HourlyOccupancyBarChart,
  CourtPerformanceDoughnut,
} from '../components/dashboard-charts';
import {
  LayoutDashboard,
  CalendarDays,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Building2,
  Layers,
  Plus,
  Trash2,
  Power,
  Search,
  TicketPercent,
  CupSoda,
  RefreshCw,
  Phone,
  BadgePercent,
  ArrowRight,
  Sparkles,
  Activity,
  Check,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

const DAY_OF_WEEK_LABELS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Helper to generate hours from 06:00 to 23:00
const TIMELINE_HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 to 23

export function OwnerDashboardPage(): React.ReactElement {
  const { user } = useAuthStore();

  // Navigation & Hierarchy State
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<OwnerVenue | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Tab 1: Check-in & Bookings
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{ message: string; booking: OwnerBookingItem } | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');
  const [bookings, setBookings] = useState<OwnerBookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Tab 2 (New): Walk-in Modal State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInCourtId, setWalkInCourtId] = useState('');
  const [walkInStartHour, setWalkInStartHour] = useState('17:00');
  const [walkInEndHour, setWalkInEndHour] = useState('18:30');
  const [walkInCustomerName, setWalkInCustomerName] = useState('');
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState('');
  const [walkInDeposit, setWalkInDeposit] = useState(100000);
  const [walkInTotal, setWalkInTotal] = useState(300000);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  // Tab 3: Analytics
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [analytics, setAnalytics] = useState<OwnerAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Tab 3: Courts Management
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [addCourtModalOpen, setAddCourtModalOpen] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtSport, setNewCourtSport] = useState<SportType>('FOOTBALL5');
  const [newCourtSlotMinutes, setNewCourtSlotMinutes] = useState(60);
  const [newCourtDefaultPrice, setNewCourtDefaultPrice] = useState(250000);
  const [courtActionLoading, setCourtActionLoading] = useState(false);

  // Tab 4: Pricing Rules
  const [selectedCourtForPricing, setSelectedCourtForPricing] = useState<Court | null>(null);
  const [pricingDayType, setPricingDayType] = useState<DayType>('WEEKDAY');
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingPricingRules, setLoadingPricingRules] = useState(false);
  const [ruleStartHour, setRuleStartHour] = useState('17:00');
  const [ruleEndHour, setRuleEndHour] = useState('22:00');
  const [rulePrice, setRulePrice] = useState(350000);
  const [savingPricing, setSavingPricing] = useState(false);

  // Tab 5: Services Management
  const [services, setServices] = useState<VenueService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(20000);
  const [newServiceType, setNewServiceType] = useState<ServiceType>('BEVERAGE');
  const [serviceActionLoading, setServiceActionLoading] = useState(false);

  // Tab 6: Vouchers Management
  const [vouchers, setVouchers] = useState<OwnerVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [addVoucherModalOpen, setAddVoucherModalOpen] = useState(false);
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherPercent, setNewVoucherPercent] = useState(20);
  const [newVoucherDay, setNewVoucherDay] = useState(1);
  const [newVoucherFromHour, setNewVoucherFromHour] = useState('08:00');
  const [newVoucherToHour, setNewVoucherToHour] = useState('16:00');
  const [newVoucherLimit, setNewVoucherLimit] = useState(50);
  const [voucherActionLoading, setVoucherActionLoading] = useState(false);

  // Initial load: Fetch owner's venues
  const fetchVenues = async () => {
    try {
      const res = await getOwnerVenuesApi({ page: 1, limit: 50 });
      setVenues(res.items);
      if (res.items.length > 0 && !selectedVenue) {
        setSelectedVenue(res.items[0]);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách cụm sân:', err);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  // Fetch Bookings when venue or date/filter changes
  const fetchBookings = async (targetVenue = selectedVenue) => {
    if (!targetVenue) return;
    setLoadingBookings(true);
    try {
      const res = await getOwnerBookingsApi({
        venueId: targetVenue.id,
        date: bookingDate || undefined,
        status: bookingStatusFilter !== 'ALL' ? (bookingStatusFilter as BookingStatus) : undefined,
        limit: 50,
      });
      setBookings(res.items);
    } catch (err) {
      console.error('Lỗi khi nạp danh sách đơn:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async (targetVenue = selectedVenue) => {
    if (!targetVenue) return;
    setLoadingAnalytics(true);
    try {
      const res = await getOwnerAnalyticsApi(targetVenue.id, analyticsDays);
      setAnalytics(res);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo Analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Courts
  const fetchCourts = async (targetVenue = selectedVenue) => {
    if (!targetVenue) return;
    setLoadingCourts(true);
    try {
      const res = await getVenueCourtsApi(targetVenue.id);
      setCourts(res);
      if (res.length > 0) {
        setSelectedCourtForPricing(res[0]);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách sân con:', err);
    } finally {
      setLoadingCourts(false);
    }
  };

  // Fetch Pricing Rules
  const fetchPricingRules = async (courtId: string) => {
    setLoadingPricingRules(true);
    try {
      const res = await getCourtPricingRulesApi(courtId);
      setPricingRules(res);
    } catch (err) {
      console.error('Lỗi khi tải bảng giá:', err);
    } finally {
      setLoadingPricingRules(false);
    }
  };

  // Fetch Services
  const fetchServices = async (targetVenue = selectedVenue) => {
    if (!targetVenue) return;
    setLoadingServices(true);
    try {
      const res = await getVenueServicesApi(targetVenue.id);
      setServices(res);
    } catch (err) {
      console.error('Lỗi khi nạp menu dịch vụ:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  // Fetch Vouchers
  const fetchVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const res = await getOwnerVouchersApi();
      setVouchers(res);
    } catch (err) {
      console.error('Lỗi khi nạp danh sách voucher:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (!selectedVenue) return;
    if (activeTab === 'overview') {
      fetchAnalytics(selectedVenue);
      fetchBookings(selectedVenue);
      fetchCourts(selectedVenue);
      fetchServices(selectedVenue);
      fetchVouchers();
    }
    if (activeTab === 'schedule') {
      fetchCourts(selectedVenue);
      fetchBookings(selectedVenue);
    }
    if (activeTab === 'checkin') fetchBookings(selectedVenue);
    if (activeTab === 'analytics') fetchAnalytics(selectedVenue);
    if (activeTab === 'venues') fetchCourts(selectedVenue);
    if (activeTab === 'pricing') {
      fetchCourts(selectedVenue);
    }
    if (activeTab === 'services') fetchServices(selectedVenue);
    if (activeTab === 'vouchers') fetchVouchers();
  }, [activeTab, selectedVenue, bookingDate, bookingStatusFilter, analyticsDays]);

  useEffect(() => {
    if (selectedCourtForPricing) {
      fetchPricingRules(selectedCourtForPricing.id);
    }
  }, [selectedCourtForPricing]);

  /* =========================================================================
   * HANDLERS
   * ========================================================================= */

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;
    setCheckInLoading(true);
    setCheckInResult(null);
    setCheckInError(null);

    try {
      const res = await checkInBookingApi(checkInCode.trim());
      setCheckInResult(res);
      setCheckInCode('');
      fetchBookings(); // refresh list
    } catch (err: any) {
      setCheckInError(err.message || 'Mã vé không hợp lệ hoặc không ở trạng thái CONFIRMED');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleQuickCheckIn = async (code: string) => {
    setCheckInLoading(true);
    setCheckInResult(null);
    setCheckInError(null);
    try {
      const res = await checkInBookingApi(code.trim());
      setCheckInResult(res);
      fetchBookings();
    } catch (err: any) {
      setCheckInError(err.message || 'Không thể check-in đơn này');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleOpenWalkIn = (courtId?: string, startH = '17:00', endH = '18:30') => {
    setWalkInCourtId(courtId || (courts.length > 0 ? courts[0].id : ''));
    setWalkInStartHour(startH);
    setWalkInEndHour(endH);
    setWalkInCustomerName('');
    setWalkInCustomerPhone('');
    setWalkInDeposit(100000);
    setWalkInTotal(300000);
    setWalkInModalOpen(true);
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInCourtId || !walkInCustomerName.trim()) {
      alert('Vui lòng chọn sân và điền tên khách');
      return;
    }
    setWalkInSubmitting(true);
    try {
      const startMin = parseInt(walkInStartHour.split(':')[0], 10) * 60 + parseInt(walkInStartHour.split(':')[1] || '0', 10);
      const endMin = parseInt(walkInEndHour.split(':')[0], 10) * 60 + parseInt(walkInEndHour.split(':')[1] || '0', 10);
      const targetCourt = courts.find((c) => c.id === walkInCourtId);

      const newBooking: OwnerBookingItem = {
        id: `walkin-${Date.now()}`,
        code: `WI-${bookingDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: `walkin-cust-${Date.now()}`,
        courtId: walkInCourtId,
        date: bookingDate,
        startMinute: startMin,
        endMinute: endMin,
        subtotal: Number(walkInTotal),
        depositAmount: Number(walkInDeposit),
        status: 'CONFIRMED',
        court: {
          id: walkInCourtId,
          name: targetCourt?.name || 'Sân đặt quầy',
          sportType: targetCourt?.sportType || 'FOOTBALL5',
        },
        customer: {
          id: `walkin-cust-${Date.now()}`,
          fullName: walkInCustomerName.trim(),
          phone: walkInCustomerPhone.trim() || 'Khách vãng lai',
          email: 'walkin@sango.vn',
        },
      };

      setBookings((prev) => [newBooking, ...prev]);
      setWalkInModalOpen(false);
      alert(`Tạo đơn đặt quầy thành công! Mã đơn: ${newBooking.code}`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo đơn tại quầy');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const handleMarkNoShow = async (bookingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu đơn này là Khách Vắng Mặt (NO_SHOW)?')) return;
    try {
      await markNoShowBookingApi(bookingId);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Không thể đánh dấu No-Show');
    }
  };

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue || !newCourtName) return;
    setCourtActionLoading(true);
    try {
      await createCourtApi(selectedVenue.id, {
        name: newCourtName,
        sportType: newCourtSport,
        slotMinutes: Number(newCourtSlotMinutes),
        defaultPricePerSlot: Number(newCourtDefaultPrice),
      });
      setAddCourtModalOpen(false);
      setNewCourtName('');
      fetchCourts();
    } catch (err: any) {
      alert(err.message || 'Không thể thêm sân con');
    } finally {
      setCourtActionLoading(false);
    }
  };

  const handleToggleCourtMaintenance = async (court: Court) => {
    const nextStatus = court.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await updateCourtApi(court.id, { status: nextStatus });
      fetchCourts();
    } catch (err: any) {
      alert(err.message || 'Không thể đổi trạng thái sân');
    }
  };

  const handleDeleteCourt = async (courtId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sân con này? Thao tác không thể hoàn tác!')) return;
    try {
      await deleteCourtApi(courtId);
      fetchCourts();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa sân (có thể đã có đơn đặt).');
    }
  };

  const handleAddPricingRule = () => {
    const [sh, sm] = ruleStartHour.split(':').map(Number);
    const [eh, em] = ruleEndHour.split(':').map(Number);
    const startMinute = sh * 60 + sm;
    const endMinute = eh * 60 + em;

    if (startMinute >= endMinute) {
      alert('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return;
    }

    const newRule: PricingRule = {
      id: 'temp-' + Date.now(),
      courtId: selectedCourtForPricing?.id || '',
      dayType: pricingDayType,
      startMinute,
      endMinute,
      pricePerSlot: Number(rulePrice),
    };

    setPricingRules([...pricingRules, newRule]);
  };

  const handleRemovePricingRule = (index: number) => {
    const next = [...pricingRules];
    next.splice(index, 1);
    setPricingRules(next);
  };

  const handleSaveAllPricingRules = async () => {
    if (!selectedCourtForPricing) return;
    setSavingPricing(true);
    try {
      const payloadRules = pricingRules.map((r) => ({
        dayType: r.dayType,
        startMinute: r.startMinute,
        endMinute: r.endMinute,
        pricePerSlot: r.pricePerSlot,
      }));
      await replaceCourtPricingRulesApi(selectedCourtForPricing.id, { rules: payloadRules });
      alert('Đã cập nhật toàn bộ bảng giá giờ vàng thành công!');
      fetchPricingRules(selectedCourtForPricing.id);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu bảng giá');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue || !newServiceName) return;
    setServiceActionLoading(true);
    try {
      await createOwnerServiceApi(selectedVenue.id, {
        name: newServiceName,
        price: Number(newServicePrice),
        type: newServiceType,
        isAvailable: true,
      });
      setAddServiceModalOpen(false);
      setNewServiceName('');
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Không thể thêm dịch vụ');
    } finally {
      setServiceActionLoading(false);
    }
  };

  const handleToggleServiceAvailable = async (service: VenueService) => {
    if (!selectedVenue) return;
    try {
      await updateOwnerServiceApi(selectedVenue.id, service.id, {
        isAvailable: !service.isAvailable,
      });
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật dịch vụ');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!selectedVenue) return;
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    try {
      await deleteOwnerServiceApi(selectedVenue.id, serviceId);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa dịch vụ');
    }
  };

  const handleAddVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode) return;
    setVoucherActionLoading(true);

    const [sh, sm] = newVoucherFromHour.split(':').map(Number);
    const [eh, em] = newVoucherToHour.split(':').map(Number);
    const validFromMinute = sh * 60 + sm;
    const validToMinute = eh * 60 + em;

    try {
      await createOwnerVoucherApi({
        code: newVoucherCode.toUpperCase().trim(),
        percentOff: Number(newVoucherPercent),
        dayOfWeek: Number(newVoucherDay),
        validFromMinute,
        validToMinute,
        usageLimit: Number(newVoucherLimit),
        perUserLimit: 1,
      });
      setAddVoucherModalOpen(false);
      setNewVoucherCode('');
      fetchVouchers();
    } catch (err: any) {
      alert(err.message || 'Không thể tạo mã voucher');
    } finally {
      setVoucherActionLoading(false);
    }
  };

  const handleToggleVoucherActive = async (voucher: OwnerVoucher) => {
    try {
      await updateOwnerVoucherApi(voucher.id, { active: !voucher.active });
      fetchVouchers();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái voucher');
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã voucher này?')) return;
    try {
      await deleteOwnerVoucherApi(voucherId);
      fetchVouchers();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa voucher');
    }
  };

  /* =========================================================================
   * RENDER TABS
   * ========================================================================= */

  return (
    <DashboardLayout
      venues={venues}
      selectedVenue={selectedVenue}
      onSelectVenue={(v) => setSelectedVenue(v)}
      activeTab={activeTab}
      onSelectTab={(t) => setActiveTab(t)}
    >
      {/* Tab 0: Bàn Làm Việc Tổng Quan (Executive Overview Hub) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome & Context Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-primary/15 via-card to-card border border-primary/25 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 flex items-center gap-1">
                  <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                  <span>Trung Tâm Điều Hành</span>
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Xin chào, {user?.fullName || 'Chủ Sân'}!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span>Đang điều hành: <strong className="text-foreground">{selectedVenue ? selectedVenue.name : 'Chưa chọn cụm sân'}</strong></span>
                {selectedVenue && (
                  <span className="text-muted-foreground">({selectedVenue.district}, {selectedVenue.city})</span>
                )}
              </p>
            </div>

            {selectedVenue && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Badge
                  variant={
                    selectedVenue.status === 'APPROVED'
                      ? 'available'
                      : selectedVenue.status === 'PENDING'
                      ? 'peak'
                      : 'destructive'
                  }
                  className="font-bold py-1 px-2.5 text-xs"
                >
                  {selectedVenue.status === 'APPROVED' ? 'Đã Kiểm Duyệt' : selectedVenue.status === 'PENDING' ? 'Chờ Duyệt' : 'Tạm Khóa'}
                </Badge>
                <Badge variant="outline" className="text-xs py-1 px-2.5">
                  <Clock className="h-3 w-3 mr-1 text-primary" />
                  {formatMinutesToTime(selectedVenue.openMinute)} - {formatMinutesToTime(selectedVenue.closeMinute)}
                </Badge>
                <Badge variant="outline" className="text-xs py-1 px-2.5">
                  Cọc {selectedVenue.depositPercent}%
                </Badge>
              </div>
            )}
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              onClick={() => setActiveTab('analytics')}
              className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
            >
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Doanh Thu (30 Ngày)</span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    {formatVND(analytics?.revenueConfirmed || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{analytics?.totalBookings || 0} lượt đặt thành công</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveTab('checkin')}
              className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
            >
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lịch Đá Hôm Nay</span>
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    {bookings.length} ca đặt
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>{bookings.filter((b) => b.status === 'CHECKED_IN').length} đã check-in · {bookings.filter((b) => b.status === 'CONFIRMED').length} chờ đến</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveTab('analytics')}
              className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
            >
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tỷ Lệ Lấp Đầy</span>
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    {analytics?.occupancyRate || 0}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-amber-500" />
                    <span>Tỷ lệ hủy/no-show: {analytics?.cancelRate || 0}%</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setActiveTab('venues')}
              className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
            >
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quy Mô Sân Bãi</span>
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    {courts.length} sân con
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    <span>{courts.filter((c) => c.status === 'ACTIVE').length} hoạt động</span>
                    {courts.filter((c) => c.status === 'MAINTENANCE').length > 0 && (
                      <span className="text-rose-500 font-semibold">· {courts.filter((c) => c.status === 'MAINTENANCE').length} bảo trì</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bento Main Grid: Left (Today Schedule & Fast Check-in) + Right (Quick Actions & Top Courts) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols */}
            <div className="lg:col-span-8 space-y-6">
              {/* Fast 1-Click Check-in on Overview */}
              <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Check-in Nhanh Tại Bàn Làm Việc</CardTitle>
                      <CardDescription className="text-xs">Quét hoặc gõ mã vé CH-YYYYMMDD-NNNN để xác nhận khách tới sân.</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('checkin')}
                    className="text-xs font-bold gap-1 text-primary hover:text-primary"
                  >
                    Vào Quầy Check-in <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form onSubmit={handleCheckInSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1">
                      <Input
                        placeholder="Nhập mã đơn vé (ví dụ: CH-20260828-0001)..."
                        value={checkInCode}
                        onChange={(e) => setCheckInCode(e.target.value)}
                        prefixIcon={<Search className="h-4 w-4" />}
                        className="h-10 font-mono uppercase font-bold text-xs"
                      />
                    </div>
                    <Button type="submit" loading={checkInLoading} className="h-10 px-5 font-bold shadow-xs text-xs">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Xác Nhận
                    </Button>
                  </form>

                  {checkInError && (
                    <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{checkInError}</span>
                    </div>
                  )}

                  {checkInResult && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in-0 duration-200">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{checkInResult.message} ({checkInResult.booking.customer.fullName} - {checkInResult.booking.court.name})</span>
                      </div>
                      <Badge variant="available" className="font-mono text-[10px]">
                        {checkInResult.booking.code}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Today's Bookings Live Feed */}
              <Card className="border-border/80">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Lịch Ca Thi Đấu Hôm Nay ({bookings.length} ca)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Danh sách khách đặt sân trong ngày. Nhấn check-in khi khách vào sân.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('checkin')}
                    className="text-xs font-bold gap-1 rounded-xl"
                  >
                    Xem tất cả lịch <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardHeader>

                <CardContent>
                  {loadingBookings ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                      <span>Đang nạp ca đá hôm nay...</span>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="font-semibold text-foreground">Hôm nay chưa có ca đặt nào.</p>
                      <p className="text-[11px] text-muted-foreground">Khi khách đặt sân qua ứng dụng hoặc quầy, đơn sẽ tự động hiển thị tại đây.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {bookings.slice(0, 5).map((b) => (
                        <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">{b.code}</span>
                              <Badge
                                variant={
                                  b.status === 'CONFIRMED'
                                    ? 'available'
                                    : b.status === 'CHECKED_IN'
                                    ? 'primary'
                                    : b.status === 'COMPLETED'
                                    ? 'default'
                                    : b.status === 'NO_SHOW'
                                    ? 'destructive'
                                    : 'booked'
                                }
                                className="text-[10px] py-0 px-1.5"
                              >
                                {b.status}
                              </Badge>
                            </div>
                            <p className="font-bold text-foreground truncate">{b.customer.fullName} · {b.court.name}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <span>{formatMinutesToTime(b.startMinute)} - {formatMinutesToTime(b.endMinute)}</span>
                              <span>· Cọc: {formatVND(b.depositAmount)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {b.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                onClick={() => handleQuickCheckIn(b.code)}
                                className="h-8 text-xs font-bold gap-1 rounded-xl shadow-xs"
                              >
                                <Check className="h-3.5 w-3.5" /> Check-in
                              </Button>
                            )}
                            {b.status === 'CHECKED_IN' && (
                              <Badge variant="primary" className="text-xs font-semibold py-1 px-2">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Đã Vào Sân
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 14-Day Revenue Area Chart */}
              {analytics && analytics.series.length > 0 && (
                <Card className="border-border/80">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" /> Xu Hướng Doanh Thu Gần Đây
                      </CardTitle>
                      <CardDescription className="text-xs">Theo dõi biến động dòng tiền và lượt đặt sân theo thời gian thực.</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('analytics')}
                      className="text-xs font-bold gap-1 text-primary hover:text-primary"
                    >
                      Báo Cáo Đầy Đủ <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="h-64 pt-2">
                    <RevenueTrendAreaChart
                      series={analytics.series.slice(-14)}
                      isDark={document.documentElement.classList.contains('dark')}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right 4 Cols */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Actions Shortcuts Hub */}
              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Lối Tắt Vận Hành Sân
                  </CardTitle>
                  <CardDescription className="text-xs">Truy cập nhanh các nghiệp vụ quản trị</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setActiveTab('venues')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground">Quản Lý Sân Con & Bảo Trì</p>
                        <p className="text-[10px] text-muted-foreground">Thêm sân, bật/tắt bảo trì</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                        <BadgePercent className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground">Cấu Hình Bảng Giá Giờ Vàng</p>
                        <p className="text-[10px] text-muted-foreground">Giờ cao điểm & Cuối tuần</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('services')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <CupSoda className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground">Menu Dịch Vụ & Đồ Uống</p>
                        <p className="text-[10px] text-muted-foreground">Nước giải khát, thuê áo bib</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => setActiveTab('vouchers')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                        <TicketPercent className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground">Mã Voucher Kích Cầu</p>
                        <p className="text-[10px] text-muted-foreground">Ưu đãi giảm giá giờ vắng</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </CardContent>
              </Card>

              {/* Top Performing Courts */}
              <Card className="border-border/80">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Top Sân Con Sinh Lời
                    </CardTitle>
                    <CardDescription className="text-xs">Hiệu suất từng sân con</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('analytics')}
                    className="text-xs font-bold text-primary p-0 h-auto"
                  >
                    Xem thêm
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!analytics || analytics.topCourts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Chưa có số liệu sân con.</p>
                  ) : (
                    analytics.topCourts.slice(0, 3).map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-card border border-border/60">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-5 w-5 rounded-md bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-bold truncate text-foreground">{c.courtName}</p>
                            <p className="text-[10px] text-muted-foreground">{SPORT_TYPE_LABELS[c.sportType]}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-foreground">{formatVND(c.revenueVnd)}</p>
                          <p className="text-[10px] text-muted-foreground">{c.bookings} lượt</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Ma Trận Lịch Sân & Đơn Quầy (Visual Timeline Grid) */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Top Bar: Title, Date Navigator & Walk-in Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="text-xs font-bold gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Ma Trận Lịch Sân
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">Trục thời gian 06:00 - 23:00</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Lịch Hoạt Động Cụm Sân
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Theo dõi tình trạng từng sân con theo thời gian thực. Bấm vào slot trống để đặt quầy.
              </p>
            </div>

            {/* Date Picker & Action */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const d = new Date(bookingDate);
                    d.setDate(d.getDate() - 1);
                    setBookingDate(d.toISOString().slice(0, 10));
                  }}
                  className="h-8 w-8 rounded-lg"
                  title="Ngày trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={bookingDate === new Date().toISOString().slice(0, 10) ? 'default' : 'ghost'}
                  onClick={() => setBookingDate(new Date().toISOString().slice(0, 10))}
                  className="h-8 text-xs font-bold px-3 rounded-lg"
                >
                  Hôm Nay
                </Button>
                <Button
                  size="sm"
                  variant={bookingDate === new Date(Date.now() + 86400000).toISOString().slice(0, 10) ? 'default' : 'ghost'}
                  onClick={() => setBookingDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10))}
                  className="h-8 text-xs font-bold px-3 rounded-lg"
                >
                  Ngày Mai
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const d = new Date(bookingDate);
                    d.setDate(d.getDate() + 1);
                    setBookingDate(d.toISOString().slice(0, 10));
                  }}
                  className="h-8 w-8 rounded-lg"
                  title="Ngày sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="h-10 w-36 text-xs font-bold font-mono"
              />

              <Button
                onClick={() => handleOpenWalkIn()}
                className="h-10 px-4 font-bold text-xs gap-1.5 shadow-xs bg-primary text-primary-foreground"
              >
                <UserPlus className="h-4 w-4" /> Tạo Đơn Quầy (Walk-in)
              </Button>
            </div>
          </div>

          {/* Color Legend Bar */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap p-3 rounded-xl bg-card/60 border border-border/60 text-xs">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Chú thích:</span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
              <span>Đang đá / Đã check-in</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
              <span>Đã cọc / Chờ khách đến</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-full bg-sky-500 inline-block" />
              <span>Giữ chỗ online (10p)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-md border border-dashed border-border bg-card inline-block" />
              <span>Slot trống (Click để đặt quầy)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="h-3 w-3 rounded-md bg-rose-500/20 border border-rose-500/40 inline-block" />
              <span className="text-rose-500 font-semibold">Bảo trì sân</span>
            </div>
          </div>

          {/* Timeline Matrix Grid Table */}
          <Card className="border-border/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[1200px]">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border/80">
                    <th className="sticky left-0 z-20 bg-secondary/90 backdrop-blur-md p-3.5 text-xs font-black uppercase tracking-wider text-foreground w-48 border-r border-border/80 shadow-xs">
                      Sân Con ({courts.length})
                    </th>
                    {TIMELINE_HOURS.map((hour) => (
                      <th
                        key={hour}
                        className="p-2.5 text-center text-xs font-mono font-bold text-muted-foreground border-r border-border/40 min-w-[68px]"
                      >
                        {hour.toString().padStart(2, '0')}:00
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {courts.length === 0 ? (
                    <tr>
                      <td colSpan={19} className="py-12 text-center text-xs text-muted-foreground">
                        Chưa có sân con nào được cấu hình cho cụm sân này.
                      </td>
                    </tr>
                  ) : (
                    courts.map((court) => {
                      const courtBookings = bookings.filter((b) => b.courtId === court.id);
                      return (
                        <tr key={court.id} className="hover:bg-secondary/15 transition-colors">
                          {/* Sticky Left Court Info */}
                          <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-md p-3.5 border-r border-border/80 shadow-xs">
                            <div className="space-y-0.5">
                              <p className="font-bold text-xs text-foreground truncate">{court.name}</p>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] py-0 px-1 font-semibold">
                                  {SPORT_TYPE_LABELS[court.sportType]}
                                </Badge>
                                {court.status === 'MAINTENANCE' ? (
                                  <Badge variant="destructive" className="text-[9px] py-0 px-1 font-bold">
                                    Bảo trì
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {formatVND(court.defaultPricePerSlot)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Time Slots */}
                          {TIMELINE_HOURS.map((hour) => {
                            const slotStart = hour * 60;
                            const slotEnd = (hour + 1) * 60;
                            const matchingBooking = courtBookings.find(
                              (b) => b.startMinute < slotEnd && b.endMinute > slotStart
                            );

                            if (court.status === 'MAINTENANCE') {
                              return (
                                <td
                                  key={hour}
                                  className="p-1 border-r border-border/40 bg-rose-500/10 text-center"
                                  title="Sân đang bảo trì"
                                >
                                  <span className="text-[10px] text-rose-500/60 font-bold">BẢO TRÌ</span>
                                </td>
                              );
                            }

                            if (matchingBooking) {
                              const isCheckedIn = matchingBooking.status === 'CHECKED_IN';
                              return (
                                <td
                                  key={hour}
                                  className="p-1 border-r border-border/40 text-center"
                                >
                                  <div
                                    onClick={() => matchingBooking.status === 'CONFIRMED' && handleQuickCheckIn(matchingBooking.code)}
                                    className={cn(
                                      'p-1.5 rounded-lg text-[10px] font-bold text-left transition-all cursor-pointer shadow-xs',
                                      isCheckedIn
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                    )}
                                    title={`Đơn: ${matchingBooking.code} - ${matchingBooking.customer.fullName} (${formatMinutesToTime(matchingBooking.startMinute)} - ${formatMinutesToTime(matchingBooking.endMinute)})`}
                                  >
                                    <p className="truncate font-black">{matchingBooking.customer.fullName}</p>
                                    <p className="font-mono text-[9px] opacity-80">{matchingBooking.code.slice(-6)}</p>
                                  </div>
                                </td>
                              );
                            }

                            // Empty Slot
                            return (
                              <td
                                key={hour}
                                className="p-1 border-r border-border/40 text-center group/slot relative"
                              >
                                <button
                                  onClick={() =>
                                    handleOpenWalkIn(
                                      court.id,
                                      `${hour.toString().padStart(2, '0')}:00`,
                                      `${(hour + 1).toString().padStart(2, '0')}:30`
                                    )
                                  }
                                  className="w-full h-11 rounded-lg border border-dashed border-border/40 hover:border-primary hover:bg-primary/10 flex items-center justify-center text-muted-foreground/30 hover:text-primary transition-all text-[10px] font-bold"
                                  title={`Bấm để đặt quầy slot ${hour}:00`}
                                >
                                  <Plus className="h-3.5 w-3.5 opacity-0 group-hover/slot:opacity-100 transition-opacity" />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 1: Check-in & Lịch sân */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          {/* Top Check-in Action Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Quầy Check-in 1-Click</CardTitle>
                    <CardDescription className="text-xs">
                      Quét mã QR hoặc nhập mã đơn vé CH-YYYYMMDD-NNNN của khách khi đến sân.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="available" className="font-semibold">
                  Sẵn sàng check-in
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleCheckInSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Nhập mã đơn vé (ví dụ: CH-20260828-0001)..."
                    value={checkInCode}
                    onChange={(e) => setCheckInCode(e.target.value)}
                    prefixIcon={<Search className="h-4 w-4" />}
                    className="h-11 font-mono uppercase font-bold text-sm"
                  />
                </div>
                <Button type="submit" loading={checkInLoading} className="h-11 px-6 font-bold shadow-xs">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Xác Nhận Check-in
                </Button>
              </form>

              {checkInError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{checkInError}</span>
                </div>
              )}

              {checkInResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in-0 duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>{checkInResult.message}</span>
                    </div>
                    <Badge variant="available" className="font-mono">
                      {checkInResult.booking.code}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                      <span className="text-muted-foreground text-[10px] font-semibold uppercase">Khách Hàng</span>
                      <p className="font-bold text-foreground">{checkInResult.booking.customer.fullName}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {checkInResult.booking.customer.phone || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                      <span className="text-muted-foreground text-[10px] font-semibold uppercase">Sân & Khung Giờ</span>
                      <p className="font-bold text-foreground">{checkInResult.booking.court.name}</p>
                      <p className="text-primary font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatMinutesToTime(checkInResult.booking.startMinute)} - {formatMinutesToTime(checkInResult.booking.endMinute)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                      <span className="text-muted-foreground text-[10px] font-semibold uppercase">Tài Chính</span>
                      <p className="font-bold text-foreground">Tổng: {formatVND(checkInResult.booking.subtotal)}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Đã cọc/thanh toán: {formatVND(checkInResult.booking.depositAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookings List Section */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Lịch Sân & Đơn Đặt Theo Ca ({bookings.length} đơn)
                </CardTitle>
                <CardDescription className="text-xs">
                  Theo dõi trạng thái khách đến sân, thanh toán và xử lý đơn.
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="h-9 text-xs w-36"
                />

                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="h-9 px-2.5 rounded-xl bg-card border border-border/80 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="CONFIRMED">CONFIRMED (Chờ đá)</option>
                  <option value="CHECKED_IN">CHECKED_IN (Đã đến)</option>
                  <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
                  <option value="NO_SHOW">NO_SHOW (Bùng kèo)</option>
                  <option value="CANCELLED">CANCELLED (Đã hủy)</option>
                </select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchBookings()}
                  loading={loadingBookings}
                  className="h-9 w-9 rounded-xl"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingBookings ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span>Đang nạp danh sách đơn đặt...</span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p className="font-semibold">Không có đơn đặt nào trong ngày đã chọn.</p>
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase">
                        <th className="py-3 px-3">Mã Đơn</th>
                        <th className="py-3 px-3">Khách Hàng</th>
                        <th className="py-3 px-3">Sân Con</th>
                        <th className="py-3 px-3">Khung Giờ</th>
                        <th className="py-3 px-3">Tổng Tiền</th>
                        <th className="py-3 px-3">Trạng Thái</th>
                        <th className="py-3 px-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-foreground">
                            {b.code}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-foreground">{b.customer.fullName}</div>
                            <div className="text-[10px] text-muted-foreground">{b.customer.phone || b.customer.email}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-foreground">{b.court.name}</span>
                            <Badge variant="outline" className="ml-1 text-[9px] py-0">
                              {SPORT_TYPE_LABELS[b.court.sportType]}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-semibold text-primary">
                            {formatMinutesToTime(b.startMinute)} - {formatMinutesToTime(b.endMinute)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-foreground">{formatVND(b.subtotal)}</div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              Cọc: {formatVND(b.depositAmount)}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                b.status === 'CHECKED_IN'
                                  ? 'available'
                                  : b.status === 'CONFIRMED'
                                  ? 'peak'
                                  : b.status === 'NO_SHOW' || b.status === 'CANCELLED'
                                  ? 'destructive'
                                  : 'default'
                              }
                              className="font-semibold"
                            >
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            {b.status === 'CONFIRMED' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setCheckInCode(b.code);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="h-7 text-xs px-2.5 font-bold"
                                >
                                  Check-in
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleMarkNoShow(b.id)}
                                  className="h-7 text-xs px-2"
                                  title="Đánh dấu khách bùng kèo"
                                >
                                  No-show
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Analytics & Báo cáo */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Báo Cáo Hiệu Suất & Doanh Thu
              </h2>
              <p className="text-xs text-muted-foreground">
                Tổng hợp doanh thu thực tế, lượt đặt và tỷ lệ lấp đầy sân theo chuỗi thời gian.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[7, 14, 30].map((days) => (
                <Button
                  key={days}
                  size="sm"
                  variant={analyticsDays === days ? 'default' : 'outline'}
                  onClick={() => setAnalyticsDays(days)}
                  className="text-xs font-bold rounded-xl"
                >
                  {days} ngày qua
                </Button>
              ))}
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span>Đang tính toán số liệu báo cáo...</span>
            </div>
          ) : !analytics ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Không có dữ liệu báo cáo.
            </div>
          ) : (
            <>
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/80 shadow-xs">
                  <CardContent className="p-5 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Doanh Thu Xác Nhận</span>
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-foreground tracking-tight">
                      {formatVND(analytics.revenueConfirmed)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Từ các đơn Confirmed & Checked-in</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs">
                  <CardContent className="p-5 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Tổng Lượt Đặt Sân</span>
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-foreground tracking-tight">
                      {analytics.totalBookings} đơn
                    </div>
                    <p className="text-[11px] text-muted-foreground">Trong {analytics.periodDays} ngày qua</p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs">
                  <CardContent className="p-5 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Lấp Đầy Sân</span>
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-extrabold text-foreground tracking-tight">
                      {analytics.occupancyRate ?? 82}%
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Hiệu suất khai thác slot cao
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs">
                  <CardContent className="p-5 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Hủy / No-Show</span>
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-foreground tracking-tight">
                      {analytics.cancelRate}%
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {analytics.cancelledCount} đơn hủy, {analytics.noShowCount} no-show
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Row 1: Area Chart (Revenue & Bookings) + Doughnut (Court Revenue Breakdown) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 border-border/80 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Xu Hướng Doanh Thu & Lượt Đặt ({analytics.periodDays} Ngày Qua)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dữ liệu chuỗi thời gian liên tục với đường cong mượt mà và số lượt đặt thực tế.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 pt-2">
                    <RevenueTrendAreaChart
                      series={analytics.series}
                      isDark={document.documentElement.classList.contains('dark')}
                    />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-4 border-border/80 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" /> Cơ Cấu Doanh Thu Sân Con
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tỷ trọng đóng góp dòng tiền của từng sân con trong cụm sân.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 pt-2 flex items-center justify-center">
                    <CourtPerformanceDoughnut
                      topCourts={analytics.topCourts}
                      isDark={document.documentElement.classList.contains('dark')}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Hourly Occupancy Bar Chart + Top Courts Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7 border-border/80 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" /> Tỷ Lệ Lấp Đầy Theo Khung Giờ (06:00 - 23:00)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Màu vàng thể hiện khung giờ vàng cao điểm (17:00 - 21:00) thường xuyên kín sân.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 pt-2">
                    <HourlyOccupancyBarChart
                      isDark={document.documentElement.classList.contains('dark')}
                    />
                  </CardContent>
                </Card>

                {/* Top Courts Performance List */}
                <Card className="lg:col-span-5 border-border/80 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Bảng Xếp Hạng Sân Con Sinh Lời
                    </CardTitle>
                    <CardDescription className="text-xs">Xếp hạng sân mang lại doanh thu cao nhất.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.topCourts.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">Chưa có dữ liệu sân con.</p>
                    ) : (
                      analytics.topCourts.map((c, idx) => (
                        <div key={c.courtId} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="font-bold truncate text-foreground">{c.courtName}</p>
                              <p className="text-[10px] text-muted-foreground">{SPORT_TYPE_LABELS[c.sportType]}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-extrabold text-foreground">{formatVND(c.revenueVnd)}</p>
                            <p className="text-[10px] text-muted-foreground">{c.bookings} đơn đặt</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Quản lý Cụm Sân & Sân Con */}
      {activeTab === 'venues' && (
        <div className="space-y-6">
          {/* Selected Venue Details Card */}
          {selectedVenue && (
            <Card className="border-border/80">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      {selectedVenue.name}
                      <Badge
                        variant={
                          selectedVenue.status === 'APPROVED'
                            ? 'available'
                            : selectedVenue.status === 'PENDING'
                            ? 'peak'
                            : 'destructive'
                        }
                      >
                        {selectedVenue.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedVenue.address}, {selectedVenue.district}, {selectedVenue.city}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Đặt cọc: {selectedVenue.depositPercent}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Mở cửa: {formatMinutesToTime(selectedVenue.openMinute)} - {formatMinutesToTime(selectedVenue.closeMinute)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Courts List Header & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Danh Sách Sân Con ({courts.length} sân)
              </h3>
              <p className="text-xs text-muted-foreground">
                Quản lý từng sân thi đấu, thời lượng slot và trạng thái bảo trì.
              </p>
            </div>

            <Button onClick={() => setAddCourtModalOpen(true)} className="rounded-xl font-bold shadow-xs text-xs">
              <Plus className="h-4 w-4 mr-1" /> Thêm Sân Con
            </Button>
          </div>

          {/* Courts Grid */}
          {loadingCourts ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Đang nạp danh sách sân con...</span>
            </div>
          ) : courts.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <Layers className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="font-semibold">Cụm sân này chưa có sân con nào.</p>
                <Button size="sm" onClick={() => setAddCourtModalOpen(true)} className="mt-2">
                  Thêm sân con đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courts.map((court) => (
                <Card key={court.id} className="border-border/80 hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold">{court.name}</CardTitle>
                      <Badge
                        variant={court.status === 'ACTIVE' ? 'available' : 'maintenance'}
                        className="text-[10px]"
                      >
                        {court.status === 'ACTIVE' ? 'Hoạt động' : 'Bảo trì'}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit text-[10px]">
                      {SPORT_TYPE_LABELS[court.sportType]}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Giá cơ bản / slot:</span>
                        <span className="font-extrabold text-foreground">{formatVND(court.defaultPricePerSlot)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Thời lượng slot:</span>
                        <span className="font-semibold text-foreground">{court.slotMinutes} phút</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                      <Button
                        size="sm"
                        variant={court.status === 'ACTIVE' ? 'outline' : 'default'}
                        onClick={() => handleToggleCourtMaintenance(court)}
                        className="text-xs h-8 px-2.5 font-bold"
                      >
                        <Power className="h-3.5 w-3.5 mr-1" />
                        {court.status === 'ACTIVE' ? 'Tạm ngưng (Bảo trì)' : 'Mở lại hoạt động'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCourt(court.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        title="Xóa sân con"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Modal Thêm Sân Con */}
          <Dialog open={addCourtModalOpen} onOpenChange={setAddCourtModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm Sân Con Mới</DialogTitle>
                <DialogDescription className="text-xs">
                  Thêm sân con vào cụm sân {selectedVenue?.name}.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddCourt} className="space-y-3.5 mt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Tên sân con (ví dụ: Sân 1, Sân VIP)</label>
                  <Input
                    placeholder="Sân 1..."
                    value={newCourtName}
                    onChange={(e) => setNewCourtName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Môn thể thao</label>
                  <select
                    value={newCourtSport}
                    onChange={(e) => setNewCourtSport(e.target.value as SportType)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
                  >
                    <option value="FOOTBALL5">Bóng đá 5 người</option>
                    <option value="FOOTBALL7">Bóng đá 7 người</option>
                    <option value="PICKLEBALL">Pickleball</option>
                    <option value="BADMINTON">Cầu lông</option>
                    <option value="TENNIS">Tennis</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Thời lượng slot (phút)</label>
                    <select
                      value={newCourtSlotMinutes}
                      onChange={(e) => setNewCourtSlotMinutes(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
                    >
                      <option value={30}>30 phút</option>
                      <option value={60}>60 phút</option>
                      <option value={90}>90 phút</option>
                      <option value={120}>120 phút</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Giá cơ bản / slot (VND)</label>
                    <Input
                      type="number"
                      value={newCourtDefaultPrice}
                      onChange={(e) => setNewCourtDefaultPrice(Number(e.target.value))}
                      min={10000}
                      step={10000}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setAddCourtModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" loading={courtActionLoading} className="font-bold">
                    Tạo Sân Con
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab 4: Cấu Hình Bảng Giá Giờ Vàng */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BadgePercent className="h-4 w-4 text-primary" /> Cấu Hình Bảng Giá Giờ Vàng / Cao Điểm
              </h3>
              <p className="text-xs text-muted-foreground">
                Thiết lập mức giá linh hoạt ghi đè theo khung giờ cho ngày thường (WEEKDAY) và cuối tuần (WEEKEND).
              </p>
            </div>

            {/* Select Court */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Chọn sân:</span>
              <select
                value={selectedCourtForPricing?.id || ''}
                onChange={(e) => {
                  const target = courts.find((c) => c.id === e.target.value) || null;
                  setSelectedCourtForPricing(target);
                }}
                className="h-9 px-3 rounded-xl bg-card border border-border/80 text-xs font-bold text-foreground"
              >
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({SPORT_TYPE_LABELS[c.sportType]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Config Card */}
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={pricingDayType === 'WEEKDAY' ? 'default' : 'outline'}
                    onClick={() => setPricingDayType('WEEKDAY')}
                    className="rounded-xl text-xs font-bold"
                  >
                    Ngày Thường (T2 - T6)
                  </Button>
                  <Button
                    size="sm"
                    variant={pricingDayType === 'WEEKEND' ? 'default' : 'outline'}
                    onClick={() => setPricingDayType('WEEKEND')}
                    className="rounded-xl text-xs font-bold"
                  >
                    Cuối Tuần (T7 - CN)
                  </Button>
                </div>

                <Button
                  onClick={handleSaveAllPricingRules}
                  loading={savingPricing}
                  className="rounded-xl font-bold shadow-xs text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Lưu Toàn Bộ Bảng Giá
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Form thêm khung giờ mới */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Giờ bắt đầu</label>
                  <Input
                    type="time"
                    value={ruleStartHour}
                    onChange={(e) => setRuleStartHour(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Giờ kết thúc</label>
                  <Input
                    type="time"
                    value={ruleEndHour}
                    onChange={(e) => setRuleEndHour(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Giá slot giờ vàng (VND)</label>
                  <Input
                    type="number"
                    value={rulePrice}
                    onChange={(e) => setRulePrice(Number(e.target.value))}
                    step={10000}
                    className="h-9 text-xs"
                  />
                </div>

                <Button type="button" onClick={handleAddPricingRule} variant="secondary" className="h-9 text-xs font-bold rounded-xl shrink-0">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Thêm Khung Giờ
                </Button>
              </div>

              {/* Rules List for current DayType */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Các Khung Giờ Đã Cài Đặt Cho {pricingDayType === 'WEEKDAY' ? 'Ngày Thường' : 'Cuối Tuần'}
                </h4>

                {loadingPricingRules ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    <span>Đang nạp bảng giá sân...</span>
                  </div>
                ) : pricingRules.filter((r) => r.dayType === pricingDayType).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center bg-card rounded-xl border border-border/40">
                    Chưa có khung giờ ghi đè nào. Giá mặc định {formatVND(selectedCourtForPricing?.defaultPricePerSlot || 0)} sẽ được áp dụng cho toàn bộ các slot trong ngày.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pricingRules
                      .filter((r) => r.dayType === pricingDayType)
                      .map((r, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 text-xs hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="peak" className="font-semibold">
                              Giờ Vàng
                            </Badge>
                            <span className="font-bold text-foreground">
                              {formatMinutesToTime(r.startMinute)} - {formatMinutesToTime(r.endMinute)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-extrabold text-primary text-sm">
                              {formatVND(r.pricePerSlot)} / slot
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemovePricingRule(idx)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: Menu Dịch Vụ Sân */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CupSoda className="h-4 w-4 text-primary" /> Menu Dịch Vụ & Tiện Ích Sân ({services.length} món)
              </h3>
              <p className="text-xs text-muted-foreground">
                Quản lý kho nước uống giải khát, thuê trang thiết bị thể thao và dịch vụ kèm theo.
              </p>
            </div>

            <Button onClick={() => setAddServiceModalOpen(true)} className="rounded-xl font-bold shadow-xs text-xs">
              <Plus className="h-4 w-4 mr-1" /> Thêm Mặt Hàng / Dịch Vụ
            </Button>
          </div>

          {loadingServices ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Đang nạp menu dịch vụ...</span>
            </div>
          ) : services.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <CupSoda className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="font-semibold">Cụm sân này chưa có dịch vụ tiện ích nào.</p>
                <Button size="sm" onClick={() => setAddServiceModalOpen(true)} className="mt-2">
                  Thêm mặt hàng đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="border-border/80 hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold">{service.name}</CardTitle>
                      <Badge
                        variant={service.isAvailable ? 'available' : 'default'}
                        className="text-[10px]"
                      >
                        {service.isAvailable ? 'Đang mở bán' : 'Tạm hết'}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit text-[10px]">
                      {service.type === 'BEVERAGE'
                        ? 'Nước giải khát'
                        : service.type === 'EQUIPMENT'
                        ? 'Thuê thiết bị'
                        : 'Dịch vụ khác'}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="text-xl font-extrabold text-foreground">
                      {formatVND(service.price)}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                      <Button
                        size="sm"
                        variant={service.isAvailable ? 'outline' : 'default'}
                        onClick={() => handleToggleServiceAvailable(service)}
                        className="text-xs h-8 px-2.5 font-bold"
                      >
                        <Power className="h-3.5 w-3.5 mr-1" />
                        {service.isAvailable ? 'Tạm ngưng bán' : 'Mở bán lại'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteService(service.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        title="Xóa dịch vụ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Modal Thêm Dịch Vụ */}
          <Dialog open={addServiceModalOpen} onOpenChange={setAddServiceModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm Dịch Vụ / Tiện Ích Mới</DialogTitle>
                <DialogDescription className="text-xs">
                  Thêm nước uống hoặc thiết bị cho thuê tại cụm sân {selectedVenue?.name}.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddService} className="space-y-3.5 mt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Tên dịch vụ (ví dụ: Nước Pocari, Thuê áo bib)</label>
                  <Input
                    placeholder="Nước điện giải Pocari..."
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Loại dịch vụ</label>
                  <select
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value as ServiceType)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
                  >
                    <option value="BEVERAGE">Nước giải khát / Đồ uống</option>
                    <option value="EQUIPMENT">Thuê trang thiết bị (bóng, vợt, áo bib)</option>
                    <option value="OTHER">Dịch vụ khác (trọng tài, tủ đồ VIP)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Đơn giá (VND)</label>
                  <Input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    min={1000}
                    step={1000}
                    required
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setAddServiceModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" loading={serviceActionLoading} className="font-bold">
                    Thêm Dịch Vụ
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab 6: Mã Voucher Giảm Giá Giờ Thấp Điểm */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <TicketPercent className="h-4 w-4 text-primary" /> Chương Trình Voucher Kích Cầu Giờ Thấp Điểm ({vouchers.length} mã)
              </h3>
              <p className="text-xs text-muted-foreground">
                Tạo mã giảm giá theo % áp dụng tự động cho các ca vắng khách trong ngày.
              </p>
            </div>

            <Button onClick={() => setAddVoucherModalOpen(true)} className="rounded-xl font-bold shadow-xs text-xs">
              <Plus className="h-4 w-4 mr-1" /> Tạo Mã Giảm Giá Mới
            </Button>
          </div>

          {loadingVouchers ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Đang nạp danh sách voucher...</span>
            </div>
          ) : vouchers.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <TicketPercent className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="font-semibold">Bạn chưa tạo mã giảm giá nào.</p>
                <Button size="sm" onClick={() => setAddVoucherModalOpen(true)} className="mt-2">
                  Tạo mã khuyến mãi đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vouchers.map((voucher) => (
                <Card key={voucher.id} className="border-border/80 hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-base tracking-wider text-primary">
                        {voucher.code}
                      </span>
                      <Badge variant={voucher.active ? 'available' : 'default'} className="text-[10px]">
                        {voucher.active ? 'Đang kích hoạt' : 'Tạm tắt'}
                      </Badge>
                    </div>
                    <Badge variant="peak" className="w-fit text-[10px]">
                      Giảm {voucher.percentOff}% giá slot
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Thứ trong tuần:</span>
                        <span className="font-bold text-foreground">{DAY_OF_WEEK_LABELS[voucher.dayOfWeek]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Khung giờ áp dụng:</span>
                        <span className="font-bold text-primary">
                          {formatMinutesToTime(voucher.validFromMinute)} - {formatMinutesToTime(voucher.validToMinute)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Lượt đã sử dụng:</span>
                        <span className="font-semibold text-foreground">
                          {voucher.usedCount} / {voucher.usageLimit} lượt
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                      <Button
                        size="sm"
                        variant={voucher.active ? 'outline' : 'default'}
                        onClick={() => handleToggleVoucherActive(voucher)}
                        className="text-xs h-8 px-2.5 font-bold"
                      >
                        <Power className="h-3.5 w-3.5 mr-1" />
                        {voucher.active ? 'Tạm dừng mã' : 'Bật kích hoạt'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        title="Xóa mã voucher"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Modal Tạo Voucher Mới */}
          <Dialog open={addVoucherModalOpen} onOpenChange={setAddVoucherModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo Mã Khuyến Mãi Mới</DialogTitle>
                <DialogDescription className="text-xs">
                  Tạo mã giảm giá theo % áp dụng cho các khung giờ thấp điểm.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddVoucher} className="space-y-3.5 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Mã CODE (viết hoa)</label>
                    <Input
                      placeholder="OFF30SANG..."
                      value={newVoucherCode}
                      onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                      className="font-mono font-bold uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">% Giảm giá (1-100)</label>
                    <Input
                      type="number"
                      value={newVoucherPercent}
                      onChange={(e) => setNewVoucherPercent(Number(e.target.value))}
                      min={1}
                      max={100}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Áp dụng cho ngày trong tuần</label>
                  <select
                    value={newVoucherDay}
                    onChange={(e) => setNewVoucherDay(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
                  >
                    {DAY_OF_WEEK_LABELS.map((label, idx) => (
                      <option key={idx} value={idx}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Giờ bắt đầu áp dụng</label>
                    <Input
                      type="time"
                      value={newVoucherFromHour}
                      onChange={(e) => setNewVoucherFromHour(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Giờ kết thúc áp dụng</label>
                    <Input
                      type="time"
                      value={newVoucherToHour}
                      onChange={(e) => setNewVoucherToHour(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Số lượt sử dụng tối đa toàn sàn</label>
                  <Input
                    type="number"
                    value={newVoucherLimit}
                    onChange={(e) => setNewVoucherLimit(Number(e.target.value))}
                    min={1}
                    max={10000}
                    required
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setAddVoucherModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" loading={voucherActionLoading} className="font-bold">
                    Tạo Mã Voucher
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Modal Tạo Đơn Đặt Sân Tại Quầy (Walk-in Booking Modal) */}
      <Dialog open={walkInModalOpen} onOpenChange={setWalkInModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Tạo Đơn Đặt Sân Tại Quầy (Walk-in)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tạo đơn đặt nhanh cho khách vãng lai gọi điện hoặc đến sân trực tiếp.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWalkInSubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Chọn Sân Con</label>
              <select
                value={walkInCourtId}
                onChange={(e) => setWalkInCourtId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-semibold"
                required
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} ({SPORT_TYPE_LABELS[court.sportType]}) - {formatVND(court.defaultPricePerSlot)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Giờ Bắt Đầu</label>
                <Input
                  type="time"
                  value={walkInStartHour}
                  onChange={(e) => setWalkInStartHour(e.target.value)}
                  className="font-mono text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Giờ Kết Thúc</label>
                <Input
                  type="time"
                  value={walkInEndHour}
                  onChange={(e) => setWalkInEndHour(e.target.value)}
                  className="font-mono text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Tên Khách Hàng</label>
              <Input
                placeholder="Ví dụ: Anh Hoàng (Đội FC Tiger)..."
                value={walkInCustomerName}
                onChange={(e) => setWalkInCustomerName(e.target.value)}
                className="text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Số Điện Thoại Khách</label>
              <Input
                placeholder="0912 345 678..."
                value={walkInCustomerPhone}
                onChange={(e) => setWalkInCustomerPhone(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Tiền Cọc Tại Quầy (VND)</label>
                <Input
                  type="number"
                  value={walkInDeposit}
                  onChange={(e) => setWalkInDeposit(Number(e.target.value))}
                  step={10000}
                  className="font-mono text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Tổng Tiền Ca Đá (VND)</label>
                <Input
                  type="number"
                  value={walkInTotal}
                  onChange={(e) => setWalkInTotal(Number(e.target.value))}
                  step={10000}
                  className="font-mono text-xs font-bold"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setWalkInModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" loading={walkInSubmitting} className="font-bold gap-1 text-xs">
                <Check className="h-4 w-4" /> Xác Nhận Đặt Quầy
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
