# Changelog

All notable changes to this project will be documented in this file.

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
