create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region_code text not null,
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.university_domains (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  domain text not null unique,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  user_role text not null default 'candidate',
  school_email text,
  university_id uuid references public.universities(id),
  major text,
  graduation_year integer,
  headline text,
  bio text,
  avatar_path text,
  verification_status text not null default 'pending',
  verification_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text,
  website_url text,
  description text,
  headquarters text,
  is_partner boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'recruiter',
  is_owner boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (company_id, user_id)
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  slug text not null unique,
  title text not null,
  role text,
  location text,
  arrangement text,
  experience_label text,
  education_label text,
  summary text,
  description text,
  responsibilities jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  perks jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  deadline_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.job_tags (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (job_id, tag)
);

create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  created_by uuid references auth.users(id),
  code text not null unique,
  landing_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_link_id uuid not null references public.referral_links(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  session_key text,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  template_key text,
  headline text,
  summary text,
  visibility text not null default 'private',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  version_number integer not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (resume_id, version_number)
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  source_referral_link_id uuid references public.referral_links(id) on delete set null,
  status text not null default 'submitted',
  cover_note text,
  applied_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (job_id, user_id)
);

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coffee_chat_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  requester_id uuid not null references auth.users(id) on delete cascade,
  responder_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'requested',
  request_message text,
  scheduled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.community_categories(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  tags text[] not null default '{}'::text[],
  like_count integer not null default 0,
  comment_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.community_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'like',
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, user_id, kind)
);

