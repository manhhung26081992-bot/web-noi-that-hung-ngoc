create table if not exists seo_dashboard_store (
  id uuid primary key default gen_random_uuid(),
  store_key text unique not null,
  payload jsonb not null default '{}'::jsonb,
  version text not null default 'v11.2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_dashboard_store_key_idx
on seo_dashboard_store (store_key);
