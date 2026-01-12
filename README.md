# Scythe Ops

A simple, beautiful task management app for creative teams. Track your project tasks, organize them by category, and mark them complete when done.

![Scythe Ops Screenshot](screenshot.png)

---

## What is Scythe Ops?

Scythe Ops is a desktop application that helps teams keep track of tasks and assets. Think of it as a shared to-do list where everyone can:

- **Add new tasks** with descriptions, categories, and priority levels
- **View all tasks** in a clean, organized grid
- **Filter by category** (Art, Code, Audio, Design, Docs, Marketing, etc.)
- **Mark tasks as complete** when finished
- **See who created what** and when

Perfect for game dev teams, creative studios, or any group that needs to track work items together.

---

## Getting Started

### For Team Members (Using the App)

1. **Get the installer** from your team lead
2. **Run the installer** (`Scythe Ops_x.x.x_x64-setup.exe`)
3. **Create an account** or sign in with your email
4. Start adding and tracking tasks!

### For Team Leads (Setting Up)

If you're setting up Scythe Ops for your team, you'll need:

1. A [Supabase](https://supabase.com) account (free tier works great)
2. The configuration values from Supabase (URL and API key)

See the **Setup Guide** section below for detailed instructions.

---

## How to Use

### Adding a Task

1. Click the purple **"Check In Asset"** button
2. Fill in the task name
3. Add a description (optional but helpful!)
4. Choose a **Category** (Art, Code, Audio, etc.)
5. Set the **Priority** (Low, Medium, High, Critical)
6. Click **"Check In"**

### Viewing Tasks

- **Pending tab**: Shows tasks that still need to be done
- **Implemented tab**: Shows completed tasks
- **Filter buttons**: Click a category to show only those tasks

### Completing a Task

1. Click on any task card to open it
2. Review the details
3. Click **"Mark as Implemented"** when done

### Deleting a Task

- Click the **X** button on any task card to delete it

---

## Setup Guide (For Administrators)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
3. Give it a name and set a database password (save this!)
4. Wait for the project to be created

### 2. Set Up the Database

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Open the file `supabase/setup.sql` from this project
3. Copy all the contents and paste into the SQL Editor
4. Click **"Run"**

### 3. Get Your API Keys

1. In Supabase, go to **Settings** → **API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key (the long string)

### 4. Configure the App

1. Create a file called `.env` in the project folder
2. Add these lines (replace with your actual values):

```
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=choose-a-secure-password
```

### 5. Build the App

If you have Node.js installed:

1. Open a terminal/command prompt in the project folder
2. Run: `npm install`
3. Run: `npm run tauri build`
4. Find the installer in `src-tauri/target/release/bundle/`

Or use the pre-built installer if your team lead provided one.

---

## Admin Panel

Team leads can access the admin panel to manage users:

1. Click the **gear icon** in the top-right corner
2. Enter the admin password
3. From here you can:
   - View all registered users
   - Block/unblock users if needed

---

## Troubleshooting

### "Failed to load assets"
- Check your internet connection
- Make sure Supabase is configured correctly

### Can't sign in
- Double-check your email and password
- Try creating a new account

### App won't start
- Make sure you have the latest version
- Try reinstalling the app

### Need more help?
Contact your team lead or project administrator.

---

## For Developers

Built with:
- [Tauri](https://tauri.app) - Desktop app framework
- [React](https://react.dev) - UI framework
- [Supabase](https://supabase.com) - Backend & database
- [TypeScript](https://typescriptlang.org) - Type-safe JavaScript

See `CLAUDE.md` for technical documentation.

---

Made with care for creative teams everywhere.
