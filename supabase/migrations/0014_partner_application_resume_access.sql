create or replace function public.partner_get_application_resume(target_application_id uuid)
returns table (
  application_id uuid,
  resume_id uuid,
  resume_title text,
  template_key text,
  headline text,
  summary text,
  version_number integer,
  version_content jsonb,
  version_created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_application public.applications%rowtype;
  target_job public.jobs%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_application
  from public.applications
  where applications.id = target_application_id
  limit 1;

  if target_application.id is null then
    raise exception 'Application not found';
  end if;

  if target_application.resume_id is null then
    raise exception 'No resume attached to this application';
  end if;

  select *
  into target_job
  from public.jobs
  where jobs.id = target_application.job_id
  limit 1;

  if target_job.id is null then
    raise exception 'Job not found for application';
  end if;

  if not public.is_company_member(target_job.company_id) and not public.is_platform_admin() then
    raise exception 'Not allowed to read this application resume';
  end if;

  return query
  select
    target_application.id,
    resumes.id,
    resumes.title,
    resumes.template_key,
    resumes.headline,
    resumes.summary,
    latest_version.version_number,
    coalesce(latest_version.content, '{}'::jsonb),
    latest_version.created_at
  from public.resumes
  left join lateral (
    select
      resume_versions.version_number,
      resume_versions.content,
      resume_versions.created_at
    from public.resume_versions
    where resume_versions.resume_id = resumes.id
    order by resume_versions.version_number desc
    limit 1
  ) latest_version on true
  where resumes.id = target_application.resume_id
    and resumes.user_id = target_application.user_id;
end;
$$;

grant execute on function public.partner_get_application_resume(uuid) to authenticated;
