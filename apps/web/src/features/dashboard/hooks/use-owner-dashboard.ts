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

export function useOwnerDashboard() {
  // Navigation & Hierarchy State
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<OwnerVenue | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Bookings & Check-in State
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{ message: string; booking: OwnerBookingItem } | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');
  const [bookings, setBookings] = useState<OwnerBookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Walk-in Modal State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInCourtId, setWalkInCourtId] = useState('');
  const [walkInStartHour, setWalkInStartHour] = useState('17:00');
  const [walkInEndHour, setWalkInEndHour] = useState('18:30');
  const [walkInCustomerName, setWalkInCustomerName] = useState('');
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState('');
  const [walkInDeposit, setWalkInDeposit] = useState(100000);
  const [walkInTotal, setWalkInTotal] = useState(300000);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  // Analytics State
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [analytics, setAnalytics] = useState<OwnerAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Courts State
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [addCourtModalOpen, setAddCourtModalOpen] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtSport, setNewCourtSport] = useState<SportType>('FOOTBALL5');
  const [newCourtSlotMinutes, setNewCourtSlotMinutes] = useState(60);
  const [newCourtDefaultPrice, setNewCourtDefaultPrice] = useState(250000);
  const [courtActionLoading, setCourtActionLoading] = useState(false);

  // Pricing Rules State
  const [selectedCourtForPricing, setSelectedCourtForPricing] = useState<Court | null>(null);
  const [pricingDayType, setPricingDayType] = useState<DayType>('WEEKDAY');
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingPricingRules, setLoadingPricingRules] = useState(false);
  const [ruleStartHour, setRuleStartHour] = useState('17:00');
  const [ruleEndHour, setRuleEndHour] = useState('22:00');
  const [rulePrice, setRulePrice] = useState(350000);
  const [savingPricing, setSavingPricing] = useState(false);

  // Services State
  const [services, setServices] = useState<VenueService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(20000);
  const [newServiceType, setNewServiceType] = useState<ServiceType>('BEVERAGE');
  const [serviceActionLoading, setServiceActionLoading] = useState(false);

  // Vouchers State
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
   * ACTION HANDLERS
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
      fetchBookings();
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

  return {
    venues,
    selectedVenue,
    setSelectedVenue,
    activeTab,
    setActiveTab,
    checkInCode,
    setCheckInCode,
    checkInLoading,
    checkInResult,
    checkInError,
    bookingDate,
    setBookingDate,
    bookingStatusFilter,
    setBookingStatusFilter,
    bookings,
    loadingBookings,
    walkInModalOpen,
    setWalkInModalOpen,
    walkInCourtId,
    setWalkInCourtId,
    walkInStartHour,
    setWalkInStartHour,
    walkInEndHour,
    setWalkInEndHour,
    walkInCustomerName,
    setWalkInCustomerName,
    walkInCustomerPhone,
    setWalkInCustomerPhone,
    walkInDeposit,
    setWalkInDeposit,
    walkInTotal,
    setWalkInTotal,
    walkInSubmitting,
    analyticsDays,
    setAnalyticsDays,
    analytics,
    loadingAnalytics,
    courts,
    loadingCourts,
    addCourtModalOpen,
    setAddCourtModalOpen,
    newCourtName,
    setNewCourtName,
    newCourtSport,
    setNewCourtSport,
    newCourtSlotMinutes,
    setNewCourtSlotMinutes,
    newCourtDefaultPrice,
    setNewCourtDefaultPrice,
    courtActionLoading,
    selectedCourtForPricing,
    setSelectedCourtForPricing,
    pricingDayType,
    setPricingDayType,
    pricingRules,
    loadingPricingRules,
    ruleStartHour,
    setRuleStartHour,
    ruleEndHour,
    setRuleEndHour,
    rulePrice,
    setRulePrice,
    savingPricing,
    services,
    loadingServices,
    addServiceModalOpen,
    setAddServiceModalOpen,
    newServiceName,
    setNewServiceName,
    newServicePrice,
    setNewServicePrice,
    newServiceType,
    setNewServiceType,
    serviceActionLoading,
    vouchers,
    loadingVouchers,
    addVoucherModalOpen,
    setAddVoucherModalOpen,
    newVoucherCode,
    setNewVoucherCode,
    newVoucherPercent,
    setNewVoucherPercent,
    newVoucherDay,
    setNewVoucherDay,
    newVoucherFromHour,
    setNewVoucherFromHour,
    newVoucherToHour,
    setNewVoucherToHour,
    newVoucherLimit,
    setNewVoucherLimit,
    voucherActionLoading,
    fetchBookings,
    handleCheckInSubmit,
    handleQuickCheckIn,
    handleOpenWalkIn,
    handleWalkInSubmit,
    handleMarkNoShow,
    handleAddCourt,
    handleToggleCourtMaintenance,
    handleDeleteCourt,
    handleAddPricingRule,
    handleRemovePricingRule,
    handleSaveAllPricingRules,
    handleAddService,
    handleToggleServiceAvailable,
    handleDeleteService,
    handleAddVoucher,
    handleToggleVoucherActive,
    handleDeleteVoucher,
  };
}
