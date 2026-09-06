import React from 'react';
import { HomeHero } from '../components/home-hero';
import { HomeHowItWorks } from '../components/home-how-it-works';
import { HomeSportsCards } from '../components/home-sports-cards';
import { HomeFeaturedVenues } from '../components/home-featured-venues';
import { HomeMapBanner } from '../components/home-map-banner';
import { HomeCommunityFeatures } from '../components/home-community-features';
import { HomeTechPillars } from '../components/home-tech-pillars';
import { HomeGuestFaq } from '../components/home-guest-faq';
import { HomePartnerCta } from '../components/home-partner-cta';

export function HomePage(): React.ReactElement {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-12 sm:space-y-16">
      {/* 1. Hero & Search Hub (asymmetric 55/45 + live open-matches panel) */}
      <HomeHero />

      {/* 2. Quy trình đặt sân trong 3 bước */}
      <HomeHowItWorks />

      {/* 3. Khám phá theo 4 môn thể thao */}
      <HomeSportsCards />

      {/* 4. Cụm sân tiêu biểu được yêu thích */}
      <HomeFeaturedVenues />

      {/* 5. Bản đồ tìm sân gần nhất */}
      <HomeMapBanner />

      {/* 6. Ghép trận & giải đấu cho khách */}
      <HomeCommunityFeatures />

      {/* 7. Công nghệ vận hành SanGo */}
      <HomeTechPillars />

      {/* 8. Câu hỏi thường gặp */}
      <HomeGuestFaq />

      {/* 9. Hợp tác dành cho chủ sân */}
      <HomePartnerCta />
    </div>
  );
}
