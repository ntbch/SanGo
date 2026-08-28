import React from 'react';
import { Link } from 'react-router-dom';

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-[#0d2252] bg-[#011030] text-slate-300 pt-10 pb-8 text-xs">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pb-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-2.5">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="SanGo Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="font-extrabold text-sm tracking-tight text-white">
                San<span className="text-sky-400">Go</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Hệ thống tìm kiếm, giữ chỗ và đặt sân thể thao trực tuyến tại Hà Nội & TP. Hồ Chí Minh.
            </p>
          </div>

          {/* Sân thể thao */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Môn thể thao</h4>
            <ul className="space-y-1.5">
              <li><Link to="/venues?sportType=FOOTBALL5" className="hover:text-primary transition-colors">Bóng đá</Link></li>
              <li><Link to="/venues?sportType=PICKLEBALL" className="hover:text-primary transition-colors">Pickleball</Link></li>
              <li><Link to="/venues?sportType=BADMINTON" className="hover:text-primary transition-colors">Cầu lông</Link></li>
              <li><Link to="/venues?sportType=TENNIS" className="hover:text-primary transition-colors">Tennis</Link></li>
            </ul>
          </div>

          {/* Tiện ích */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Cộng đồng</h4>
            <ul className="space-y-1.5">
              <li><Link to="/matches" className="hover:text-primary transition-colors">Ghép trận</Link></li>
              <li><Link to="/tournaments" className="hover:text-primary transition-colors">Giải đấu</Link></li>
              <li><Link to="/ranking" className="hover:text-primary transition-colors">Bảng xếp hạng</Link></li>
              <li><Link to="/map" className="hover:text-primary transition-colors">Bản đồ sân</Link></li>
            </ul>
          </div>

          {/* Hỗ trợ & Liên hệ */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Hợp tác</h4>
            <ul className="space-y-1.5">
              <li><Link to="/partner" className="hover:text-primary transition-colors">Dành cho chủ sân</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">Về chúng tôi</Link></li>
              <li><span className="text-slate-400/80">Hotline: 1900 6868</span></li>
              <li><span className="text-slate-400/80">Email: contact@sango.vn</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p className="text-slate-500">© 2026 SanGo Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-primary transition-colors">Điều khoản</Link>
            <Link to="/about" className="hover:text-primary transition-colors">Chính sách hủy sân</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
