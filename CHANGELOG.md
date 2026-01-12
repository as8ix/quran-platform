# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0-beta] - Work in Progress
### Added
- **Goal Tracking System (متابعة الهدف اليومي):**
    - Database: Added `dailyTargetPages` to Student and `isGoalAchieved` to Session models.
    - UI: Added "Hifz Goal" & "Review Goal" dropdowns in `AddStudentModal`. 
    - Logic: Automatic calculation of goal achievement based on (Hifz Pages >= Target) AND (Review Pages >= Target).
    - Logic: "Khatim" students automatically pass Hifz goal check.
    - UI: "Goal Achieved 🎯" badge in student history log.

### Pending / Next Steps
- **Quranic Day (اليوم القرآني):** Feature definition and implementation pending.

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
