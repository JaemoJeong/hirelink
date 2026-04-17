create or replace function public.get_profile_cards(requested_user_ids uuid[])
returns table (
  id uuid,
  full_name text,
  university_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    coalesce(profiles.full_name, profiles.username, '익명 사용자') as full_name,
    coalesce(universities.name, '') as university_name
  from public.profiles
  left join public.universities on universities.id = profiles.university_id
  where requested_user_ids is not null
    and profiles.id = any(requested_user_ids);
$$;

grant execute on function public.get_profile_cards(uuid[]) to anon;
grant execute on function public.get_profile_cards(uuid[]) to authenticated;
