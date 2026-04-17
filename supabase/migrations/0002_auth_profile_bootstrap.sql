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
    coalesce(new.raw_user_meta_data ->> 'user_role', 'candidate'),
    new.raw_user_meta_data ->> 'school_email',
    nullif(new.raw_user_meta_data ->> 'university_id', '')::uuid,
    'pending'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    user_role = excluded.user_role,
    school_email = excluded.school_email,
    university_id = excluded.university_id,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
