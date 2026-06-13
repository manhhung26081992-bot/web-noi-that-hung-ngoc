alter table public.blog_posts
add column if not exists views integer not null default 0;

create or replace function public.increment_blog_view(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.blog_posts
  set views = coalesce(views, 0) + 1
  where trim(both '/' from regexp_replace(slug, '^tin-tuc/+', '')) = trim(both '/' from regexp_replace(p_slug, '^tin-tuc/+', ''));
end;
$$;

grant execute on function public.increment_blog_view(text) to anon;
grant execute on function public.increment_blog_view(text) to authenticated;
