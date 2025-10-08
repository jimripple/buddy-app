-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists vector;

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  goal_words_per_day integer,
  deadline date,
  created_at timestamptz not null default timezone('utc', now())
);

-- Chapters table
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- Scenes table
create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  title text not null,
  order_index integer not null default 0,
  content text not null default '',
  word_count integer not null default 0 check (word_count >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Daily stats table
create table if not exists public.stats_daily (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  date date not null,
  words_written integer not null default 0,
  streak integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, date)
);

-- Embeddings table
create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scene_id uuid references public.scenes (id) on delete cascade,
  chunk_text text not null,
  embedding vector(1536) not null
);

-- Reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scene_id uuid references public.scenes (id) on delete cascade,
  scope text,
  model_used text,
  summary jsonb,
  critiques jsonb,
  strengths jsonb,
  challenge text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Entities table
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null,
  name text not null,
  details jsonb default '{}'::jsonb,
  occurrences integer not null default 0,
  last_seen_chapter integer,
  created_at timestamptz not null default timezone('utc', now())
);

-- Helpful indexes
create index if not exists idx_chapters_project_order on public.chapters (project_id, order_index);
create index if not exists idx_scenes_chapter_order on public.scenes (chapter_id, order_index);
create index if not exists idx_reviews_project_created_at on public.reviews (project_id, created_at desc);
create index if not exists idx_reviews_scene_created_at on public.reviews (scene_id, created_at desc);
create index if not exists idx_entities_project_name on public.entities (project_id, name);
create index if not exists idx_embeddings_project_scene on public.embeddings (project_id, scene_id);
create index if not exists idx_stats_daily_project_date on public.stats_daily (project_id, date desc);

-- Row Level Security policies
alter table public.projects enable row level security;
alter table public.chapters enable row level security;
alter table public.scenes enable row level security;
alter table public.stats_daily enable row level security;
alter table public.embeddings enable row level security;
alter table public.reviews enable row level security;
alter table public.entities enable row level security;

-- Projects policies
create policy "Users can select own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Helper function to validate ownership via project relationship
create or replace function public.is_project_owner(project uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists(
    select 1 from public.projects p
    where p.id = project and p.user_id = auth.uid()
  );
$$;
-- Chapters policies
create policy "Users can select own chapters" on public.chapters
  for select using (public.is_project_owner(project_id));

create policy "Users can insert own chapters" on public.chapters
  for insert with check (public.is_project_owner(project_id));

create policy "Users can update own chapters" on public.chapters
  for update using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

create policy "Users can delete own chapters" on public.chapters
  for delete using (public.is_project_owner(project_id));

-- Scenes policies
create policy "Users can select own scenes" on public.scenes
  for select using (
    public.is_project_owner(
      (select c.project_id from public.chapters c where c.id = scenes.chapter_id)
    )
  );

create policy "Users can insert own scenes" on public.scenes
  for insert with check (
    public.is_project_owner(
      (select c.project_id from public.chapters c where c.id = scenes.chapter_id)
    )
  );

create policy "Users can update own scenes" on public.scenes
  for update using (
    public.is_project_owner(
      (select c.project_id from public.chapters c where c.id = scenes.chapter_id)
    )
  )
  with check (
    public.is_project_owner(
      (select c.project_id from public.chapters c where c.id = scenes.chapter_id)
    )
  );

create policy "Users can delete own scenes" on public.scenes
  for delete using (
    public.is_project_owner(
      (select c.project_id from public.chapters c where c.id = scenes.chapter_id)
    )
  );

-- Stats policies
create policy "Users can manage own stats" on public.stats_daily
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- Embeddings policies
create policy "Users can manage own embeddings" on public.embeddings
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- Reviews policies
create policy "Users can manage own reviews" on public.reviews
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- Entities policies
create policy "Users can manage own entities" on public.entities
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- Ensure ownership helper is accessible
revoke all on function public.is_project_owner(uuid) from public;
grant execute on function public.is_project_owner(uuid) to authenticated;
