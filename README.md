# Scythe Ops

Dev team management tool. Track tasks, schedule milestones, and coordinate who's working on what.

![Scythe Ops](screenshot.png)

---

## Quick Start

1. Run `scytheops.exe`
2. Sign in with your team email
3. Start tracking!

---

## Features

### Tasks
Manage work items through a three-stage workflow.

- **Pending** - Work that needs to be done
- **Completed** - Done but awaiting verification
- **Implemented** - Archived (auto-deletes after 7 days)

**Claiming**: Click any task and hit "Claim" to signal you're working on it. Claimed tasks glow purple and show your name.

**Categories**: Art, Code, Audio, Design, Docs, Marketing, Infra, Other

**Priorities**: Low, Medium, High, Critical

### Schedule
Plan milestones and deadlines with a calendar view.

- **Milestones** - Important dates with countdown timers
- **Deliverables** - Deadlines that can auto-create linked tasks
- **Labels** - Historic markers for reference

Switch between Calendar and List views. Filter by event type.

### Tools
- **Compare** - Side-by-side stats for different task categories

### Admin
User management panel for team leads. Blocking a user automatically releases all their claimed tasks.

---

## Task Workflow

1. Click **"Add New Task"** to create a task
2. Fill in name, description, category, and priority
3. Click a task card to view details, edit, or claim it
4. Use **"Mark Completed"** when work is done
5. Use **"Mark Implemented"** to archive
6. Use **"Back to..."** buttons to revert if needed

---

## Categories

| Category | Use For |
|----------|---------|
| Art | Sprites, models, textures, animations |
| Code | Features, bug fixes, refactors |
| Audio | Music, sound effects, voice |
| Design | UI/UX, game design docs |
| Docs | Documentation, guides |
| Marketing | Trailers, social media, press |
| Infra | Build systems, CI/CD, tools |
| Other | Everything else |

---

## Troubleshooting

**Can't sign in?**
- Check your email/password
- Create a new account if needed

**Tasks not showing?**
- Check internet connection
- Restart the app

**Something broken?**
- Ping the team lead

---

## For Devs

Built with Tauri + React + TypeScript + Supabase.

### Prerequisites
- Node.js 18+
- Rust (via [rustup](https://rustup.rs/))
- Tauri CLI: `cargo install tauri-cli`

### Setup
```bash
git clone https://github.com/Kalfadda/scythe-ops.git
cd scythe-ops
npm install
```

### Development
```bash
npm run tauri dev
```

### Build
```bash
npm run release          # Auto-bump version + build
npm run tauri build      # Build without version bump
```

Output: `src-tauri/target/release/scytheops.exe`

See `CLAUDE.md` for technical details.
