create or replace function public.partner_update_company_profile(
  target_company_id uuid,
  company_name text,
  company_category text default null,
  company_website_url text default null,
  company_headquarters text default null,
  company_description text default null
)
returns table (
  id uuid,
  slug text,
  name text,
  category text,
  website_url text,
  description text,
  headquarters text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_company public.companies%rowtype;
  cleaned_name text;
begin
  current_user_id := auth.uid();
  cleaned_name := nullif(trim(company_name), '');

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if cleaned_name is null then
    raise exception 'Company name is required';
  end if;

  select *
  into target_company
  from public.companies
  where companies.id = target_company_id
  limit 1;

  if target_company.id is null then
    raise exception 'Company not found';
  end if;

  if not public.is_company_member(target_company.id) and not public.is_platform_admin() then
    raise exception 'Not allowed to update this company profile';
  end if;

  return query
  update public.companies
  set
    name = cleaned_name,
    category = nullif(trim(company_category), ''),
    website_url = nullif(trim(company_website_url), ''),
    headquarters = nullif(trim(company_headquarters), ''),
    description = nullif(trim(company_description), '')
  where companies.id = target_company.id
  returning
    companies.id,
    companies.slug,
    companies.name,
    companies.category,
    companies.website_url,
    companies.description,
    companies.headquarters;
end;
$$;

grant execute on function public.partner_update_company_profile(uuid, text, text, text, text, text) to authenticated;
