insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'company-assets',
  'company-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_manage_company_asset(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  company_uuid uuid;
begin
  company_uuid := split_part(object_name, '/', 1)::uuid;
  return public.is_company_member(company_uuid) or public.is_platform_admin();
exception
  when invalid_text_representation then
    return false;
end;
$$;

create policy "public read company assets"
on storage.objects
for select
using (bucket_id = 'company-assets');

create policy "company members upload company assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-assets'
  and public.can_manage_company_asset(name)
);

create policy "company members update company assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'company-assets'
  and public.can_manage_company_asset(name)
)
with check (
  bucket_id = 'company-assets'
  and public.can_manage_company_asset(name)
);

create policy "company members delete company assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'company-assets'
  and public.can_manage_company_asset(name)
);
