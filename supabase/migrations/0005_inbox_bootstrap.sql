drop policy if exists "thread creators bootstrap participants" on public.thread_participants;
create policy "thread creators bootstrap participants"
on public.thread_participants
for insert
to authenticated
with check (
  public.is_thread_participant(thread_id)
  or public.is_platform_admin()
  or exists (
    select 1
    from public.inbox_threads
    where inbox_threads.id = thread_participants.thread_id
      and inbox_threads.created_by = auth.uid()
  )
);

create or replace function public.touch_inbox_thread_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inbox_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists thread_messages_touch_thread_updated_at on public.thread_messages;
create trigger thread_messages_touch_thread_updated_at
after insert on public.thread_messages
for each row execute function public.touch_inbox_thread_from_message();
