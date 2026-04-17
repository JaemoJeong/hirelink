-- Development fallback: generates verification code directly in the DB
-- when the Edge Function is not deployed. Returns the code in plain text
-- so the frontend can show it to the developer.
-- In production, use the Edge Function with Resend for real email delivery.

create or replace function public.dev_request_school_email_verification_code(
  target_university_id uuid,
  target_school_email text,
  target_major text default null,
  target_graduation_year integer default null,
  target_headline text default null,
  target_bio text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  normalized_email text;
  email_domain text;
  verification_code text;
  code_salt text;
  code_hash text;
  expires_at_ts timestamptz;
  created_challenge_id uuid;
  masked_email text;
  local_part text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  normalized_email := lower(trim(coalesce(target_school_email, '')));
  email_domain := split_part(normalized_email, '@', 2);

  if target_university_id is null or normalized_email = '' or email_domain = '' then
    raise exception 'University and school email are required';
  end if;

  -- Validate domain
  if not exists (
    select 1
    from public.university_domains
    where university_id = target_university_id
      and lower(domain) = email_domain
      and is_active = true
  ) then
    raise exception 'School email domain is not allowed for the selected university';
  end if;

  -- Throttle: no more than one request per 30 seconds
  if exists (
    select 1
    from public.school_email_verification_challenges
    where user_id = current_user_id
      and consumed_at is null
      and verified_at is null
      and last_sent_at > (timezone('utc', now()) - interval '30 seconds')
  ) then
    raise exception 'Too many requests. Please wait a moment.';
  end if;

  -- Consume any existing open challenges
  update public.school_email_verification_challenges
  set consumed_at = timezone('utc', now())
  where user_id = current_user_id
    and consumed_at is null
    and verified_at is null;

  -- Generate 6-digit code
  verification_code := lpad(floor(random() * 1000000)::text, 6, '0');
  code_salt := replace(gen_random_uuid()::text, '-', '');
  code_hash := encode(digest(code_salt || verification_code, 'sha256'), 'hex');
  expires_at_ts := timezone('utc', now()) + interval '10 minutes';

  -- Create challenge
  insert into public.school_email_verification_challenges (
    user_id, university_id, school_email, requested_major,
    graduation_year, headline, bio,
    code_hash, code_salt, expires_at, last_sent_at
  )
  values (
    current_user_id, target_university_id, normalized_email,
    nullif(trim(target_major), ''),
    target_graduation_year,
    nullif(trim(target_headline), ''),
    nullif(trim(target_bio), ''),
    code_hash, code_salt, expires_at_ts, timezone('utc', now())
  )
  returning id into created_challenge_id;

  -- Upsert profile
  insert into public.profiles (
    id, school_email, university_id, major, graduation_year,
    headline, bio, user_role
  )
  values (
    current_user_id, normalized_email, target_university_id,
    nullif(trim(target_major), ''),
    target_graduation_year,
    nullif(trim(target_headline), ''),
    nullif(trim(target_bio), ''),
    'candidate'
  )
  on conflict (id) do update
  set
    school_email = excluded.school_email,
    university_id = excluded.university_id,
    major = excluded.major,
    graduation_year = excluded.graduation_year,
    headline = excluded.headline,
    bio = excluded.bio;

  -- Mask email for display
  local_part := split_part(normalized_email, '@', 1);
  if length(local_part) <= 2 then
    masked_email := left(local_part, 1) || '*@' || email_domain;
  else
    masked_email := left(local_part, 2) || repeat('*', greatest(2, length(local_part) - 2)) || '@' || email_domain;
  end if;

  return jsonb_build_object(
    'challengeId', created_challenge_id,
    'maskedEmail', masked_email,
    'expiresAt', expires_at_ts,
    'debugCode', verification_code
  );
end;
$$;

grant execute on function public.dev_request_school_email_verification_code(uuid, text, text, integer, text, text) to authenticated;
