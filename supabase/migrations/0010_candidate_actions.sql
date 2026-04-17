create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (job_id, user_id)
);

create index if not exists saved_jobs_user_id_idx on public.saved_jobs(user_id);
create index if not exists saved_jobs_job_id_idx on public.saved_jobs(job_id);

alter table public.saved_jobs enable row level security;

create policy "users manage own saved jobs"
on public.saved_jobs
for all
to authenticated
using (user_id = auth.uid() or public.is_platform_admin())
with check (user_id = auth.uid() or public.is_platform_admin());

create or replace function public.candidate_withdraw_application(
  target_application_id uuid,
  withdrawal_note text default null
)
returns table (
  application_id uuid,
  applicant_user_id uuid,
  from_status text,
  to_status text,
  changed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_application public.applications%rowtype;
  normalized_note text;
  history_created_at timestamptz;
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

  if target_application.user_id <> current_user_id and not public.is_platform_admin() then
    raise exception 'Not allowed to withdraw this application';
  end if;

  if target_application.status = 'withdrawn' then
    raise exception 'Application is already withdrawn';
  end if;

  if target_application.status not in ('submitted', 'reviewing', 'interview') then
    raise exception 'Application cannot be withdrawn from status: %', target_application.status;
  end if;

  normalized_note := nullif(trim(withdrawal_note), '');

  update public.applications
  set status = 'withdrawn'
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
    'withdrawn',
    current_user_id,
    coalesce(normalized_note, 'Candidate withdrew application')
  )
  returning created_at into history_created_at;

  insert into public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    payload
  )
  values (
    current_user_id,
    'application',
    target_application.id,
    'candidate_withdrew_application',
    jsonb_build_object(
      'from_status', target_application.status,
      'to_status', 'withdrawn',
      'note', normalized_note
    )
  );

  return query
  select
    target_application.id,
    target_application.user_id,
    target_application.status,
    'withdrawn',
    history_created_at;
end;
$$;

grant execute on function public.candidate_withdraw_application(uuid, text) to authenticated;
