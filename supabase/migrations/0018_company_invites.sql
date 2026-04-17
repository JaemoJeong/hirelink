create table if not exists public.company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  member_role text not null default 'recruiter',
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  status text not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '14 days'),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists company_invites_company_id_idx on public.company_invites(company_id);
create index if not exists company_invites_token_idx on public.company_invites(token);
create index if not exists company_invites_email_idx on public.company_invites(lower(email));

alter table public.company_invites enable row level security;

create policy "company members and invitees read invites"
on public.company_invites
for select
to authenticated
using (
  public.is_company_member(company_id)
  or public.is_platform_admin()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "company members create invites"
on public.company_invites
for insert
to authenticated
with check (
  public.is_company_member(company_id)
  or public.is_platform_admin()
);

create policy "admins update company invites"
on public.company_invites
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create or replace function public.partner_create_company_invite(
  target_company_id uuid,
  invitee_email text,
  invitee_role text default 'recruiter'
)
returns table (
  invite_id uuid,
  company_id uuid,
  email text,
  member_role text,
  token text,
  invite_path text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  normalized_email text;
  normalized_role text;
  created_invite public.company_invites%rowtype;
begin
  current_user_id := auth.uid();
  normalized_email := lower(trim(invitee_email));
  normalized_role := case
    when invitee_role in ('recruiter', 'hiring_manager', 'viewer') then invitee_role
    else 'recruiter'
  end;

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_email is null or normalized_email = '' or position('@' in normalized_email) = 0 then
    raise exception 'Invitee email is required';
  end if;

  if not public.is_company_member(target_company_id) and not public.is_platform_admin() then
    raise exception 'Not allowed to invite company members';
  end if;

  update public.company_invites
  set status = 'expired'
  where company_id = target_company_id
    and lower(email) = normalized_email
    and status = 'pending';

  insert into public.company_invites (
    company_id,
    email,
    member_role,
    created_by
  )
  values (
    target_company_id,
    normalized_email,
    normalized_role,
    current_user_id
  )
  returning * into created_invite;

  return query
  select
    created_invite.id,
    created_invite.company_id,
    created_invite.email,
    created_invite.member_role,
    created_invite.token,
    format('/partner-invite/%s', created_invite.token),
    created_invite.expires_at;
end;
$$;

grant execute on function public.partner_create_company_invite(uuid, text, text) to authenticated;

create or replace function public.accept_company_invite(invite_token text)
returns table (
  invite_id uuid,
  company_id uuid,
  company_slug text,
  company_name text,
  member_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_email text;
  target_invite public.company_invites%rowtype;
  target_company public.companies%rowtype;
begin
  current_user_id := auth.uid();
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_invite
  from public.company_invites
  where token = trim(invite_token)
  limit 1;

  if target_invite.id is null then
    raise exception 'Invite not found';
  end if;

  if target_invite.status <> 'pending' then
    raise exception 'Invite is not pending';
  end if;

  if target_invite.expires_at < timezone('utc', now()) then
    update public.company_invites
    set status = 'expired'
    where id = target_invite.id;
    raise exception 'Invite has expired';
  end if;

  if lower(target_invite.email) <> current_email and not public.is_platform_admin() then
    raise exception 'Invite email does not match the signed-in account';
  end if;

  select *
  into target_company
  from public.companies
  where id = target_invite.company_id
  limit 1;

  if target_company.id is null then
    raise exception 'Company not found';
  end if;

  insert into public.company_members (
    company_id,
    user_id,
    member_role,
    is_owner
  )
  values (
    target_company.id,
    current_user_id,
    target_invite.member_role,
    false
  )
  on conflict (company_id, user_id) do update
  set member_role = excluded.member_role;

  update public.company_invites
  set
    status = 'accepted',
    accepted_by = current_user_id,
    accepted_at = timezone('utc', now())
  where id = target_invite.id;

  return query
  select
    target_invite.id,
    target_company.id,
    target_company.slug,
    target_company.name,
    target_invite.member_role;
end;
$$;

grant execute on function public.accept_company_invite(text) to authenticated;
