# Claude Code Instructions

## Build & Test Workflow

After every feature change or code modification:
1. Run `npm run tauri build` or `build.bat` to build the application
2. Launch the built executable from `src-tauri\target\release\scytheops.exe` to verify the changes work

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

## Supabase Configuration

**Important:** Email confirmation must be DISABLED for the desktop app to work properly.

In Supabase Dashboard:
1. Go to **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Save

This is required because Supabase email links redirect to `localhost:3000` which doesn't exist for a desktop app.

## Auth System Notes

- Uses module-level flags (`initStarted`, `profileFetchId`) to prevent race conditions
- `signIn()` directly updates state after success (don't rely solely on `onAuthStateChange`)
- Auth listener skips `TOKEN_REFRESHED` and `INITIAL_SESSION` events to avoid redundant fetches
- Profile is fetched once per sign-in, tracked via incrementing fetch ID

## Auto-Updates

The app checks for updates on launch using GitHub Releases.

### Creating a Release (triggers auto-update for users)

1. Bump the version in `src-tauri/tauri.conf.json`
2. Set the signing key environment variable:
   ```
   set TAURI_SIGNING_PRIVATE_KEY=<contents of src-tauri/.tauri-updater-key>
   ```
3. Build: `npm run tauri build`
4. Create a GitHub Release with the new version tag (e.g., `v0.2.0`)
5. Upload these files from `src-tauri/target/release/bundle/`:
   - `nsis/Scythe Ops_x.x.x_x64-setup.exe`
   - `nsis/Scythe Ops_x.x.x_x64-setup.exe.sig`
   - `msi/Scythe Ops_x.x.x_x64_en-US.msi`
   - `msi/Scythe Ops_x.x.x_x64_en-US.msi.sig`
6. Also upload the `latest.json` file from `src-tauri/target/release/bundle/`

Users will automatically receive the update next time they launch the app.

### Signing Key Location

- Private key: `src-tauri/.tauri-updater-key` (KEEP SECRET, do not commit!)
- Public key: embedded in `tauri.conf.json`

## Common Patterns

- Auth state flows through Zustand store, accessed via `useAuth()` hook
- Protected routes redirect to `/login` when `!user`
- Assets use TanStack Query with real-time subscriptions via `useAssetRealtime()`
