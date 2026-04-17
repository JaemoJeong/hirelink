create or replace function public.enforce_profile_self_service_guards()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  acting_as_admin boolean;
begin
  acting_as_admin := public.is_platform_admin();

  if tg_op = 'INSERT' then
    if not acting_as_admin then
      new.user_role := 'candidate';

      if new.verification_status not in ('pending', 'submitted') then
        new.verification_status := 'pending';
      end if;

      if new.verification_status <> 'verified' then
        new.verification_completed_at := null;
      end if;
    end if;

    return new;
  end if;

  if not acting_as_admin then
    new.user_role := old.user_role;

    if old.verification_status = 'verified' then
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

drop trigger if exists profiles_enforce_self_service_guards on public.profiles;

create trigger profiles_enforce_self_service_guards
before insert or update on public.profiles
for each row execute function public.enforce_profile_self_service_guards();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    user_role,
    school_email,
    university_id,
    verification_status
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    'candidate',
    new.raw_user_meta_data ->> 'school_email',
    nullif(new.raw_user_meta_data ->> 'university_id', '')::uuid,
    'pending'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    school_email = excluded.school_email,
    university_id = excluded.university_id,
    updated_at = timezone('utc', now());

  return new;
end;
$$;
