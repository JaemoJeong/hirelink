create or replace function public.partner_update_application_status(
  target_application_id uuid,
  next_status text,
  partner_note text default null
)
returns table (
  application_id uuid,
  applicant_user_id uuid,
  to_status text,
  notification_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_application public.applications%rowtype;
  target_job public.jobs%rowtype;
  created_notification_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_application
  from public.applications
  where id = target_application_id
  limit 1;

  if target_application.id is null then
    raise exception 'Application not found';
  end if;

  select *
  into target_job
  from public.jobs
  where id = target_application.job_id
  limit 1;

  if target_job.id is null then
    raise exception 'Job not found for application';
  end if;

  if not public.is_company_member(target_job.company_id) and not public.is_platform_admin() then
    raise exception 'Not allowed to update this application';
  end if;

  update public.applications
  set status = next_status
  where id = target_application.id;

  insert into public.application_status_history (
    application_id,
    from_status,
    to_status,
    changed_by,
    note
  )
  values (
    target_application.id,
    target_application.status,
    next_status,
    current_user_id,
    partner_note
  );

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  values (
    target_application.user_id,
    'application_status_changed',
    '지원 상태가 업데이트되었습니다',
    format('지원하신 "%s" 공고 상태가 %s 로 변경되었습니다.', target_job.title, next_status),
    format('/jobs/%s', target_job.slug)
  )
  returning id into created_notification_id;

  return query
  select
    target_application.id,
    target_application.user_id,
    next_status,
    created_notification_id;
end;
$$;

grant execute on function public.partner_update_application_status(uuid, text, text) to authenticated;
