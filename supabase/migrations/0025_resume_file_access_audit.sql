create or replace function public.log_resume_file_access(target_file_path text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  resume_uuid uuid;
  log_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.can_read_resume_file(target_file_path) then
    raise exception 'Not allowed to read this resume file';
  end if;

  resume_uuid := split_part(target_file_path, '/', 2)::uuid;

  insert into public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    payload
  )
  values (
    current_user_id,
    'resume_file',
    resume_uuid,
    'signed_url_created',
    jsonb_build_object(
      'file_path', target_file_path,
      'bucket', 'resume-files'
    )
  )
  returning id into log_id;

  return log_id;
exception
  when invalid_text_representation then
    raise exception 'Invalid resume file path';
end;
$$;

grant execute on function public.log_resume_file_access(text) to authenticated;
