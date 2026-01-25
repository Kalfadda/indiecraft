# Claude Code Instructions

## Build & Release Workflow

To publish a new release, run the single release script:

```cmd
release.bat
```

This script handles everything:
1. Increments the patch version (e.g., 0.1.0 → 0.1.1)
2. Builds and signs the installers
3. Generates `latest.json` with the correct signature
4. Commits and pushes to GitHub
5. Creates a GitHub release with all artifacts

To test locally before release, run:
```cmd
npm run release
```
Then launch `src-tauri\target\release\scytheops.exe` to verify changes.

## Project Structure

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Database**: Supabase (auth + PostgreSQL)
- **State Management**: Zustand (auth) + TanStack Query (data fetching)
- **UI**: Custom inline CSS + Lucide icons + Framer Motion

## Feature Overview

### Tasks (Assets)
- Four-stage workflow: Pending → In Progress → Completed → Implemented
- Moving to "In Progress" auto-claims the task
- Optional ETA date auto-creates a deliverable on the schedule
- Categories: Art, Code, Audio, Design, Docs, Marketing, Infra, Other
- Priorities: Low, Medium, High, Critical
- Claim system: Users can claim/unclaim tasks to signal ownership
- Implemented tasks auto-delete after 7 days
- Deleting linked tasks/events shows a warning prompt
- Full CRUD with edit support in detail modal

### Schedule
- Three event types: Milestone, Deliverable, Label
- Calendar view with month navigation
- List view for chronological browsing
- Deliverables can auto-create linked tasks
- Deleting a task removes linked calendar events

### Modeling (collapsible dropdown)
- **Modeling Requests**: Request 3D models/assets from the design team
- Status workflow: Open → Accepted (creates Design task) OR Denied
- Denied requests auto-hide after 7 days
- Accepting a request creates a linked task with category "design"

### Technical (collapsible dropdown)
- **Feature Requests**: Request new features from the dev team
- Status workflow: Open → Accepted (creates Code task) OR Denied
- Denied requests auto-hide after 7 days
- Accepting a request creates a linked task with category "code"

### Tools (collapsible dropdown)
- Compare tool: Side-by-side comparison of task categories

### Admin
- User management panel
- Block/unblock users (auto-unclaims their tasks)

## Key Files

### Auth
- `src/features/auth/hooks/useAuth.ts` - Authentication hook
- `src/stores/authStore.ts` - Zustand auth state
- `src/features/auth/components/AuthPage.tsx` - Login/Register
- `src/features/auth/components/ProtectedRoute.tsx` - Route guard

### Tasks
- `src/features/assets/components/Dashboard.tsx` - Main dashboard with sidebar
- `src/features/assets/components/AssetList.tsx` - Task list with filtering
- `src/features/assets/components/AssetCard.tsx` - Task card with claim visuals
- `src/features/assets/components/AssetDetailModal.tsx` - Task detail/edit modal
- `src/features/assets/hooks/useAssets.ts` - Task queries (includes claimer join)
- `src/features/assets/hooks/useAssetMutations.ts` - Task mutations (CRUD, claim/unclaim)

### Schedule
- `src/features/schedule/components/ScheduleView.tsx` - Main schedule view
- `src/features/schedule/components/Calendar.tsx` - Calendar component
- `src/features/schedule/components/EventForm.tsx` - Event create/edit form
- `src/features/schedule/components/EventCard.tsx` - Event card display
- `src/features/schedule/hooks/useEvents.ts` - Event queries
- `src/features/schedule/hooks/useEventMutations.ts` - Event mutations

### Modeling
- `src/features/modeling/components/ModelingView.tsx` - Main view with tabs
- `src/features/modeling/components/RequestList.tsx` - Request grid display
- `src/features/modeling/components/RequestCard.tsx` - Request card
- `src/features/modeling/components/RequestDetailModal.tsx` - Request details with accept/deny
- `src/features/modeling/hooks/useRequests.ts` - Request queries
- `src/features/modeling/hooks/useRequestMutations.ts` - Request mutations

