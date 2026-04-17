create table if not exists public.company_info_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  context text,
  status text not null default 'open',
  answer text,
  answered_by uuid references auth.users(id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint company_info_requests_status_check check (status in ('open', 'answered', 'closed'))
);

create index if not exists company_info_requests_company_id_idx
on public.company_info_requests(company_id);

create index if not exists company_info_requests_requester_id_idx
on public.company_info_requests(requester_id);

create or replace trigger company_info_requests_touch_updated_at
before update on public.company_info_requests
for each row execute function public.touch_updated_at();

alter table public.company_info_requests enable row level security;

create policy "users create own company info requests"
on public.company_info_requests
for insert
to authenticated
with check (requester_id = auth.uid());

create policy "users and partners read company info requests"
on public.company_info_requests
for select
to authenticated
using (
  requester_id = auth.uid()
  or public.is_company_member(company_id)
  or public.is_platform_admin()
);

create policy "company members update company info requests"
on public.company_info_requests
for update
to authenticated
using (public.is_company_member(company_id) or public.is_platform_admin())
with check (public.is_company_member(company_id) or public.is_platform_admin());

create or replace function public.notify_company_info_request_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_company_name text;
begin
  select name
  into target_company_name
  from public.companies
  where id = new.company_id;

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  select
    company_members.user_id,
    'company_info_request',
    coalesce(target_company_name, '파트너 기업') || ' 기업 정보 질문',
    left(new.question, 180),
    '/partner-dashboard'
  from public.company_members
  where company_members.company_id = new.company_id;

  return new;
end;
$$;

drop trigger if exists company_info_request_notify_partner on public.company_info_requests;

create trigger company_info_request_notify_partner
after insert on public.company_info_requests
for each row execute function public.notify_company_info_request_created();

create or replace function public.partner_answer_company_info_request(
  target_request_id uuid,
  answer_body text,
  next_status text default 'answered'
)
returns table (
  id uuid,
  status text,
  answer text,
  answered_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_request public.company_info_requests%rowtype;
  normalized_answer text;
  normalized_status text;
begin
  current_user_id := auth.uid();
  normalized_answer := nullif(trim(answer_body), '');
  normalized_status := coalesce(nullif(trim(next_status), ''), 'answered');

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_answer is null then
    raise exception 'Answer is required';
  end if;

  if normalized_status not in ('answered', 'closed') then
    raise exception 'Invalid request status';
  end if;

  select *
  into target_request
  from public.company_info_requests
  where company_info_requests.id = target_request_id
  limit 1;

  if target_request.id is null then
    raise exception 'Company info request not found';
  end if;

  if not public.is_company_member(target_request.company_id) and not public.is_platform_admin() then
    raise exception 'Not allowed to answer this company info request';
  end if;

  update public.company_info_requests
  set
    answer = normalized_answer,
    status = normalized_status,
    answered_by = current_user_id,
    answered_at = timezone('utc', now())
  where company_info_requests.id = target_request_id
  returning
    company_info_requests.id,
    company_info_requests.status,
    company_info_requests.answer,
    company_info_requests.answered_at
  into id, status, answer, answered_at;

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  values (
    target_request.requester_id,
    'company_info_answer',
    '기업 정보 질문에 답변이 도착했습니다',
    left(normalized_answer, 180),
    '/companies'
  );

  return next;
end;
$$;

grant execute on function public.partner_answer_company_info_request(uuid, text, text) to authenticated;
