create or replace function public.partner_update_coffee_chat_status(
  target_coffee_chat_request_id uuid,
  next_status text,
  partner_note text default null
)
returns table (
  coffee_chat_request_id uuid,
  requester_user_id uuid,
  to_status text,
  notification_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_coffee_chat public.coffee_chat_requests%rowtype;
  target_job public.jobs%rowtype;
  created_notification_id uuid;
  next_status_label text;
  notification_body text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if next_status not in ('requested', 'accepted', 'scheduled', 'completed', 'declined') then
    raise exception 'Invalid coffee chat status: %', next_status;
  end if;

  select *
  into target_coffee_chat
  from public.coffee_chat_requests
  where id = target_coffee_chat_request_id
  limit 1;

  if target_coffee_chat.id is null then
    raise exception 'Coffee chat request not found';
  end if;

  if not public.is_company_member(target_coffee_chat.company_id) and not public.is_platform_admin() then
    raise exception 'Not allowed to update this coffee chat request';
  end if;

  if target_coffee_chat.job_id is not null then
    select *
    into target_job
    from public.jobs
    where id = target_coffee_chat.job_id
    limit 1;
  end if;

  next_status_label := case next_status
    when 'requested' then '요청 접수'
    when 'accepted' then '수락'
    when 'scheduled' then '일정 확정'
    when 'completed' then '완료'
    when 'declined' then '거절'
    else next_status
  end;

  update public.coffee_chat_requests
  set status = next_status,
      responder_user_id = current_user_id
  where id = target_coffee_chat.id;

  notification_body := case
    when target_job.id is not null then
      format('요청하신 "%s" 커피챗 상태가 %s로 변경되었습니다.', target_job.title, next_status_label)
    else
      format('요청하신 커피챗 상태가 %s로 변경되었습니다.', next_status_label)
  end;

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  values (
    target_coffee_chat.requester_id,
    'coffee_chat_status_changed',
    '커피챗 상태가 업데이트되었습니다',
    notification_body,
    case
      when target_job.slug is not null then format('/jobs/%s', target_job.slug)
      else '/inbox'
    end
  )
  returning id into created_notification_id;

  return query
  select
    target_coffee_chat.id,
    target_coffee_chat.requester_id,
    next_status,
    created_notification_id;
end;
$$;

grant execute on function public.partner_update_coffee_chat_status(uuid, text, text) to authenticated;
