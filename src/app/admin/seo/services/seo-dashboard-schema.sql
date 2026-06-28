create table if not exists public.seo_priorities (
  id text primary key,
  keyword text not null,
  rating integer not null default 3 check (rating between 1 and 5),
  note text default '',
  updated_at timestamptz default now()
);

create table if not exists public.seo_tasks (
  id text primary key,
  title text not null,
  completed boolean not null default false,
  task_date date not null default current_date,
  updated_at timestamptz default now()
);

create table if not exists public.seo_notes (
  id text primary key,
  content text not null default '',
  updated_at timestamptz default now()
);

create table if not exists public.seo_index_status (
  id text primary key,
  url text not null,
  created_at timestamptz default now(),
  submitted boolean not null default false,
  indexed boolean not null default false
);

create table if not exists public.seo_keywords (
  id text primary key,
  keyword text not null,
  target_url text not null default '/',
  priority integer not null default 3,
  status text not null default 'Theo dõi',
  current_position integer,
  current_impression integer default 0,
  note text default '',
  updated_at timestamptz default now()
);

create table if not exists public.seo_logs (
  id text primary key,
  log_date date not null default current_date,
  action text not null,
  target text not null,
  note text default '',
  created_at timestamptz default now()
);

create table if not exists public.seo_progress (
  id text primary key,
  cluster text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  note text default '',
  updated_at timestamptz default now()
);

create table if not exists public.seo_goals (
  id text primary key,
  title text not null,
  target_value integer not null default 100,
  current_value integer not null default 0,
  unit text default '',
  note text default '',
  updated_at timestamptz default now()
);

create table if not exists public.seo_local_seo (
  id text primary key,
  name text not null,
  value text default '',
  status text not null default 'warning',
  updated_at timestamptz default now()
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.seo_priorities to anon, authenticated;
grant select, insert, update, delete on public.seo_tasks to anon, authenticated;
grant select, insert, update, delete on public.seo_notes to anon, authenticated;
grant select, insert, update, delete on public.seo_index_status to anon, authenticated;
grant select, insert, update, delete on public.seo_keywords to anon, authenticated;
grant select, insert, update, delete on public.seo_logs to anon, authenticated;
grant select, insert, update, delete on public.seo_progress to anon, authenticated;
grant select, insert, update, delete on public.seo_goals to anon, authenticated;
grant select, insert, update, delete on public.seo_local_seo to anon, authenticated;

alter table public.seo_priorities enable row level security;
alter table public.seo_tasks enable row level security;
alter table public.seo_notes enable row level security;
alter table public.seo_index_status enable row level security;
alter table public.seo_keywords enable row level security;
alter table public.seo_logs enable row level security;
alter table public.seo_progress enable row level security;
alter table public.seo_goals enable row level security;
alter table public.seo_local_seo enable row level security;

drop policy if exists "Cho phep quan tri SEO Priority" on public.seo_priorities;
drop policy if exists "Cho phep quan tri SEO Task" on public.seo_tasks;
drop policy if exists "Cho phep quan tri SEO Note" on public.seo_notes;
drop policy if exists "Cho phep quan tri SEO Index" on public.seo_index_status;
drop policy if exists "Cho phep quan tri SEO Keyword" on public.seo_keywords;
drop policy if exists "Cho phep quan tri SEO Log" on public.seo_logs;
drop policy if exists "Cho phep quan tri SEO Progress" on public.seo_progress;
drop policy if exists "Cho phep quan tri SEO Goal" on public.seo_goals;
drop policy if exists "Cho phep quan tri Local SEO" on public.seo_local_seo;

create policy "Cho phep quan tri SEO Priority" on public.seo_priorities for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri SEO Task" on public.seo_tasks for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri SEO Note" on public.seo_notes for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri SEO Index" on public.seo_index_status for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri SEO Keyword" on public.seo_keywords for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri SEO Log" on public.seo_logs for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri SEO Progress" on public.seo_progress for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri SEO Goal" on public.seo_goals for all to anon, authenticated using (true) with check (true);
create policy "Cho phep quan tri Local SEO" on public.seo_local_seo for all to anon, authenticated using (true) with check (true);
