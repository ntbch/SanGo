import React from 'react';
import { HomeHero } from '../components/home-hero';
import { HomeSportsCards } from '../components/home-sports-cards';
import { HomeFeaturedVenues } from '../components/home-featured-venues';
import { HomeMapBanner } from '../components/home-map-banner';
import { HomeCommunityFeatures } from '../components/home-community-features';
import { HomeTechPillars } from '../components/home-tech-pillars';
import { HomeGuestFaq } from '../components/home-guest-faq';
import { HomePartnerCta } from '../components/home-partner-cta';

export function HomePage(): React.ReactElement {
  return (
    <div className="w-full">
      {/* 1. Hero Command Center */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 border-b border-border/40">
        <HomeHero />
      </section>

      {/* 2. Cụm Sân Tiêu Biểu */}
      <section className="w-full bg-secondary/40 dark:bg-secondary/60 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 border-b border-border/40">
        <HomeFeaturedVenues />
      </section>

      {/* 3. Khám Phá Theo 4 Môn Thể Thao */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 border-b border-border/40">
        <HomeSportsCards />
      </section>

      {/* 4. Quy Trình & Công Nghệ Vận Hành SanGo */}
      <section className="w-full bg-secondary/40 dark:bg-secondary/60 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 border-b border-border/40">
        <HomeTechPillars />
      </section>

      {/* 5. Khám Phá Bản Đồ, Kèo Đấu, FAQ & Đối Tác Chủ Sân */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 space-y-12 sm:space-y-16">
        <HomeMapBanner />
        <HomeCommunityFeatures />
        <HomeGuestFaq />
        <HomePartnerCta />
      </section>
    </div>
  );
}

