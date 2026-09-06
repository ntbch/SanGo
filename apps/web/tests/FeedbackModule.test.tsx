import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../src/components/feedback/empty-state';
import { ErrorState } from '../src/components/feedback/error-state';
import {
  VenueCardSkeleton,
  SlotMatrixSkeleton,
  TicketPassSkeleton,
} from '../src/components/feedback/layout-skeletons';

describe('Centralized Feedback Module', () => {
  describe('EmptyState', () => {
    it('renders EmptyState with 3-line formula and triggers action', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Không tìm thấy cụm sân nào"
          description="Không có sân nào phù hợp với bộ lọc hiện tại. Hãy thử chọn môn thể thao khác hoặc nới rộng cự ly tìm kiếm."
          actionLabel="Đặt lại bộ lọc"
          onAction={handleAction}
        />
      );

      expect(
        screen.getByRole('heading', { level: 3, name: 'Không tìm thấy cụm sân nào' })
      ).toBeDefined();
      expect(
        screen.getByText(/Không có sân nào phù hợp với bộ lọc hiện tại/)
      ).toBeDefined();
      const btn = screen.getByRole('button', { name: 'Đặt lại bộ lọc' });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders secondary action button when provided', () => {
      const handlePrimary = vi.fn();
      const handleSecondary = vi.fn();
      render(
        <EmptyState
          title="Chưa có đặt chỗ nào"
          description="Bạn chưa có lịch đặt sân nào sắp diễn ra. Khám phá các sân gần bạn để đặt lịch ngay."
          actionLabel="Tìm sân ngay"
          onAction={handlePrimary}
          secondaryActionLabel="Lịch sử đặt sân"
          onSecondaryAction={handleSecondary}
        />
      );

      const secBtn = screen.getByRole('button', { name: 'Lịch sử đặt sân' });
      fireEvent.click(secBtn);
      expect(handleSecondary).toHaveBeenCalledTimes(1);
    });

    it('renders without action buttons if not provided', () => {
      render(
        <EmptyState
          title="Không có dữ liệu"
          description="Hiện tại chưa có thông tin cần hiển thị."
        />
      );

      expect(
        screen.getByRole('heading', { level: 3, name: 'Không có dữ liệu' })
      ).toBeDefined();
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('ErrorState', () => {
    it('renders ErrorState with humanized text and retry button', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Không thể tải danh sách sân"
          message="Hệ thống máy chủ đang bận xử lý hoặc kết nối mạng bị gián đoạn."
          onRetry={handleRetry}
        />
      );

      expect(screen.getByRole('alert')).toBeDefined();
      expect(
        screen.getByRole('heading', { level: 3, name: 'Không thể tải danh sách sân' })
      ).toBeDefined();
      expect(
        screen.getByText(/Hệ thống máy chủ đang bận xử lý/)
      ).toBeDefined();
      const retryBtn = screen.getByRole('button', { name: 'Thử lại ngay' });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders default fallback copy when no props provided', () => {
      render(<ErrorState />);
      expect(
        screen.getByRole('heading', { level: 3, name: 'Đã có lỗi xảy ra' })
      ).toBeDefined();
      expect(
        screen.getByText(/Không thể tải được dữ liệu vào lúc này/)
      ).toBeDefined();
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('Layout Skeletons', () => {
    it('renders VenueCardSkeleton with horizontal 4:3 image and text lines', () => {
      const { container } = render(<VenueCardSkeleton />);
      expect(container.querySelector('.aspect-\\[4\\/3\\]')).not.toBeNull();
    });

    it('renders SlotMatrixSkeleton with shift tabs and slot grid', () => {
      const { container } = render(<SlotMatrixSkeleton />);
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(5);
    });

    it('renders TicketPassSkeleton with passbook layout', () => {
      const { container } = render(<TicketPassSkeleton />);
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(4);
    });
  });
});
