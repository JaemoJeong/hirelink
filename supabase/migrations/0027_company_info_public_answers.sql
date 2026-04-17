drop policy if exists "public read answered company info requests" on public.company_info_requests;

create policy "public read answered company info requests"
on public.company_info_requests
for select
to anon, authenticated
using (status = 'answered');

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
  target_company_slug text;
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

  select slug
  into target_company_slug
  from public.companies
  where id = target_request.company_id;

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
    case
      when target_company_slug is null then '/companies'
      else '/companies/' || target_company_slug
    end
  );

  return next;
end;
$$;

grant execute on function public.partner_answer_company_info_request(uuid, text, text) to authenticated;
