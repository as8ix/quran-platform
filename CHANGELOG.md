# Changelog

All notable changes to this project will be documented in this file.

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
