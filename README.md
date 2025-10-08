# Buddy – AI Writing Coach

Buddy is a Next.js + Supabase MVP that helps writers plan projects, draft scenes, and stay motivated with daily streaks and AI feedback.

## Prerequisites

- Node.js 18+
- npm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (login with `supabase login`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL` – project URL from the Supabase dashboard
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon public API key
   - `NEXT_PUBLIC_SITE_URL` – full URL used in magic-link callbacks (defaults to `http://localhost:3000`)
3. Apply database migrations:
   ```bash
   ./scripts/apply-migrations.sh
   ```
   The script uses the Supabase CLI. Set `SUPABASE_PROJECT_REF` or `SUPABASE_DB_URL` if you want to target a specific project/database.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` and sign in with the magic link flow.

## Available Scripts

- `npm run dev` – start the development server
- `npm run build` / `npm start` – build and run the production bundle
- `npm run lint` – run eslint
- `npm test` – run Jest unit tests for streak logic and helpers

## Supabase Notes

- SQL migrations live in `supabase/migrations`.
- All tables enforce row-level security. Policies limit access to the authenticated project owner.
- The `scripts/apply-migrations.sh` helper wraps the Supabase CLI to run `migration up` or `db push` based on your environment variables.

## Project Structure Highlights

- `src/app/(auth)` – magic-link authentication flow
- `src/app/(dashboard)` – project list, editor, review/memory/goals panels
- `src/app/api` – JSON + markdown endpoints (autosave, review, export, etc.) validated with Zod
- `src/lib/supabase` – client/server helpers for Supabase SSR
- `src/lib/streak` – streak calculations with accompanying Jest tests
- `src/lib/ai` – `Reviewer` interface and the `MockReviewer` implementation used by the MVP

## Tests

Jest is configured with `ts-jest` under `jest.config.ts`. Run `npm test` to execute the unit test suite. Add additional tests alongside the modules in `src/` as the product grows.

## Migrations & Schema Changes

After updating SQL in `supabase/migrations`, commit the change and rerun `./scripts/apply-migrations.sh` to keep the database in sync. The helper can run against:

- Local dev stack (`supabase start`) – no extra env vars needed
- Remote project – set `SUPABASE_PROJECT_REF`
- Direct database URL – set `SUPABASE_DB_URL` (requires `SUPABASE_ACCESS_TOKEN`)

---

Happy writing!
