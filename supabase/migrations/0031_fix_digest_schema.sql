CREATE OR REPLACE FUNCTION public.dev_request_school_email_verification_code(
  target_university_id uuid,
  target_school_email text,
  target_major text default null,
  target_graduation_year integer default null,
  target_headline text default null,
  target_bio text default null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  normalized_email := lower(trim(coalesce(target_school_email, '')));
  email_domain := split_part(normalized_email, '@', 2);

  IF target_university_id IS NULL OR normalized_email = '' OR email_domain = '' THEN
    RAISE EXCEPTION 'University and school email are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.university_domains
    WHERE university_id = target_university_id AND lower(domain) = email_domain AND is_active = true
  ) THEN
    RAISE EXCEPTION 'School email domain is not allowed for the selected university';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.school_email_verification_challenges
    WHERE user_id = current_user_id AND consumed_at IS NULL AND verified_at IS NULL
      AND last_sent_at > (timezone('utc', now()) - interval '30 seconds')
  ) THEN
    RAISE EXCEPTION 'Too many requests. Please wait a moment.';
  END IF;

  UPDATE public.school_email_verification_challenges
  SET consumed_at = timezone('utc', now())
  WHERE user_id = current_user_id AND consumed_at IS NULL AND verified_at IS NULL;

  verification_code := lpad(floor(random() * 1000000)::text, 6, '0');
  code_salt := replace(gen_random_uuid()::text, '-', '');
  code_hash := encode(extensions.digest(code_salt || verification_code, 'sha256'), 'hex');
  expires_at_ts := timezone('utc', now()) + interval '10 minutes';

  INSERT INTO public.school_email_verification_challenges (
    user_id, university_id, school_email, requested_major,
    graduation_year, headline, bio,
    code_hash, code_salt, expires_at, last_sent_at
  ) VALUES (
    current_user_id, target_university_id, normalized_email,
    nullif(trim(target_major), ''), target_graduation_year,
    nullif(trim(target_headline), ''), nullif(trim(target_bio), ''),
    code_hash, code_salt, expires_at_ts, timezone('utc', now())
  ) RETURNING id INTO created_challenge_id;

  INSERT INTO public.profiles (
    id, school_email, university_id, major, graduation_year,
    headline, bio, user_role
  ) VALUES (
    current_user_id, normalized_email, target_university_id,
    nullif(trim(target_major), ''), target_graduation_year,
    nullif(trim(target_headline), ''), nullif(trim(target_bio), ''),
    'candidate'
  ) ON CONFLICT (id) DO UPDATE SET
    school_email = excluded.school_email,
    university_id = excluded.university_id,
    major = excluded.major,
    graduation_year = excluded.graduation_year,
    headline = excluded.headline,
    bio = excluded.bio;

  local_part := split_part(normalized_email, '@', 1);
  IF length(local_part) <= 2 THEN
    masked_email := left(local_part, 1) || '*@' || email_domain;
  ELSE
    masked_email := left(local_part, 2) || repeat('*', greatest(2, length(local_part) - 2)) || '@' || email_domain;
  END IF;

  RETURN jsonb_build_object(
    'challengeId', created_challenge_id,
    'maskedEmail', masked_email,
    'expiresAt', expires_at_ts,
    'debugCode', verification_code
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.candidate_confirm_school_email_verification(
  target_challenge_id uuid,
  submitted_code text
)
RETURNS TABLE (
  challenge_id uuid,
  profile_id uuid,
  verification_status text,
  verified_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  target_challenge public.school_email_verification_challenges%rowtype;
  normalized_code text;
  calculated_hash text;
BEGIN
  current_user_id := auth.uid();
  normalized_code := trim(coalesce(submitted_code, ''));

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF target_challenge_id IS NULL OR normalized_code = '' THEN
    RAISE EXCEPTION 'Verification challenge and code are required';
  END IF;

  SELECT * INTO target_challenge
  FROM public.school_email_verification_challenges
  WHERE id = target_challenge_id AND user_id = current_user_id
  LIMIT 1;

  IF target_challenge.id IS NULL THEN
    RAISE EXCEPTION 'Verification challenge not found';
  END IF;

  IF target_challenge.verified_at IS NOT NULL OR target_challenge.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Verification challenge is already used';
  END IF;

  IF target_challenge.expires_at < timezone('utc', now()) THEN
    RAISE EXCEPTION 'Verification code expired';
  END IF;

  IF target_challenge.attempt_count >= target_challenge.max_attempts THEN
    RAISE EXCEPTION 'Too many verification attempts';
  END IF;

  calculated_hash := encode(extensions.digest(target_challenge.code_salt || normalized_code, 'sha256'), 'hex');

  IF calculated_hash <> target_challenge.code_hash THEN
    UPDATE public.school_email_verification_challenges
    SET attempt_count = attempt_count + 1,
        consumed_at = CASE WHEN attempt_count + 1 >= max_attempts THEN timezone('utc', now()) ELSE consumed_at END
    WHERE id = target_challenge.id;
    RAISE EXCEPTION 'Invalid verification code';
  END IF;

  PERFORM set_config('app.allow_candidate_verification', '1', true);

  INSERT INTO public.profiles (
    id, school_email, university_id, major, graduation_year,
    headline, bio, verification_status, verification_completed_at, user_role
  ) VALUES (
    current_user_id, lower(target_challenge.school_email), target_challenge.university_id,
    nullif(trim(target_challenge.requested_major), ''), target_challenge.graduation_year,
    nullif(trim(target_challenge.headline), ''), nullif(trim(target_challenge.bio), ''),
    'verified', timezone('utc', now()), 'candidate'
  ) ON CONFLICT (id) DO UPDATE SET
    school_email = excluded.school_email,
    university_id = excluded.university_id,
    major = excluded.major,
    graduation_year = excluded.graduation_year,
    headline = excluded.headline,
    bio = excluded.bio,
    verification_status = 'verified',
    verification_completed_at = coalesce(public.profiles.verification_completed_at, timezone('utc', now()));

  UPDATE public.school_email_verification_challenges
  SET verified_at = timezone('utc', now()), consumed_at = timezone('utc', now())
  WHERE id = target_challenge.id;

  INSERT INTO public.verification_requests (
    user_id, university_id, school_email, requested_major, graduation_year,
    status, note, reviewed_by, reviewed_at
  ) VALUES (
    current_user_id, target_challenge.university_id, lower(target_challenge.school_email),
    nullif(trim(target_challenge.requested_major), ''), target_challenge.graduation_year,
    'verified', 'School email verified by one-time code.', current_user_id, timezone('utc', now())
  );

  INSERT INTO public.audit_logs (
    actor_user_id, entity_type, entity_id, action, payload
  ) VALUES (
    current_user_id, 'profile', current_user_id, 'candidate_confirm_school_email_verification',
    jsonb_build_object('challenge_id', target_challenge.id, 'school_email', lower(target_challenge.school_email), 'university_id', target_challenge.university_id)
  );

  RETURN QUERY SELECT target_challenge.id, current_user_id, 'verified'::text, timezone('utc', now());
END;
$$;