create table if not exists public.inbox_threads (
  id uuid primary key default gen_random_uuid(),
  subject text,
  company_id uuid references public.companies(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.inbox_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_role text not null default 'member',
  last_read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (thread_id, user_id)
);

create table if not exists public.thread_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.inbox_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link_path text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists universities_region_code_idx on public.universities(region_code);
create index if not exists university_domains_university_id_idx on public.university_domains(university_id);
create index if not exists profiles_university_id_idx on public.profiles(university_id);
create index if not exists company_members_user_id_idx on public.company_members(user_id);
create index if not exists jobs_company_id_idx on public.jobs(company_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists referral_links_company_id_idx on public.referral_links(company_id);
create index if not exists referral_events_referral_link_id_idx on public.referral_events(referral_link_id);
create index if not exists resumes_user_id_idx on public.resumes(user_id);
create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists coffee_chat_requests_requester_id_idx on public.coffee_chat_requests(requester_id);
create index if not exists community_posts_author_id_idx on public.community_posts(author_id);
create index if not exists community_comments_post_id_idx on public.community_comments(post_id);
create index if not exists community_reactions_post_id_idx on public.community_reactions(post_id);
create index if not exists thread_participants_user_id_idx on public.thread_participants(user_id);
create index if not exists thread_messages_thread_id_idx on public.thread_messages(thread_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and user_role = 'platform_admin'
  );
$$;

create or replace function public.is_company_member(company_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.company_members
    where company_id = company_uuid
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_thread_participant(thread_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.thread_participants
    where thread_id = thread_uuid
      and user_id = auth.uid()
  );
$$;

create or replace trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace trigger companies_touch_updated_at
before update on public.companies
for each row execute function public.touch_updated_at();

create or replace trigger jobs_touch_updated_at
before update on public.jobs
for each row execute function public.touch_updated_at();

create or replace trigger resumes_touch_updated_at
before update on public.resumes
for each row execute function public.touch_updated_at();

create or replace trigger applications_touch_updated_at
before update on public.applications
for each row execute function public.touch_updated_at();

create or replace trigger coffee_chat_requests_touch_updated_at
before update on public.coffee_chat_requests
for each row execute function public.touch_updated_at();

create or replace trigger community_posts_touch_updated_at
before update on public.community_posts
for each row execute function public.touch_updated_at();

create or replace trigger community_comments_touch_updated_at
before update on public.community_comments
for each row execute function public.touch_updated_at();

create or replace trigger inbox_threads_touch_updated_at
before update on public.inbox_threads
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.jobs enable row level security;
alter table public.job_tags enable row level security;
alter table public.referral_links enable row level security;
alter table public.referral_events enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.coffee_chat_requests enable row level security;
alter table public.community_categories enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.inbox_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.thread_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.universities enable row level security;
alter table public.university_domains enable row level security;

create policy "public read universities"
on public.universities
for select
using (is_active = true or public.is_platform_admin());

create policy "public read university domains"
on public.university_domains
for select
using (is_active = true or public.is_platform_admin());

create policy "users read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_platform_admin());

create policy "users insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_platform_admin());

create policy "users update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_platform_admin())
with check (id = auth.uid() or public.is_platform_admin());

create policy "public read companies"
on public.companies
for select
using (true);

create policy "company members read membership"
on public.company_members
for select
to authenticated
using (user_id = auth.uid() or public.is_company_member(company_id) or public.is_platform_admin());

create policy "company members manage membership"
on public.company_members
for all
to authenticated
using (public.is_company_member(company_id) or public.is_platform_admin())
with check (public.is_company_member(company_id) or public.is_platform_admin());

create policy "public read published jobs"
on public.jobs
for select
using (status = 'published' or public.is_company_member(company_id) or public.is_platform_admin());

create policy "company members manage jobs"
on public.jobs
for all
to authenticated
using (public.is_company_member(company_id) or public.is_platform_admin())
with check (public.is_company_member(company_id) or public.is_platform_admin());

create policy "public read job tags"
on public.job_tags
for select
using (true);

create policy "company members manage job tags"
on public.job_tags
for all
to authenticated
using (
  exists (
    select 1
    from public.jobs
    where jobs.id = job_tags.job_id
      and (public.is_company_member(jobs.company_id) or public.is_platform_admin())
  )
)
with check (
  exists (
    select 1
    from public.jobs
    where jobs.id = job_tags.job_id
      and (public.is_company_member(jobs.company_id) or public.is_platform_admin())
  )
);

create policy "company members manage referral links"
on public.referral_links
for all
to authenticated
using (public.is_company_member(company_id) or public.is_platform_admin())
with check (public.is_company_member(company_id) or public.is_platform_admin());

create policy "company members read referral events"
on public.referral_events
for select
to authenticated
using (
  exists (
    select 1
    from public.referral_links
    where referral_links.id = referral_events.referral_link_id
      and (public.is_company_member(referral_links.company_id) or public.is_platform_admin())
  )
);

create policy "users manage own resumes"
on public.resumes
for all
to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());

create policy "users manage own resume versions"
on public.resume_versions
for all
to authenticated
using (
  exists (
    select 1
    from public.resumes
    where resumes.id = resume_versions.resume_id
      and (resumes.user_id = auth.uid() or public.is_platform_admin())
  )
)
with check (
  exists (
    select 1
    from public.resumes
    where resumes.id = resume_versions.resume_id
      and (resumes.user_id = auth.uid() or public.is_platform_admin())
  )
);

create policy "users and partners read applications"
on public.applications
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.jobs
    where jobs.id = applications.job_id
      and public.is_company_member(jobs.company_id)
  )
);

create policy "users create own applications"
on public.applications
for insert
to authenticated
with check (user_id = auth.uid());

create policy "users and partners update applications"
on public.applications
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.jobs
    where jobs.id = applications.job_id
      and public.is_company_member(jobs.company_id)
  )
)
with check (
  user_id = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.jobs
    where jobs.id = applications.job_id
      and public.is_company_member(jobs.company_id)
  )
);

create policy "users and partners read application history"
on public.application_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.applications
    join public.jobs on jobs.id = applications.job_id
    where applications.id = application_status_history.application_id
      and (
        applications.user_id = auth.uid()
        or public.is_company_member(jobs.company_id)
        or public.is_platform_admin()
      )
  )
);

create policy "partners append application history"
on public.application_status_history
for insert
to authenticated
with check (
  exists (
    select 1
    from public.applications
    join public.jobs on jobs.id = applications.job_id
    where applications.id = application_status_history.application_id
      and (
        applications.user_id = auth.uid()
        or public.is_company_member(jobs.company_id)
        or public.is_platform_admin()
      )
  )
);

create policy "users and partners read coffee chats"
on public.coffee_chat_requests
for select
to authenticated
using (
  requester_id = auth.uid()
  or responder_user_id = auth.uid()
  or public.is_company_member(company_id)
  or public.is_platform_admin()
);

