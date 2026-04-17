alter table public.companies
add column if not exists tagline text,
add column if not exists mission text,
add column if not exists culture text,
add column if not exists benefits jsonb not null default '[]'::jsonb,
add column if not exists hiring_process jsonb not null default '[]'::jsonb;

create or replace function public.partner_update_company_profile(
  target_company_id uuid,
  company_name text,
  company_category text default null,
  company_website_url text default null,
  company_headquarters text default null,
  company_description text default null,
  company_tagline text default null,
  company_mission text default null,
  company_culture text default null,
  company_benefits jsonb default '[]'::jsonb,
  company_hiring_process jsonb default '[]'::jsonb
)
returns table (
  id uuid,
  slug text,
  name text,
  category text,
  website_url text,
  description text,
  headquarters text,
  tagline text,
  mission text,
  culture text,
  benefits jsonb,
  hiring_process jsonb
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
    description = nullif(trim(company_description), ''),
    tagline = nullif(trim(company_tagline), ''),
    mission = nullif(trim(company_mission), ''),
    culture = nullif(trim(company_culture), ''),
    benefits = coalesce(company_benefits, '[]'::jsonb),
    hiring_process = coalesce(company_hiring_process, '[]'::jsonb)
  where companies.id = target_company.id
  returning
    companies.id,
    companies.slug,
    companies.name,
    companies.category,
    companies.website_url,
    companies.description,
    companies.headquarters,
    companies.tagline,
    companies.mission,
    companies.culture,
    companies.benefits,
    companies.hiring_process;
end;
$$;

grant execute on function public.partner_update_company_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  jsonb
) to authenticated;
