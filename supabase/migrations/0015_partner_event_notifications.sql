create or replace function public.notify_company_members_on_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_job public.jobs%rowtype;
begin
  select *
  into target_job
  from public.jobs
  where jobs.id = new.job_id
  limit 1;

  if target_job.id is null then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  select
    company_members.user_id,
    'partner_new_application',
    '새 지원서가 도착했습니다',
    format('"%s" 공고에 새 지원서가 접수되었습니다.', target_job.title),
    '/partner-dashboard'
  from public.company_members
  where company_members.company_id = target_job.company_id
    and company_members.user_id <> new.user_id;

  return new;
end;
$$;

drop trigger if exists applications_notify_company_members on public.applications;
create trigger applications_notify_company_members
after insert on public.applications
for each row
execute function public.notify_company_members_on_application();

create or replace function public.notify_company_members_on_coffee_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_job public.jobs%rowtype;
  target_title text;
begin
  if new.job_id is not null then
    select *
    into target_job
    from public.jobs
    where jobs.id = new.job_id
    limit 1;
  end if;

  target_title := coalesce(target_job.title, '일반 커피챗');

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  select
    company_members.user_id,
    'partner_new_coffee_chat',
    '새 커피챗 요청이 도착했습니다',
    format('"%s" 관련 커피챗 요청이 접수되었습니다.', target_title),
    '/partner-dashboard'
  from public.company_members
  where company_members.company_id = new.company_id
    and company_members.user_id <> new.requester_id;

  return new;
end;
$$;

drop trigger if exists coffee_chats_notify_company_members on public.coffee_chat_requests;
create trigger coffee_chats_notify_company_members
after insert on public.coffee_chat_requests
for each row
execute function public.notify_company_members_on_coffee_chat();