### Feature Requests
- `src/features/featurerequests/components/FeatureRequestsView.tsx` - Main view with tabs
- `src/features/featurerequests/components/FeatureRequestList.tsx` - Request grid display
- `src/features/featurerequests/components/FeatureRequestCard.tsx` - Request card
- `src/features/featurerequests/components/FeatureRequestDetailModal.tsx` - Request details
- `src/features/featurerequests/hooks/useFeatureRequests.ts` - Request queries
- `src/features/featurerequests/hooks/useFeatureRequestMutations.ts` - Request mutations

### Tools
- `src/features/tools/components/Compare.tsx` - Category comparison tool

### Utilities
- `src/lib/supabase.ts` - Supabase client
- `src/lib/heartbeat.ts` - Database ping to prevent free tier pause

## Database Schema

### profiles
- id, email, display_name, is_blocked, blocked_at, blocked_reason, created_at, updated_at

### assets (tasks)
- id, name, blurb, status, category, priority, eta_date
- created_by, in_progress_by, in_progress_at, completed_by, completed_at, implemented_by, implemented_at
- claimed_by, claimed_at
- created_at, updated_at

### events
- id, type, title, description, event_date, event_time
- visibility, linked_asset_id, auto_create_task
- created_by, created_at, updated_at

### model_requests
- id, name, description, priority, status (open/accepted/denied)
- created_by, created_at, updated_at
- accepted_by, accepted_at, linked_asset_id
- denied_by, denied_at, denial_reason

### feature_requests
- id, name, description, priority, status (open/accepted/denied)
- created_by, created_at, updated_at
- accepted_by, accepted_at, linked_asset_id
- denied_by, denied_at, denial_reason

## Supabase Configuration

**Important:** Email confirmation must be DISABLED for the desktop app to work properly.

In Supabase Dashboard:
1. Go to **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Save

## Database Migrations

**IMPORTANT:** Whenever you modify `src/types/database.ts`, you MUST:
1. Generate the corresponding SQL migration
2. Prompt the user to run it in Supabase SQL Editor
3. Provide clear step-by-step instructions

The app will fail if TypeScript types don't match the database schema.

## Security - Row Level Security (RLS)

**CRITICAL:** This repo is public. The Supabase URL and anon key are bundled into the app and visible to anyone.

**Every new table MUST have RLS enabled with proper policies:**

1. Enable RLS: `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`
2. Add policies for SELECT, INSERT, UPDATE, DELETE
3. All policies should require `authenticated` role
4. Use `NOT public.is_user_blocked()` check in policies

Example policy pattern:
```sql
CREATE POLICY "Non-blocked users can view table_name"
  ON public.table_name FOR SELECT TO authenticated
  USING (NOT public.is_user_blocked());
```

**Without RLS, anyone who signs up can access all data in that table.**

## Auto-Updates

The app checks for updates on launch and forces users to update (blocking modal) to ensure version concurrency.

### Publishing a Release

Run the single release script:
```cmd
release.bat
```

This handles everything automatically:
1. Increments version number
2. Builds and signs installers (NSIS + MSI)
3. Generates `latest.json` with correct signature
4. Commits and pushes to GitHub
5. Creates GitHub release with all artifacts

### Signing Key
- Private key: embedded in `release.bat` (encrypted)
- Public key: embedded in `tauri.conf.json`
- Password: `scythe`

## Common Patterns

- Auth state via Zustand, accessed with `useAuthStore()`
- Data fetching via TanStack Query hooks
- Protected routes redirect to `/login` when no user
- Inline CSS styles (not Tailwind) for all components
- Feature-based folder structure: `src/features/<feature>/components|hooks`
- Deleting tasks clears `linked_asset_id` from model_requests, feature_requests, and events
- Request features (modeling/feature) use same pattern: Open → Accepted/Denied with 7-day auto-hide for denied