create policy "users create coffee chats"
on public.coffee_chat_requests
for insert
to authenticated
with check (requester_id = auth.uid());

create policy "participants update coffee chats"
on public.coffee_chat_requests
for update
to authenticated
using (
  requester_id = auth.uid()
  or responder_user_id = auth.uid()
  or public.is_company_member(company_id)
  or public.is_platform_admin()
)
with check (
  requester_id = auth.uid()
  or responder_user_id = auth.uid()
  or public.is_company_member(company_id)
  or public.is_platform_admin()
);

create policy "public read community categories"
on public.community_categories
for select
using (true);

create policy "public read community posts"
on public.community_posts
for select
using (published_at is not null or author_id = auth.uid() or public.is_platform_admin());

create policy "users create community posts"
on public.community_posts
for insert
to authenticated
with check (author_id = auth.uid());

create policy "users update own community posts"
on public.community_posts
for update
to authenticated
using (author_id = auth.uid() or public.is_platform_admin())
with check (author_id = auth.uid() or public.is_platform_admin());

create policy "public read community comments"
on public.community_comments
for select
using (true);

create policy "users create community comments"
on public.community_comments
for insert
to authenticated
with check (author_id = auth.uid());

create policy "users update own community comments"
on public.community_comments
for update
to authenticated
using (author_id = auth.uid() or public.is_platform_admin())
with check (author_id = auth.uid() or public.is_platform_admin());

create policy "users manage own reactions"
on public.community_reactions
for all
to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());

create policy "participants read inbox threads"
on public.inbox_threads
for select
to authenticated
using (public.is_thread_participant(id) or public.is_platform_admin());

create policy "participants create inbox threads"
on public.inbox_threads
for insert
to authenticated
with check (created_by = auth.uid() or public.is_platform_admin());

create policy "participants update inbox threads"
on public.inbox_threads
for update
to authenticated
using (public.is_thread_participant(id) or public.is_platform_admin())
with check (public.is_thread_participant(id) or public.is_platform_admin());

create policy "participants read thread participants"
on public.thread_participants
for select
to authenticated
using (public.is_thread_participant(thread_id) or public.is_platform_admin());

create policy "participants manage thread participants"
on public.thread_participants
for all
to authenticated
using (public.is_thread_participant(thread_id) or public.is_platform_admin())
with check (public.is_thread_participant(thread_id) or public.is_platform_admin());

create policy "participants read thread messages"
on public.thread_messages
for select
to authenticated
using (public.is_thread_participant(thread_id) or public.is_platform_admin());

create policy "participants create thread messages"
on public.thread_messages
for insert
to authenticated
with check (sender_id = auth.uid() and public.is_thread_participant(thread_id));

create policy "users manage own notifications"
on public.notifications
for all
to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());

create policy "admins read audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_platform_admin());

insert into public.community_categories (slug, name)
values
  ('coffee-chat', '커피챗 팁'),
  ('job-review', '채용 후기'),
  ('school-verification', '학교 인증')
on conflict (slug) do nothing;

insert into public.universities (name, region_code, website_url)
values
  ('서울대학교', 'KR', 'https://www.snu.ac.kr'),
  ('연세대학교', 'KR', 'https://www.yonsei.ac.kr'),
  ('고려대학교', 'KR', 'https://www.korea.ac.kr'),
  ('KAIST', 'KR', 'https://www.kaist.ac.kr'),
  ('POSTECH', 'KR', 'https://www.postech.ac.kr'),
  ('MIT', 'US', 'https://web.mit.edu'),
  ('Stanford University', 'US', 'https://www.stanford.edu')
on conflict (name) do nothing;

insert into public.university_domains (university_id, domain, is_primary)
select id, domain, true
from (
  values
    ('서울대학교', 'snu.ac.kr'),
    ('연세대학교', 'yonsei.ac.kr'),
    ('고려대학교', 'korea.ac.kr'),
    ('KAIST', 'kaist.ac.kr'),
    ('POSTECH', 'postech.ac.kr'),
    ('MIT', 'mit.edu'),
    ('Stanford University', 'stanford.edu')
) as seed(university_name, domain)
join public.universities on universities.name = seed.university_name
on conflict (domain) do nothing;
