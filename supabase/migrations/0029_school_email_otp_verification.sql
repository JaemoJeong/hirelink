create table if not exists public.school_email_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  school_email text not null,
  requested_major text,
  graduation_year integer,
  headline text,
  bio text,
  code_hash text not null,
  code_salt text not null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists school_email_verification_challenges_user_id_idx
on public.school_email_verification_challenges(user_id);

create index if not exists school_email_verification_challenges_expires_at_idx
on public.school_email_verification_challenges(expires_at);

create or replace trigger school_email_verification_challenges_touch_updated_at
before update on public.school_email_verification_challenges
for each row execute function public.touch_updated_at();

alter table public.school_email_verification_challenges enable row level security;

create policy "users read own school email verification challenges"
on public.school_email_verification_challenges
for select
to authenticated
using (user_id = auth.uid() or public.is_platform_admin());

create or replace function public.enforce_profile_self_service_guards()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  acting_as_admin boolean;
  allow_direct_verification boolean;
begin
  acting_as_admin := public.is_platform_admin();
  allow_direct_verification := coalesce(current_setting('app.allow_candidate_verification', true), '') in ('1', 'true', 'on');

  if tg_op = 'INSERT' then
    if not acting_as_admin then
      new.user_role := 'candidate';

      if allow_direct_verification and new.verification_status = 'verified' then
        new.verification_completed_at := coalesce(new.verification_completed_at, timezone('utc', now()));
      else
        if new.verification_status not in ('pending', 'submitted') then
          new.verification_status := 'pending';
        end if;

        if new.verification_status <> 'verified' then
          new.verification_completed_at := null;
        end if;
      end if;
    end if;

    return new;
  end if;

  if not acting_as_admin then
    new.user_role := old.user_role;

    if allow_direct_verification and new.verification_status = 'verified' then
      new.verification_status := 'verified';
      new.verification_completed_at := coalesce(old.verification_completed_at, new.verification_completed_at, timezone('utc', now()));
    elsif old.verification_status = 'verified' then
      new.verification_status := 'verified';
      new.verification_completed_at := old.verification_completed_at;
    elsif new.verification_status = 'submitted' then
      new.verification_status := 'submitted';
      new.verification_completed_at := null;
    else
      new.verification_status := old.verification_status;
      new.verification_completed_at := old.verification_completed_at;
    end if;
  elsif new.verification_status <> 'verified' then
    new.verification_completed_at := null;
  elsif old.verification_status <> 'verified' and new.verification_completed_at is null then
    new.verification_completed_at := timezone('utc', now());
  end if;

  return new;
end;
$$;

create or replace function public.candidate_confirm_school_email_verification(
  target_challenge_id uuid,
  submitted_code text
)
returns table (
  challenge_id uuid,
  profile_id uuid,
  verification_status text,
  verified_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_challenge public.school_email_verification_challenges%rowtype;
  normalized_code text;
  calculated_hash text;
begin
  current_user_id := auth.uid();
  normalized_code := trim(coalesce(submitted_code, ''));

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if target_challenge_id is null or normalized_code = '' then
    raise exception 'Verification challenge and code are required';
  end if;

  select *
  into target_challenge
  from public.school_email_verification_challenges
  where id = target_challenge_id
    and user_id = current_user_id
  limit 1;

  if target_challenge.id is null then
    raise exception 'Verification challenge not found';
  end if;

  if target_challenge.verified_at is not null or target_challenge.consumed_at is not null then
    raise exception 'Verification challenge is already used';
  end if;

  if target_challenge.expires_at < timezone('utc', now()) then
    raise exception 'Verification code expired';
  end if;

  if target_challenge.attempt_count >= target_challenge.max_attempts then
    raise exception 'Too many verification attempts';
  end if;

  calculated_hash := encode(digest(target_challenge.code_salt || normalized_code, 'sha256'), 'hex');

  if calculated_hash <> target_challenge.code_hash then
    update public.school_email_verification_challenges
    set attempt_count = attempt_count + 1,
        consumed_at = case
          when attempt_count + 1 >= max_attempts then timezone('utc', now())
          else consumed_at
        end
    where id = target_challenge.id;

    raise exception 'Invalid verification code';
  end if;

  perform set_config('app.allow_candidate_verification', '1', true);

  insert into public.profiles (
    id,
    school_email,
    university_id,
    major,
    graduation_year,
    headline,
    bio,
    verification_status,
    verification_completed_at,
    user_role
  )
  values (
    current_user_id,
    lower(target_challenge.school_email),
    target_challenge.university_id,
    nullif(trim(target_challenge.requested_major), ''),
    target_challenge.graduation_year,
    nullif(trim(target_challenge.headline), ''),
    nullif(trim(target_challenge.bio), ''),
    'verified',
    timezone('utc', now()),
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
    verification_status = 'verified',
    verification_completed_at = coalesce(public.profiles.verification_completed_at, timezone('utc', now()));

  update public.school_email_verification_challenges
  set
    verified_at = timezone('utc', now()),
    consumed_at = timezone('utc', now())
  where id = target_challenge.id;

  insert into public.verification_requests (
    user_id,
    university_id,
    school_email,
    requested_major,
    graduation_year,
    status,
    note,
    reviewed_by,
    reviewed_at
  )
  values (
    current_user_id,
    target_challenge.university_id,
    lower(target_challenge.school_email),
    nullif(trim(target_challenge.requested_major), ''),
    target_challenge.graduation_year,
    'verified',
    'School email verified by one-time code.',
    current_user_id,
    timezone('utc', now())
  );

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
    current_user_id,
    'candidate_confirm_school_email_verification',
    jsonb_build_object(
      'challenge_id', target_challenge.id,
      'school_email', lower(target_challenge.school_email),
      'university_id', target_challenge.university_id
    )
  );

  return query
  select
    target_challenge.id,
    current_user_id,
    'verified'::text,
    timezone('utc', now());
end;
$$;

grant execute on function public.candidate_confirm_school_email_verification(uuid, text) to authenticated;
