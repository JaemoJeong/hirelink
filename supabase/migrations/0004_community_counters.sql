create or replace function public.refresh_community_post_counts(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_post_id is null then
    return;
  end if;

  update public.community_posts
  set
    like_count = (
      select count(*)::integer
      from public.community_reactions
      where post_id = target_post_id
        and kind = 'like'
    ),
    comment_count = (
      select count(*)::integer
      from public.community_comments
      where post_id = target_post_id
    ),
    updated_at = timezone('utc', now())
  where id = target_post_id;
end;
$$;

create or replace function public.sync_community_comment_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('DELETE', 'UPDATE') then
    perform public.refresh_community_post_counts(old.post_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_community_post_counts(new.post_id);
  end if;

  return null;
end;
$$;

create or replace function public.sync_community_reaction_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('DELETE', 'UPDATE') then
    perform public.refresh_community_post_counts(old.post_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_community_post_counts(new.post_id);
  end if;

  return null;
end;
$$;

drop trigger if exists community_comments_refresh_counts on public.community_comments;
create trigger community_comments_refresh_counts
after insert or update or delete on public.community_comments
for each row execute function public.sync_community_comment_counts();

drop trigger if exists community_reactions_refresh_counts on public.community_reactions;
create trigger community_reactions_refresh_counts
after insert or update or delete on public.community_reactions
for each row execute function public.sync_community_reaction_counts();

update public.community_posts as posts
set
  comment_count = (
    select count(*)::integer
    from public.community_comments as comments
    where comments.post_id = posts.id
  ),
  like_count = (
    select count(*)::integer
    from public.community_reactions as reactions
    where reactions.post_id = posts.id
      and reactions.kind = 'like'
  );
