# Claude Code Instructions

## Build & Test

After implementing changes, build the full desktop app:

```cmd
npm run tauri build
```

Then launch `src-tauri\target\release\indiecraft.exe` to verify.

For frontend-only checks (TypeScript + Vite bundle):

```cmd
npm run build
```

Do not commit or push unless explicitly requested.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7
- **Backend**: Tauri 2 (Rust) with SQLite for local asset library
- **Database**: Supabase (auth + PostgreSQL), customer-provided (BYOD)
- **State**: Zustand (client state) + TanStack Query (server state)
- **UI**: Inline CSS + Lucide React icons + Framer Motion (`motion` package)
- **3D**: Three.js + React Three Fiber + Drei (for asset library model preview)
- **Drag & Drop**: @dnd-kit (used in goal task reordering)
- **Testing**: Vitest + Testing Library + jsdom

## Architecture

### Feature-Based Structure

```
src/features/<feature>/
  components/   # React components
  hooks/        # Data fetching, mutations, realtime subscriptions
```

### Data Flow

1. TanStack Query hooks fetch from Supabase
2. Realtime hooks subscribe to live changes via Supabase channels
3. Mutations invalidate queries to trigger refetch
4. Zustand stores handle client-only state (auth, theme, navigation, notifications)

### Styling

All components use **inline CSS `style={{}}` objects** with theme colors from `useTheme()`. No Tailwind classes in components. Tailwind is only used in `index.css` for global layout and animations.

### Config System

The app uses a setup wizard on first launch. Users provide their own Supabase URL and anon key, which are saved to Tauri's appDataDir as `config.json`. Config can be exported/imported as JSON for team sharing.

## Features

### Goals (`src/features/goals/`)
- Goal-driven project management: goals contain ordered tasks
- Status: Active, Completed
- Tasks linked via `goal_tasks` join table with `order_index` for ordering
- Drag-and-drop task reordering within goals (@dnd-kit)
- Task dependencies (what blocks what) within a goal
- Comments on goals
- Inbox view: tasks not assigned to any goal
- Progress calculated from completed task count
- Completing a goal auto-deletes its completed tasks

### Tasks (`src/features/assets/`)
- Status workflow: Blocked -> Pending -> In Progress -> Completed
- Moving to "In Progress" auto-claims the task
- Categories: Art, Code, Audio, Design, Docs, Marketing, Infra, Other
- Priorities: Low, Medium, High, Critical
- Claim system for task ownership
- ETA date auto-creates a deliverable event on the schedule
- Comments on tasks
- Realtime updates across all connected clients
- Full CRUD with detail modal editing

### Schedule (`src/features/schedule/`)
- Event types: Milestone, Deliverable, Label
- Calendar view with month navigation + list view
- Events can link to tasks or goals
- Deliverables can auto-create linked tasks
- Visibility: Internal / External
- Countdown display for upcoming events

### Modeling Requests (`src/features/modeling/`)
- Request 3D models/assets from the design team
- Status: Open -> Accepted (creates "design" category task) OR Denied
- Denied requests auto-hide after 7 days

### Feature Requests (`src/features/featurerequests/`)
- Request features from the dev team
- Status: Open -> Accepted (creates "code" category task) OR Denied
- Denied requests auto-hide after 7 days

### Bulletin Board (`src/features/bulletin/`)
- Canvas of free-form sticky notes with custom colors
- Draggable positioning, rotation stored in DB
- Real-time sync across users

### Asset Library (`src/features/library/`)
- Browse local project files (images, audio, PSD, 3D models)
- Thumbnail generation and metadata extraction via Rust backend
- 3D model preview with Three.js
- Audio playback
- SQLite database per project for indexing
- Tauri IPC commands bridge frontend to Rust scanner

### Notifications (`src/features/notifications/`)
- Persistent activity log stored in database
- Toast notifications (transient, max 5 visible, 8s auto-dismiss)
- All actions fire both toast + persistent log entry

### Settings (`src/features/settings/`)
- View connection info
- Export/import config JSON
- Logout

### Setup Wizard (`src/features/setup/`)
- Three-step onboarding: Connection -> Schema -> Complete
- Validates Supabase credentials
- Checks/initializes database tables
- Supports config file import

### Tools (`src/features/tools/`)
- Compare tool: side-by-side category comparison chart

### Auth (`src/features/auth/`)
- Email/password auth via Supabase
- Blocked user screen
- Protected route wrapper

## Stores (`src/stores/`)

