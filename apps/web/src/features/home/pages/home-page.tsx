import React from 'react';
import { HomeHero } from '../components/home-hero';
import { HomeSportsCards } from '../components/home-sports-cards';
import { HomeFeaturedVenues } from '../components/home-featured-venues';
import { HomeMapBanner } from '../components/home-map-banner';
import { HomeCommunityFeatures } from '../components/home-community-features';
import { HomeTechPillars } from '../components/home-tech-pillars';
import { HomePartnerCta } from '../components/home-partner-cta';

export function HomePage(): React.ReactElement {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-12 sm:space-y-16">
      {/* 1. Hero & Search Hub */}
      <HomeHero />

      {/* 2. Khám Phá Theo 4 Môn Thể Thao */}
      <HomeSportsCards />

      {/* 3. Cụm Sân Tiêu Biểu (Đánh Giá Cao) */}
      <HomeFeaturedVenues />

      {/* 4. Bản Đồ Không Gian Trực Tuyến */}
      <HomeMapBanner />

      {/* 5. Giới Thiệu Tính Năng Ghép Trận & Giải Đấu (Cho Cả Guest) */}
      <HomeCommunityFeatures />

      {/* 6. 4 Trụ Cột Công Nghệ Thể Thao SanGo */}
      <HomeTechPillars />

      {/* 7. Hợp Tác Dành Cho Chủ Sân */}
      <HomePartnerCta />
    </div>
  );
}
