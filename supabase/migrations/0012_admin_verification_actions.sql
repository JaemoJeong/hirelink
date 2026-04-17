create or replace function public.admin_update_verification_status(
  target_profile_id uuid,
  next_status text,
  admin_note text default null
)
returns table (
  profile_id uuid,
  user_id uuid,
  to_status text,
  notification_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_profile public.profiles%rowtype;
  created_notification_id uuid;
  normalized_note text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_platform_admin() then
    raise exception 'Only platform admins can update verification status';
  end if;

  if next_status not in ('pending', 'submitted', 'verified', 'rejected') then
    raise exception 'Invalid verification status: %', next_status;
  end if;

  select *
  into target_profile
  from public.profiles
  where id = target_profile_id
  limit 1;

  if target_profile.id is null then
    raise exception 'Profile not found';
  end if;

  normalized_note := nullif(trim(admin_note), '');

  update public.profiles
  set verification_status = next_status,
      verification_completed_at = case
        when next_status = 'verified' then coalesce(target_profile.verification_completed_at, timezone('utc', now()))
        else null
      end
  where id = target_profile.id;

  insert into public.notifications (
    user_id,
    kind,
    title,
    body,
    link_path
  )
  values (
    target_profile.id,
    'verification_status_changed',
    '학교 인증 상태가 업데이트되었습니다',
    case
      when next_status = 'pending' then coalesce(normalized_note, '학교 인증 상태가 미인증으로 재설정되었습니다.')
      when next_status = 'verified' then '학교 인증이 승인되었습니다. 이제 인증 완료 프로필로 지원과 커피챗을 진행할 수 있습니다.'
      when next_status = 'rejected' then coalesce(normalized_note, '학교 인증이 반려되었습니다. 입력 정보를 확인한 뒤 다시 제출해 주세요.')
      else coalesce(normalized_note, '학교 인증 상태가 검토중으로 변경되었습니다.')
    end,
    '/verify'
  )
  returning id into created_notification_id;

  insert into public.audit_logs (
    actor_user_id,
    entity_type,
    entity_id,
    action,
    payload
  )
  values (
    current_user_id,
    'profile',
    target_profile.id,
    'admin_update_verification_status',
    jsonb_build_object(
      'from_status', target_profile.verification_status,
      'to_status', next_status,
      'note', normalized_note
    )
  );

  return query
  select
    target_profile.id,
    target_profile.id,
    next_status,
    created_notification_id;
end;
$$;

grant execute on function public.admin_update_verification_status(uuid, text, text) to authenticated;
