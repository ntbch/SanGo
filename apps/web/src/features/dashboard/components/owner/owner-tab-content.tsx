import React from 'react';
import { OwnerOverviewTab } from './owner-overview-tab';
import { OwnerScheduleTab } from './owner-schedule-tab';
import { OwnerBookingsTab } from './owner-bookings-tab';
import { OwnerAnalyticsTab } from './owner-analytics-tab';
import { OwnerCourtsTab } from './owner-courts-tab';
import { OwnerPricingTab } from './owner-pricing-tab';
import { OwnerServicesTab } from './owner-services-tab';
import { OwnerVouchersTab } from './owner-vouchers-tab';
import { useOwnerDashboard } from '../../hooks/use-owner-dashboard';

interface OwnerTabContentProps {
  dashboard: ReturnType<typeof useOwnerDashboard>;
}

export function OwnerTabContent({ dashboard: d }: OwnerTabContentProps): React.ReactElement | null {
  switch (d.activeTab) {
    case 'overview':
      return (
        <OwnerOverviewTab
          selectedVenue={d.selectedVenue}
          analytics={d.analytics}
          bookings={d.bookings}
          courts={d.courts}
          loadingBookings={d.loadingBookings}
          checkInCode={d.checkInCode}
          setCheckInCode={d.setCheckInCode}
          checkInLoading={d.checkInLoading}
          checkInError={d.checkInError}
          checkInResult={d.checkInResult}
          onCheckInSubmit={d.handleCheckInSubmit}
          onQuickCheckIn={d.handleQuickCheckIn}
          onNavigateTab={(tab) => d.setActiveTab(tab)}
        />
      );

    case 'schedule':
      return (
        <OwnerScheduleTab
          courts={d.courts}
          bookings={d.bookings}
          bookingDate={d.bookingDate}
          setBookingDate={d.setBookingDate}
          onOpenWalkIn={d.handleOpenWalkIn}
          onQuickCheckIn={d.handleQuickCheckIn}
        />
      );

    case 'checkin':
      return (
        <OwnerBookingsTab
          bookings={d.bookings}
          loadingBookings={d.loadingBookings}
          bookingDate={d.bookingDate}
          setBookingDate={d.setBookingDate}
          bookingStatusFilter={d.bookingStatusFilter}
          setBookingStatusFilter={d.setBookingStatusFilter}
          checkInCode={d.checkInCode}
          setCheckInCode={d.setCheckInCode}
          checkInLoading={d.checkInLoading}
          checkInError={d.checkInError}
          checkInResult={d.checkInResult}
          onCheckInSubmit={d.handleCheckInSubmit}
          onRefreshBookings={() => d.fetchBookings()}
          onMarkNoShow={d.handleMarkNoShow}
        />
      );

    case 'analytics':
      return (
        <OwnerAnalyticsTab
          analytics={d.analytics}
          loadingAnalytics={d.loadingAnalytics}
          analyticsDays={d.analyticsDays}
          setAnalyticsDays={d.setAnalyticsDays}
        />
      );

    case 'venues':
      return (
        <OwnerCourtsTab
          selectedVenue={d.selectedVenue}
          courts={d.courts}
          loadingCourts={d.loadingCourts}
          addCourtModalOpen={d.addCourtModalOpen}
          setAddCourtModalOpen={d.setAddCourtModalOpen}
          newCourtName={d.newCourtName}
          setNewCourtName={d.setNewCourtName}
          newCourtSport={d.newCourtSport}
          setNewCourtSport={d.setNewCourtSport}
          newCourtSlotMinutes={d.newCourtSlotMinutes}
          setNewCourtSlotMinutes={d.setNewCourtSlotMinutes}
          newCourtDefaultPrice={d.newCourtDefaultPrice}
          setNewCourtDefaultPrice={d.setNewCourtDefaultPrice}
          courtActionLoading={d.courtActionLoading}
          onAddCourt={d.handleAddCourt}
          onToggleCourtMaintenance={d.handleToggleCourtMaintenance}
          onDeleteCourt={d.handleDeleteCourt}
        />
      );

    case 'pricing':
      return (
        <OwnerPricingTab
          courts={d.courts}
          selectedCourtForPricing={d.selectedCourtForPricing}
          setSelectedCourtForPricing={d.setSelectedCourtForPricing}
          pricingDayType={d.pricingDayType}
          setPricingDayType={d.setPricingDayType}
          pricingRules={d.pricingRules}
          loadingPricingRules={d.loadingPricingRules}
          ruleStartHour={d.ruleStartHour}
          setRuleStartHour={d.setRuleStartHour}
          ruleEndHour={d.ruleEndHour}
          setRuleEndHour={d.setRuleEndHour}
          rulePrice={d.rulePrice}
          setRulePrice={d.setRulePrice}
          savingPricing={d.savingPricing}
          onAddPricingRule={d.handleAddPricingRule}
          onRemovePricingRule={d.handleRemovePricingRule}
          onSaveAllPricingRules={d.handleSaveAllPricingRules}
        />
      );

    case 'services':
      return (
        <OwnerServicesTab
          selectedVenue={d.selectedVenue}
          services={d.services}
          loadingServices={d.loadingServices}
          addServiceModalOpen={d.addServiceModalOpen}
          setAddServiceModalOpen={d.setAddServiceModalOpen}
          newServiceName={d.newServiceName}
          setNewServiceName={d.setNewServiceName}
          newServicePrice={d.newServicePrice}
          setNewServicePrice={d.setNewServicePrice}
          newServiceType={d.newServiceType}
          setNewServiceType={d.setNewServiceType}
          serviceActionLoading={d.serviceActionLoading}
          onAddService={d.handleAddService}
          onToggleServiceAvailable={d.handleToggleServiceAvailable}
          onDeleteService={d.handleDeleteService}
        />
      );

    case 'vouchers':
      return (
        <OwnerVouchersTab
          vouchers={d.vouchers}
          loadingVouchers={d.loadingVouchers}
          addVoucherModalOpen={d.addVoucherModalOpen}
          setAddVoucherModalOpen={d.setAddVoucherModalOpen}
          newVoucherCode={d.newVoucherCode}
          setNewVoucherCode={d.setNewVoucherCode}
          newVoucherPercent={d.newVoucherPercent}
          setNewVoucherPercent={d.setNewVoucherPercent}
          newVoucherDay={d.newVoucherDay}
          setNewVoucherDay={d.setNewVoucherDay}
          newVoucherFromHour={d.newVoucherFromHour}
          setNewVoucherFromHour={d.setNewVoucherFromHour}
          newVoucherToHour={d.newVoucherToHour}
          setNewVoucherToHour={d.setNewVoucherToHour}
          newVoucherLimit={d.newVoucherLimit}
          setNewVoucherLimit={d.setNewVoucherLimit}
          voucherActionLoading={d.voucherActionLoading}
          onAddVoucher={d.handleAddVoucher}
          onToggleVoucherActive={d.handleToggleVoucherActive}
          onDeleteVoucher={d.handleDeleteVoucher}
        />
      );

    default:
      return null;
  }
}
