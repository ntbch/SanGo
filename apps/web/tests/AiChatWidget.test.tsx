import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AiChatWidget } from '../src/components/ai/ai-chat-widget';

describe('AI Chat Floating Widget', () => {
  beforeEach(() => {
    // Ensure fresh state
    window.HTMLElement.prototype.scrollIntoView = () => {};
  });

  it('renders floating trigger button and opens AI chat drawer on click', async () => {
    render(
      <MemoryRouter>
        <AiChatWidget />
      </MemoryRouter>,
    );

    // Initial floating round button
    const triggerBtn = screen.getByRole('button', { name: /Mở Trợ Lý AI Đặt Sân/i });
    expect(triggerBtn).toBeDefined();

    // Click trigger to open
    fireEvent.click(triggerBtn);

    // Header and assistant greetings should be visible
    expect(screen.getAllByText(/SanGo AI Assistant/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Hỏi AI tìm sân, gợi ý giờ vàng/i)).toBeDefined();

    // Verify quick prompts
    expect(screen.getByRole('button', { name: /Tìm sân bóng đá 7 người tối nay ở Cầu Giấy/i })).toBeDefined();

    // Click quick prompt to send message
    const promptBtn = screen.getByRole('button', { name: /Tìm sân bóng đá 7 người tối nay ở Cầu Giấy/i });
    fireEvent.click(promptBtn);

    // User message should appear in chat
    await waitFor(() => {
      expect(screen.getByText(/Tìm sân bóng đá 7 người tối nay ở Cầu Giấy/i)).toBeDefined();
    });
  });
});
