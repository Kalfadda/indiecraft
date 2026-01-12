# Claude Code Instructions

## Build & Test Workflow

After every feature change or code modification:
1. Run `npm run tauri build` or `build.bat` to build the application
2. Launch the built executable from `src-tauri\target\release\app.exe` to verify the changes work

## Project Structure

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Database**: Supabase (auth + PostgreSQL)
- **State Management**: Zustand (auth) + TanStack Query (data fetching)
- **UI**: Custom components + Lucide icons + Framer Motion

## Key Files

- `src/features/auth/hooks/useAuth.ts` - Authentication hook (login, logout, profile fetching)
- `src/stores/authStore.ts` - Zustand store for auth state
- `src/features/auth/components/AuthPage.tsx` - Login/Register page
- `src/features/auth/components/ProtectedRoute.tsx` - Route guard
- `src/features/assets/components/Dashboard.tsx` - Main dashboard
- `src/lib/supabase.ts` - Supabase client configuration

## Auth System Notes

- Uses module-level flags (`initStarted`, `profileFetchId`) to prevent race conditions
- `signIn()` directly updates state after success (don't rely solely on `onAuthStateChange`)
- Auth listener skips `TOKEN_REFRESHED` and `INITIAL_SESSION` events to avoid redundant fetches
- Profile is fetched once per sign-in, tracked via incrementing fetch ID

## Common Patterns

- Auth state flows through Zustand store, accessed via `useAuth()` hook
- Protected routes redirect to `/login` when `!user`
- Assets use TanStack Query with real-time subscriptions via `useAssetRealtime()`
