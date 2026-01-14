# Changelog

All notable changes to Scythe Ops will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.24] - 2026-01-13

### Added
- Forced auto-update system - users must update to ensure version concurrency
- Full-screen blocking modal during updates with progress bar
- Clickable version number in sidebar to manually check for updates
- Version display in sidebar footer

### Changed
- Auto-update now shows download progress and auto-restarts
- Regenerated signing keys for update verification

## [0.1.5] - 2026-01-12

### Added
- Schedule tab in sidebar (stub with coming soon placeholder)

### Changed
- Improved "Add New Task" form layout with more spacious design
- Increased form width and padding throughout
- Taller description textarea (5 rows)
- Better spacing between form elements

## [0.1.4] - 2026-01-12

### Added
- Subtle category color coding on task cards (background tint based on category)

### Changed
- Renamed "Check In Asset" to "Add New Task" throughout the app
- Updated form labels and placeholders to use task-focused language

## [0.1.3] - 2026-01-12

### Added
- Three-stage task workflow: Pending → Completed → Implemented
- Ability to move tasks forward and backward between stages
- Auto-delete for implemented tasks after 7 days
- Days remaining indicator on implemented tasks
- Info banner explaining auto-delete behavior

### Changed
- Updated task status badges with distinct colors for each stage
- Improved task detail modal with bidirectional navigation buttons

## [0.1.2] - 2026-01-12

### Added
- Left sidebar navigation with dark theme
- Tasks tab containing existing task tracking functionality
- Modeling tab (stub with coming soon placeholder)

### Changed
- Relocated user info, settings, and logout to sidebar bottom
- Reorganized dashboard layout with fixed sidebar

## [0.1.1] - 2026-01-12

### Changed
- Disabled auto-update artifact generation temporarily due to Windows signing issues
- Auto-update code remains in place for future use

### Fixed
- Hide update check errors silently to avoid user confusion

## [0.1.0] - 2026-01-12

### Added
- Auto-update functionality via Tauri updater plugin
- UpdateNotification component for update status UI
- useUpdater hook for checking updates on app launch
- Auto version bump on build (`npm run release` command)
- Documented Supabase email confirmation setting requirement
- Documented release/update process in CLAUDE.md

### Changed
- Renamed binary from `app.exe` to `scytheops.exe`
- Updated README for internal team use
- Removed public-facing setup instructions

### Security
- Removed hardcoded admin password from source code (now uses environment variable)
- Removed credentials from CLAUDE.md
- Added `.env.example` with admin password placeholder

## [0.0.1] - 2026-01-12

### Added
- Initial release of Scythe Ops project management app
- Tauri + React + TypeScript + Vite stack
- Supabase authentication and PostgreSQL database integration
- Asset/task management system with:
  - Categories (Art, Code, Audio, Design, Docs, Marketing, Infra, Other)
  - Priorities (Low, Medium, High, Critical)
  - Status tracking (Pending, Implemented)
- Real-time updates via Supabase subscriptions
- Admin panel for user management
- Light mode theme
- Protected routes with authentication
