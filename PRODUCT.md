# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Athletes & Sport Enthusiasts:** Individuals looking to find sports venues (Football, Pickleball, Badminton, Tennis), check real-time availability, hold slots without risk of double-booking, and pay deposits quickly.
- **Team Captains & Organizers:** Team leaders who manage team rosters, split match booking fees (split bill), collect monthly/match-based team funds (Team Treasury), and organize internal/external matches.
- **Solo Players Seeking Matches:** Players looking for open match invitations ("kèo ghép"), requesting to join based on role/skill level, communicating with match hosts, and building their sports reputation.
- **Venue Owners (Secondary audience):** Facility operators who configure court pricing rules, monitor daily revenue/booking statistics, check-in customers via QR codes, and manage court availability.
- **System Administrators (Tertiary audience):** Platform operators who review and approve new venues, monitor ecosystem health, and manage dispute resolution.

## Product Purpose

SanGo (Hệ thống đặt và quản lý sân thể thao trực tuyến) connects sports players with venue facilities in Vietnam. It eliminates the manual friction of phone-call bookings, uncertain court availability, and payment hassles by providing real-time slot locking, seamless online deposit payments, fair match-making, team treasury management, and competitive rankings.

## Positioning

Unlike fragmented social media groups or manual phone-based court reservations, SanGo guarantees zero double-booking through database-level row locking with 10-minute hold sessions, provides integrated team split-bill treasuries, and features an intelligent AI booking assistant with real database tool-calling (Gemini agent) for conversational slot discovery.

## Operating Context

- **Geographic Coverage:** Primary focus on Hanoi and TP. Hồ Chí Minh sports ecosystems, with district-level filtering and Haversine distance-based proximity ("Gần tôi") search.
- **Sports Supported:** Football (Sân 5, Sân 7), Pickleball, Badminton (Cầu lông), Tennis.
- **Device & Environment:** Mobile and desktop responsive web applications used on smartphones before/after matches, tablets at venue check-in desks, and desktop computers for league and team administration.
- **Currency & Formats:** Vietnamese Dong (`₫` / `VND`), Vietnamese locale date and time conventions (`HH:mm`, `DD/MM/YYYY`), Vietnamese phone number formats and banking transfer standards (VietQR, VNPay).

## Capabilities and Constraints

- **Real-Time Hold & Anti-Double-Booking:** 10-minute temporary hold mechanism backed by database transactions and row-level locking (`SELECT ... FOR UPDATE`), preventing race conditions.
- **Booking & Checkout Flow:** Deposit and full payment modes via VNPay Sandbox and Mock Payment Gateway with automatic refund previews and check-in QR code generation.
- **Team Treasury & Split Bill:** Multi-member team profiles, fund contribution tracking, split-bill allocation across match participants, and transaction logging.
- **Matchmaking Hub ("Kèo Giao Lưu"):** Open match creation, slot vacancy tracking with position requirements (e.g., Goalkeeper, Forward), join request approval workflow, and pre-match chat discussions.
- **ELO Rankings & Fair-Play Badges:** Club ELO leaderboard and individual athlete reputation scores based on match activity and community fair-play ratings.
- **AI Booking Assistant:** Multi-turn conversational agent (Google Gemini 2.5 Flash / rule-based fallback) capable of executing real DB search tools (`searchVenues`, `checkSlots`, `getSuggestedSlots`) without fabricating availability.
- **Technical Architecture:** Monorepo using pnpm workspaces, NestJS 10 REST API with Prisma ORM 6 and PostgreSQL 16 on backend, React 18 with Vite, TypeScript, Tailwind CSS, Radix UI, TanStack Query v5 on frontend.

## Brand Commitments

- **Name:** SanGo (Sân Gỗ / Sân Cỏ / Sân Gô)
- **Tone of Voice:** Energetic, reliable, modern, and accessible Vietnamese sports terminology (e.g., "Kèo đấu", "Chủ kèo", "Vận động viên phong trào", "Bảng vàng ELO", "Quỹ đội").
- **Visual Identity:** Sporty emerald/teal primary accents, crisp contrast, dark/light theme support with semantic design tokens, clean tabular numeric typography for currencies and match scores.

## Evidence on Hand

- Core REST API implementation in `apps/api` with Swagger OpenAPI documentation at `/api/docs`.
- Frontend application in `apps/web` with modular feature structure: `booking`, `matches`, `teams`, `ranking`, `venues`, `wallet`, `notifications`, `ai`, `auth`, `admin`.
- Integration and unit test suites in `apps/web/tests` and `apps/api/test`.
- Complete system architecture documentation and specs in `docs/` and `README.md`.

## Product Principles

1. **Deterministic Accuracy Over Assumptions:** Court availability, hold timers, and pricing must reflect live database state; never fabricate slots or deceive users about availability.
2. **Frictionless Social Play:** Joining a match, splitting a bill, or paying a deposit should take under three clicks from discovery to confirmation.
3. **Transparent Accountability:** Every financial transaction, hold timeout, refund rule, and ELO adjustment must be clear, timestamped, and auditable.
4. **Resilience & Graceful Degradation:** When external payment gateways or AI providers face interruptions, fallback mechanisms (Mock gateway, offline NLU) keep the core user journey uninterrupted.

## Accessibility & Inclusion

- Adhere to standard WCAG 2.1 AA guidelines for color contrast, semantic HTML, and focus indicators.
- Provide accessible ARIA labels for tabs, interactive badges, modal dialogs, and filter buttons.
- Ensure touch targets are at least 44x44px for mobile sports players on the move.
