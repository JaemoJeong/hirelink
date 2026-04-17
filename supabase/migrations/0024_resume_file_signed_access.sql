create or replace function public.can_read_resume_file(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_uuid uuid;
  resume_uuid uuid;
begin
  owner_uuid := split_part(object_name, '/', 1)::uuid;

  if owner_uuid = auth.uid() or public.is_platform_admin() then
    return true;
  end if;

  resume_uuid := split_part(object_name, '/', 2)::uuid;

  return exists (
    select 1
    from public.resumes
    join public.applications
      on applications.resume_id = resumes.id
      and applications.user_id = resumes.user_id
    join public.jobs
      on jobs.id = applications.job_id
    where resumes.id = resume_uuid
      and resumes.user_id = owner_uuid
      and public.is_company_member(jobs.company_id)
  );
exception
  when invalid_text_representation then
    return false;
end;
$$;

drop policy if exists "resume owners read resume files" on storage.objects;
drop policy if exists "authorized users read resume files" on storage.objects;

create policy "authorized users read resume files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resume-files'
  and public.can_read_resume_file(name)
);
