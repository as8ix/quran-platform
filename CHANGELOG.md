# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-05-03
### Added
- **Teacher Guidance (توجيه المعلمين):**
    - Added an interactive information icon (i) in the revision recording section.
    - Added detailed tooltips explaining recording directions (Descending vs. Ascending) and their impact on page calculation.
    - Enhanced icon visibility with dynamic contrast (Dark/Light mode support).
- **Gamification & Rewards (نظام النقاط والمكافآت):**
    - Integrated real-time points tracking for students.
    - QR Code Scanner: Mobile-friendly scanner for teachers/supervisors to award points instantly.
    - Live Leaderboard: Dynamic ranking system to boost student engagement.
    - Printable ID Cards: Automated generation of student cards with personal data.
- **Account Management (إدارة الحسابات):**
    - Comprehensive Profile System for teachers and supervisors.
    - Secure password update functionality with UI visibility toggles.
- **PWA & Performance:**
    - Transformation into a Progressive Web App (PWA) for native mobile installation.
    - High-fidelity Skeleton Screens for smoother data loading experience.
    - API payload optimization for faster dashboard rendering.
- **Reporting & UI:**
    - Professional student reporting tool with landscape printing support.
    - Improved navigation reliability and fixed Navbar overlaps on mobile devices.

### Fixed
- Teacher navigation paths and unauthorized supervisor redirections.
- Fee management permissions (restricted to supervisor role).
- Precision in page-count logic for complex revision scenarios.

## [1.2.0] - 2026-01-13
### Added
- **Quranic Days (الأيام القرآنية):**
    - Full-screen Live Dashboard with real-time stats (Target, Accomplished, Purity, Khatmats).
    - Event Management System: Create, Activate student-teacher assignments.
    - Auto-Assignment: Instant distribution of students to their primary teachers.
    - Teacher Logic: Simplified recording for intensive sessions (Hifz locked, Review-only goals).
- **Communication & Notifications:**
    - New global notification system with real-time browser alerts.
    - File Attachments: Support for images and documents in notifications using Firebase Storage.
    - Video Support: Integration of video links in announcements.
- **UI/UX Refinements:**
    - Custom premium confirmation modals replacing native alerts.
    - Mobile optimization for all dashboards and notification views.
    - Faster data refreshing (5s polling).
    - "First Name Only" display for more friendly UI.

### Fixed
- Firebase CORS issues for file uploads.
- Notification dropdown clipping on mobile.
- Precision Quran page calculations for targets.
- Session quality metrics (Errors, Alerts, Clean Pages).

## [1.1.0-beta]
- Goal Tracking System (متابعة الهدف اليومي).

## [1.0.0] - 2026-01-12

### Released
- **Full Vercel Deployment**: Successfully migrated to Vercel platform.
- **Database Migration**: Switched from local SQLite to Vercel PostgreSQL.
- **Data Seeding**: Migrated all drivers, halaqas, and supervisor data to the production database.
- **Security**: Secured database connections and removed temporary seed endpoints.

### Added
- Supervisor Dashboard with real-time statistics.
- Student/Teacher management system.
- Quran memorization tracking (Hifz & Murajaah).
- Unified session recording.

### Fixed
- UI responsiveness for mobile devices.
- Prisma Schema compatibility with Vercel.
- Improved "Khatim" student display (Hidden new memorization, detailed review logs with Ayah numbers).
