create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id uuid references public.universities(id) on delete set null,
  school_email text not null,
  requested_major text,
  graduation_year integer,
  status text not null default 'submitted',
  note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists verification_requests_user_id_idx on public.verification_requests(user_id);
create index if not exists verification_requests_status_idx on public.verification_requests(status);

create or replace trigger verification_requests_touch_updated_at
before update on public.verification_requests
for each row
execute function public.touch_updated_at();

alter table public.verification_requests enable row level security;

create policy "users read own verification requests"
on public.verification_requests
for select
to authenticated
using (user_id = auth.uid() or public.is_platform_admin());

create policy "users create own verification requests"
on public.verification_requests
for insert
to authenticated
with check (user_id = auth.uid() or public.is_platform_admin());

create policy "admins update verification requests"
on public.verification_requests
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create or replace function public.candidate_submit_verification_request(
  target_university_id uuid,
  target_school_email text,
  target_major text default null,
  target_graduation_year integer default null,
  target_headline text default null,
  target_bio text default null
)
returns table (
  request_id uuid,
  profile_id uuid,
  verification_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_profile public.profiles%rowtype;
  normalized_email text;
  email_domain text;
  next_status text;
  created_request_id uuid;
begin
  current_user_id := auth.uid();
  normalized_email := lower(trim(target_school_email));
  email_domain := split_part(normalized_email, '@', 2);

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if target_university_id is null or normalized_email is null or normalized_email = '' or email_domain = '' then
    raise exception 'University and school email are required';
  end if;

  if not exists (
    select 1
    from public.university_domains
    where university_id = target_university_id
      and lower(domain) = email_domain
      and is_active = true
  ) then
    raise exception 'School email domain is not allowed for the selected university';
  end if;

  select *
  into target_profile
  from public.profiles
  where id = current_user_id
  limit 1;

  next_status := case
    when target_profile.verification_status = 'verified'
      and target_profile.university_id = target_university_id
      and lower(coalesce(target_profile.school_email, '')) = normalized_email
    then 'verified'
    else 'submitted'
  end;

  insert into public.profiles (
    id,
    school_email,
    university_id,
    major,
    graduation_year,
    headline,
    bio,
    verification_status,
    user_role
  )
  values (
    current_user_id,
    normalized_email,
    target_university_id,
    nullif(trim(target_major), ''),
    target_graduation_year,
    nullif(trim(target_headline), ''),
    nullif(trim(target_bio), ''),
    next_status,
    'candidate'
  )
  on conflict (id) do update
  set
    school_email = excluded.school_email,
    university_id = excluded.university_id,
    major = excluded.major,
    graduation_year = excluded.graduation_year,
    headline = excluded.headline,
    bio = excluded.bio,
    verification_status = excluded.verification_status,
    verification_completed_at = case
      when excluded.verification_status = 'verified' then public.profiles.verification_completed_at
      else null
    end;

  insert into public.verification_requests (
    user_id,
    university_id,
    school_email,
    requested_major,
    graduation_year,
    status,
    note
  )
  values (
    current_user_id,
    target_university_id,
    normalized_email,
    nullif(trim(target_major), ''),
    target_graduation_year,
    next_status,
    case
      when next_status = 'verified' then 'Profile was already verified for the same university email.'
      else 'Candidate submitted school verification.'
    end
  )
  returning id into created_request_id;

  return query
  select created_request_id, current_user_id, next_status;
end;
$$;

grant execute on function public.candidate_submit_verification_request(uuid, text, text, integer, text, text) to authenticated;

create or replace function public.admin_update_verification_status(
  target_profile_id uuid,
  next_status text,
  admin_note text default null
)
returns table (
  profile_id uuid,
  user_id uuid,
  to_status text,
  notification_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_profile public.profiles%rowtype;
  created_notification_id uuid;
  normalized_note text;
  latest_request_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_platform_admin() then
    raise exception 'Only platform admins can update verification status';
  end if;

  if next_status not in ('pending', 'submitted', 'verified', 'rejected') then
    raise exception 'Invalid verification status: %', next_status;
  end if;

  select *
  into target_profile
  from public.profiles
  where id = target_profile_id
  limit 1;

  if target_profile.id is null then
    raise exception 'Profile not found';
  end if;

  normalized_note := nullif(trim(admin_note), '');

  update public.profiles
  set verification_status = next_status,
      verification_completed_at = case
        when next_status = 'verified' then coalesce(target_profile.verification_completed_at, timezone('utc', now()))
        else null
      end
  where id = target_profile.id;

  select id
  into latest_request_id
  from public.verification_requests
  where user_id = target_profile.id
  order by created_at desc
  limit 1;

  if latest_request_id is not null then
    update public.verification_requests
    set
      status = next_status,
      note = normalized_note,
      reviewed_by = current_user_id,
      reviewed_at = timezone('utc', now())
    where id = latest_request_id;
  end if;

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  values (
    target_profile.id,
    'verification_status_changed',
    '학교 인증 상태가 업데이트되었습니다',
    case
      when next_status = 'pending' then coalesce(normalized_note, '학교 인증 상태가 미인증으로 재설정되었습니다.')
      when next_status = 'verified' then '학교 인증이 승인되었습니다. 이제 인증 완료 프로필로 지원과 커피챗을 진행할 수 있습니다.'
      when next_status = 'rejected' then coalesce(normalized_note, '학교 인증이 반려되었습니다. 입력 정보를 확인한 뒤 다시 제출해 주세요.')
      else coalesce(normalized_note, '학교 인증 상태가 검토중으로 변경되었습니다.')
    end,
    '/verify'
  )
  returning id into created_notification_id;

  insert into public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    payload
  )
  values (
    current_user_id,
    'profile',
    target_profile.id,
    'admin_update_verification_status',
    jsonb_build_object(
      'from_status', target_profile.verification_status,
      'to_status', next_status,
      'note', normalized_note,
      'verification_request_id', latest_request_id
    )
  );

  return query
  select
    target_profile.id,
    target_profile.id,
    next_status,
    created_notification_id;
end;
$$;

grant execute on function public.admin_update_verification_status(uuid, text, text) to authenticated;
