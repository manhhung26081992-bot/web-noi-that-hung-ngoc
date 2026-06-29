-- SEO Dashboard v4.0 schema
-- Chạy trong Supabase SQL Editor nếu muốn dùng đầy đủ các module mới.

alter table public.seo_keywords add column if not exists cluster text default '';
alter table public.seo_keywords add column if not exists intent text default '';
alter table public.seo_keywords add column if not exists current_click integer not null default 0;
alter table public.seo_keywords add column if not exists created_at timestamptz default now();

alter table public.seo_logs add column if not exists type text default 'ghi chú SEO';
alter table public.seo_logs add column if not exists title text default '';
alter table public.seo_logs add column if not exists description text default '';
alter table public.seo_logs add column if not exists related_url text default '';
alter table public.seo_logs add column if not exists cluster text default '';

create table if not exists public.seo_clusters (
  id text primary key,
  name text not null,
  main_url text not null default '/',
  priority integer not null default 3,
  status text not null default 'chờ dữ liệu',
  product_count integer not null default 0,
  post_count integer not null default 0,
  internal_link_count integer not null default 0,
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.seo_do_not_touch (
  id text primary key,
  url text not null,
  reason text not null default 'URL mới, chờ Google đánh giá',
  until_date date not null default current_date + interval '7 days',
  status text not null default 'đang theo dõi',
  created_at timestamptz default now()
);

create table if not exists public.seo_competitors (
  id text primary key,
  name text not null,
  domain text not null default '',
  note text default '',
  priority integer not null default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.seo_clusters (id, name, main_url, priority, status, note)
values
  ('cluster-ghe-chan-quy', 'Ghế chân quỳ', '/ghe-chan-quy', 5, 'đang đẩy', 'Cụm ghế văn phòng dễ ra nhu cầu thực.'),
  ('cluster-ban-giam-doc', 'Bàn giám đốc', '/ban-giam-doc', 5, 'đang đẩy', 'Cụm có giá trị đơn hàng tốt.'),
  ('cluster-ban-lam-viec', 'Bàn làm việc', '/ban-van-phong', 4, 'duy trì', 'Cụm rộng, cần gom link nội bộ.'),
  ('cluster-giuong-sat', 'Giường sắt', '/giuong-tang-sat', 4, 'cần bài viết', 'Nên thêm dự án thực tế và ảnh lắp đặt.'),
  ('cluster-tu-locker', 'Tủ locker', '/tu-locker', 4, 'duy trì', 'Cụm phù hợp trường học, nhà máy, văn phòng.'),
  ('cluster-ghe-giam-doc', 'Ghế giám đốc', '/ghe-giam-doc', 3, 'chờ dữ liệu', 'Theo dõi thêm query trước khi sửa nhiều.'),
  ('cluster-truong-hoc', 'Trường học', '/truong-hoc', 3, 'cần sản phẩm', 'Nên bổ sung sản phẩm và bài dự án.')
on conflict (id) do nothing;

grant select, insert, update, delete on public.seo_clusters to anon, authenticated;
grant select, insert, update, delete on public.seo_do_not_touch to anon, authenticated;
grant select, insert, update, delete on public.seo_competitors to anon, authenticated;

alter table public.seo_clusters enable row level security;
alter table public.seo_do_not_touch enable row level security;
alter table public.seo_competitors enable row level security;

drop policy if exists "Allow public manage seo_clusters" on public.seo_clusters;
drop policy if exists "Allow public manage seo_do_not_touch" on public.seo_do_not_touch;
drop policy if exists "Allow public manage seo_competitors" on public.seo_competitors;

create policy "Allow public manage seo_clusters" on public.seo_clusters for all using (true) with check (true);
create policy "Allow public manage seo_do_not_touch" on public.seo_do_not_touch for all using (true) with check (true);
create policy "Allow public manage seo_competitors" on public.seo_competitors for all using (true) with check (true);