| Store | Purpose |
|-------|---------|
| `authStore.ts` | User session, profile, loading state |
| `themeStore.ts` | 6 color themes (purple, ocean, forest, sunset, rose, slate) with 40+ tokens each. Persisted to localStorage |
| `navigationStore.ts` | Cross-component task navigation via `pendingTaskId` |
| `notificationStore.ts` | Toast queue + persistent DB logging. `createNotificationConfig()` helper |

## Utilities (`src/lib/`)

| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client (Proxy for lazy init) |
| `supabaseConfig.ts` | Config file read/write via Tauri FS |
| `constants.ts` | Admin password, session duration |
| `heartbeat.ts` | DB ping to prevent Supabase free tier pause |
| `errorHandler.ts` | Error handling utilities |
| `utils.ts` | General utilities |
| `configExportImport.ts` | Config file export/import |

## Database Schema

### profiles
- id, email, display_name, is_blocked, blocked_at, blocked_reason, created_at, updated_at

### assets (tasks)
- id, name, blurb, status, category, priority, goal_id, eta_date
- created_by, in_progress_by, in_progress_at, completed_by, completed_at
- blocked_by, blocked_at, blocked_reason
- claimed_by, claimed_at
- created_at, updated_at

### goals
- id, name, description, status (active/completed), priority, target_date
- created_by, created_at, updated_at, completed_at

### goal_tasks (join table)
- id, goal_id, asset_id, order_index, notes, created_at

### task_dependencies
- id, dependent_task_id, dependency_task_id, goal_id, created_at

### events
- id, type, title, description, event_date, event_time
- visibility, linked_asset_id, linked_goal_id, auto_create_task
- created_by, created_at, updated_at

### model_requests
- id, name, description, priority, status (open/accepted/denied)
- created_by, accepted_by, accepted_at, linked_asset_id
- denied_by, denied_at, denial_reason
- created_at, updated_at

### feature_requests
- id, name, description, priority, status (open/accepted/denied)
- created_by, accepted_by, accepted_at, linked_asset_id
- denied_by, denied_at, denial_reason
- created_at, updated_at

### comments
- id, asset_id, goal_id, content, created_by, created_at, updated_at

### notifications
- id, type, variant, title, message
- actor_id, actor_name, item_name, item_id, item_type
- created_at

### bulletins
- id, message, position_x, position_y, rotation, color
- created_by, created_at, updated_at

## Database Migrations

Whenever you modify `src/types/database.ts`, you MUST:
1. Generate the corresponding SQL migration
2. Prompt the user to run it in Supabase SQL Editor
3. Provide clear step-by-step instructions

The app will fail if TypeScript types don't match the database schema.

## Security - Row Level Security (RLS)

**CRITICAL:** This repo is public. Supabase credentials are bundled into the app.

Every new table MUST have RLS enabled:

1. Enable RLS: `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`
2. Add policies for SELECT, INSERT, UPDATE, DELETE
3. All policies require `authenticated` role
4. Use `NOT public.is_user_blocked()` check

```sql
CREATE POLICY "Non-blocked users can view table_name"
  ON public.table_name FOR SELECT TO authenticated
  USING (NOT public.is_user_blocked());
```

## Supabase Auth

Email confirmation MUST be disabled in Supabase Dashboard:
Authentication -> Providers -> Email -> Turn OFF "Confirm email"

## Auto-Updates

The app checks for updates on launch and shows a blocking modal forcing users to update, ensuring version concurrency across the team. Update manifest served from GitHub releases.

## Tauri Backend (`src-tauri/`)

- `lib.rs` - Tauri command registration, Plastic SCM integration commands
- `library/` module - Asset library scanner, indexer, thumbnail generator, SQLite DB
- Key crates: `rusqlite`, `image`, `psd`, `jwalk`, `r2d2` (connection pooling)
- Plugins: updater, dialog, fs, shell, process, log

## Common Patterns

- Auth state: `useAuthStore()` (Zustand)
- Theme colors: `useTheme()` returns current palette with 40+ tokens
- Data fetching: `use<Feature>()` query hooks + `use<Feature>Mutations()` + `use<Feature>Realtime()`
- Protected routes redirect to `/login` when no session
- All component styling is inline CSS using theme tokens
- Feature-based folders: `src/features/<name>/components|hooks`
- Deleting tasks clears `linked_asset_id` from requests and events
- Request features (modeling/feature) share the same Open -> Accepted/Denied pattern
- Cross-component navigation via `navigationStore.setPendingTaskId()`
- Notifications fire on all actions via `notificationStore.addNotification()`
