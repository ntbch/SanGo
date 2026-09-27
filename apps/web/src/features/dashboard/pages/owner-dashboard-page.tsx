import React from 'react';
import { DashboardLayout } from '../layouts/dashboard-layout';
import { OwnerTabContent } from '../components/owner/owner-tab-content';
import { OwnerWalkInModal } from '../components/owner/owner-walkin-modal';
import { useOwnerDashboard } from '../hooks/use-owner-dashboard';

export function OwnerDashboardPage(): React.ReactElement {
  const d = useOwnerDashboard();

  return (
    <DashboardLayout
      venues={d.venues}
      selectedVenue={d.selectedVenue}
      onSelectVenue={(v) => d.setSelectedVenue(v)}
      activeTab={d.activeTab}
      onSelectTab={(tab: string) => d.setActiveTab(tab)}
    >
      <OwnerTabContent dashboard={d} />

      {/* Modal Tạo Đơn Đặt Sân Tại Quầy (Walk-in) */}
      <OwnerWalkInModal
        walkInModalOpen={d.walkInModalOpen}
        setWalkInModalOpen={d.setWalkInModalOpen}
        courts={d.courts}
        walkInCourtId={d.walkInCourtId}
        setWalkInCourtId={d.setWalkInCourtId}
        walkInStartHour={d.walkInStartHour}
        setWalkInStartHour={d.setWalkInStartHour}
        walkInEndHour={d.walkInEndHour}
        setWalkInEndHour={d.setWalkInEndHour}
        walkInCustomerName={d.walkInCustomerName}
        setWalkInCustomerName={d.setWalkInCustomerName}
        walkInCustomerPhone={d.walkInCustomerPhone}
        setWalkInCustomerPhone={d.setWalkInCustomerPhone}
        walkInSubmitting={d.walkInSubmitting}
        onWalkInSubmit={d.handleWalkInSubmit}
      />
    </DashboardLayout>
  );
}
