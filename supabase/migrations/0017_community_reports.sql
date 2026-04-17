create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reason text not null default 'user_report',
  status text not null default 'open',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint community_reports_target_required check (post_id is not null or comment_id is not null)
);

create index if not exists community_reports_status_idx on public.community_reports(status);
create index if not exists community_reports_post_id_idx on public.community_reports(post_id);
create index if not exists community_reports_comment_id_idx on public.community_reports(comment_id);

alter table public.community_reports enable row level security;

create policy "users create community reports"
on public.community_reports
for insert
to authenticated
with check (reporter_id = auth.uid() or public.is_platform_admin());

create policy "admins read community reports"
on public.community_reports
for select
to authenticated
using (public.is_platform_admin() or reporter_id = auth.uid());

create policy "admins update community reports"
on public.community_reports
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
