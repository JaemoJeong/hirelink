create or replace function public.activate_demo_partner_workspace(target_company_slug text)
returns table (
  company_id uuid,
  company_slug text,
  company_name text,
  member_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_company public.companies%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_company
  from public.companies
  where slug = target_company_slug
    and is_partner = true
  limit 1;

  if target_company.id is null then
    raise exception 'Partner company not found';
  end if;

  insert into public.company_members (company_id, user_id, member_role, is_owner)
  values (target_company.id, current_user_id, 'recruiter', false)
  on conflict (company_id, user_id) do update
  set member_role = excluded.member_role;

  return query
  select
    target_company.id,
    target_company.slug,
    target_company.name,
    'recruiter'::text;
end;
$$;

grant execute on function public.activate_demo_partner_workspace(text) to authenticated;
