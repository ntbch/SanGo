import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { Calendar, Compass, Home, MapPin, Swords } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AiChatWidget } from '../ai/ai-chat-widget';

export function PublicLayout(): React.ReactElement {
  const location = useLocation();

  // Ẩn hoàn toàn Navbar, Footer và Mobile Bottom Nav trên các trang Auth
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
  );

  const bottomNavItems = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/venues', label: 'Tìm sân', icon: Compass },
    { to: '/map', label: 'Bản đồ', icon: MapPin },
    { to: '/matches', label: 'Ghép trận', icon: Swords },
    { to: '/bookings', label: 'Đơn sân', icon: Calendar },
  ];

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <main className="flex-1 w-full flex items-center justify-center">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 relative">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />

      {/* Floating AI Sports Assistant Widget */}
      <AiChatWidget />

      {/* Mobile Bottom Navigation Bar with Safe Area Insets */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-card/95 backdrop-blur-xl px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-lg"
      >
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-colors gap-0.5 min-w-[54px]',
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
