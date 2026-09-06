import React from 'react';
import { Link } from 'react-router-dom';

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-border bg-card text-muted-foreground pt-10 pb-8 text-xs">
      <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pb-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-2.5">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="SanGo Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="font-extrabold text-sm tracking-tight text-foreground">
                San<span className="text-primary">Go</span>
              </span>
            </Link>
            <p className="leading-relaxed max-w-sm">
              Hệ thống tìm kiếm, giữ chỗ và đặt sân thể thao trực tuyến tại Hà Nội &amp; TP. Hồ Chí Minh.
            </p>
          </div>

          {/* Môn thể thao */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Môn thể thao</h4>
            <ul className="space-y-1.5">
              <li><Link to="/venues?sportType=FOOTBALL5" className="hover:text-foreground transition-colors">Bóng đá</Link></li>
              <li><Link to="/venues?sportType=PICKLEBALL" className="hover:text-foreground transition-colors">Pickleball</Link></li>
              <li><Link to="/venues?sportType=BADMINTON" className="hover:text-foreground transition-colors">Cầu lông</Link></li>
              <li><Link to="/venues?sportType=TENNIS" className="hover:text-foreground transition-colors">Tennis</Link></li>
            </ul>
          </div>

          {/* Cộng đồng */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Cộng đồng</h4>
            <ul className="space-y-1.5">
              <li><Link to="/matches" className="hover:text-foreground transition-colors">Ghép trận</Link></li>
              <li><Link to="/tournaments" className="hover:text-foreground transition-colors">Giải đấu</Link></li>
              <li><Link to="/ranking" className="hover:text-foreground transition-colors">Bảng xếp hạng</Link></li>
              <li><Link to="/map" className="hover:text-foreground transition-colors">Bản đồ sân</Link></li>
            </ul>
          </div>

          {/* Hợp tác */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Hợp tác</h4>
            <ul className="space-y-1.5">
              <li><Link to="/partner" className="hover:text-foreground transition-colors">Dành cho chủ sân</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">Về chúng tôi</Link></li>
              <li><span>Hotline: 1900 6868</span></li>
              <li><span>Email: contact@sango.vn</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/60 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© 2026 SanGo Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-foreground transition-colors">Điều khoản</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">Chính sách hủy sân</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
