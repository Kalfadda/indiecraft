# Scythe Ops

Internal task tracking tool for the team. Keep track of what needs to be done, who's working on what, and what's been completed.

![Scythe Ops](screenshot.png)

---

## Quick Start

1. Run `scytheops.exe`
2. Sign in with your team email
3. Start tracking tasks!

---

## How to Use

### Adding a Task

1. Click the purple **"Check In Asset"** button
2. Fill in the task name
3. Add a description explaining what needs to be done
4. Choose a **Category** (Art, Code, Audio, Design, Docs, Marketing, Infra, Other)
5. Set the **Priority** (Low, Medium, High, Critical)
6. Click **"Check In"**

### Viewing Tasks

- **Pending tab** - Tasks that still need to be done
- **Implemented tab** - Completed tasks
- **Filter buttons** - Click any category to filter the list

### Completing a Task

1. Click on a task card to open details
2. Review the info
3. Click **"Mark as Implemented"**

### Deleting a Task

Click the **X** on any task card.

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

## Priority Levels

- **Low** - Nice to have, no rush
- **Medium** - Should get done soon
- **High** - Important, prioritize this
- **Critical** - Drop everything, fix now

---

## Tips

- Use clear, descriptive task names
- Add enough detail in descriptions so anyone can pick it up
- Set realistic priorities (not everything is critical!)
- Check the Implemented tab to see what's been done

---

## Troubleshooting

**Can't sign in?**
- Check your email/password
- Try creating a new account if you haven't already

**Tasks not showing up?**
- Check your internet connection
- Try refreshing (close and reopen the app)

**Something else broken?**
- Ping the team lead

---

## For Devs

Built with Tauri + React + TypeScript + Supabase.

See `CLAUDE.md` for technical details.
