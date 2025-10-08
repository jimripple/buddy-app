# 📚 Buddy App

## ✨ Project Overview

Buddy is an AI-assisted writing dashboard for authors who want to plan stories and maintain daily writing habits. Organize your work into projects, chapters, and scenes, track daily word goals, and draft inside a focused three-panel editor. The app is built with **Next.js 15**, **Supabase**, and **TailwindCSS** for a modern, real-time experience.

## 🚀 Features

- Supabase authentication with email magic links (plus local dev login)
- Dashboard for managing multiple writing projects
- Project editor with chapters, scenes, and review panes
- Real-time autosave to Supabase
- Daily word-goal and streak tracking
- Persistent state backed by Supabase Postgres with RLS

## 🧰 Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Supabase** (Auth, Database, RLS)
- **TailwindCSS** for styling
- **ESLint** & **Prettier** for linting and formatting

## 🛠️ Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/jimripple/buddy-app.git
cd buddy-app

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local
```

Add your Supabase configuration to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PASSWORD_LOGIN=0
```

Run the development server:

```bash
npm run dev
```

The app will be live at `http://localhost:3000` (or `3001` if the port is in use).

## 🗃️ Supabase Setup Notes

1. Enable Email Auth
2. Disable “Confirm email” during local testing
3. Create tables: `projects`, `chapters`, `scenes`
4. Add Row-Level Security policies for user-based access

## 🧑‍💻 Development Notes

- Uses ESLint + Prettier for consistent formatting
- Client components are marked with `"use client"`
- Server components handle secure data fetching via Supabase helpers

## 🧭 Roadmap / Next Steps

- Add AI-based writing suggestions
- Implement collaboration mode
- Support version history for scenes

## 🧪 Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Build the production bundle  |
| `npm run lint`  | Run ESLint checks            |
| `npm run test`  | Execute unit tests           |

## 🧑‍🔬 Testing

Run all Jest unit tests with:

```bash
npm run test
```

## 📜 License

MIT License

## 👤 Author

Created by **James McKinney** ([GitHub @jimripple](https://github.com/jimripple))
