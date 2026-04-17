create or replace function public.admin_update_job_status(
  target_job_id uuid,
  next_status text,
  admin_note text default null
)
returns table (
  job_id uuid,
  company_id uuid,
  from_status text,
  to_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_job public.jobs%rowtype;
  normalized_note text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_platform_admin() then
    raise exception 'Only platform admins can update job review status';
  end if;

  if next_status not in ('draft', 'pending_review', 'published', 'closed', 'rejected') then
    raise exception 'Invalid job status: %', next_status;
  end if;

  select *
  into target_job
  from public.jobs
  where jobs.id = target_job_id
  limit 1;

  if target_job.id is null then
    raise exception 'Job not found';
  end if;

  normalized_note := nullif(trim(admin_note), '');

  update public.jobs
  set
    status = next_status,
    published_at = case
      when next_status = 'published' then coalesce(target_job.published_at, timezone('utc', now()))
      when next_status in ('draft', 'pending_review', 'rejected') then null
      else target_job.published_at
    end
  where id = target_job.id;

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  select
    company_members.user_id,
    'job_review_status_changed',
    '공고 검수 상태가 업데이트되었습니다',
    case
      when next_status = 'published' then format('"%s" 공고가 승인되어 공개되었습니다.', target_job.title)
      when next_status = 'rejected' then coalesce(normalized_note, format('"%s" 공고가 반려되었습니다. 내용을 수정한 뒤 다시 요청해 주세요.', target_job.title))
      when next_status = 'closed' then format('"%s" 공고가 마감 처리되었습니다.', target_job.title)
      else format('"%s" 공고 상태가 %s 로 변경되었습니다.', target_job.title, next_status)
    end,
    '/partner-dashboard'
  from public.company_members
  where company_members.company_id = target_job.company_id;

  insert into public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    payload
  )
  values (
    current_user_id,
    'job',
    target_job.id,
    'admin_update_job_status',
    jsonb_build_object(
      'from_status', target_job.status,
      'to_status', next_status,
      'note', normalized_note
    )
  );

  return query
  select
    target_job.id,
    target_job.company_id,
    target_job.status,
    next_status;
end;
$$;

grant execute on function public.admin_update_job_status(uuid, text, text) to authenticated;
