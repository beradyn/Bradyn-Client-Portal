-- Bradyn portal schema: apply this whole file in the Supabase SQL Editor.
-- No sample/demo users or customer records are inserted.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text not null,
  email text not null,
  phone text not null default '',
  website_name text,
  website_url text,
  preview_url text,
  website_status text not null default 'Building',
  subscription_name text,
  subscription_price numeric(10,2),
  subscription_status text,
  next_billing_date date,
  status text not null default 'Onboarding',
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_email_lower_unique
  on public.clients (lower(email));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'client' check (role in ('client', 'admin')),
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_client_id_idx on public.profiles (client_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Planning',
  stage text not null default 'Planning',
  progress integer not null default 0 check (progress between 0 and 100),
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null default 'Other',
  priority text not null default 'Normal',
  status text not null default 'Submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_client_created_idx
  on public.requests (client_id, created_at desc);

create table if not exists public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_role text not null default 'client' check (author_role in ('client', 'admin')),
  author_name text not null default 'Bradyn user',
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists request_comments_request_created_idx
  on public.request_comments (request_id, created_at);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_role text not null default 'client' check (author_role in ('client', 'admin')),
  author_name text not null default 'Bradyn user',
  body text not null,
  read_by_client boolean not null default false,
  read_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_client_created_idx
  on public.messages (client_id, created_at);

create or replace function public.is_bradyn_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.current_bradyn_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.client_id
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'client'
  limit 1;
$$;

create or replace function public.handle_new_bradyn_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matching_client_id uuid;
  account_name text;
begin
  select c.id
    into matching_client_id
    from public.clients c
   where lower(c.email) = lower(new.email)
   order by c.created_at desc
   limit 1;

  account_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Bradyn user'
  );

  insert into public.profiles (id, email, full_name, role, client_id)
  values (new.id, coalesce(new.email, ''), account_name, 'client', matching_client_id)
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when public.profiles.full_name = '' then excluded.full_name
          else public.profiles.full_name
        end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bradyn on auth.users;
create trigger on_auth_user_created_bradyn
  after insert on auth.users
  for each row execute procedure public.handle_new_bradyn_user();

-- Backfill profiles for Supabase Auth accounts that already exist.
insert into public.profiles (id, email, full_name, role, client_id)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Bradyn user'
  ),
  'client',
  c.id
from auth.users u
left join lateral (
  select id
  from public.clients
  where lower(email) = lower(u.email)
  order by created_at desc
  limit 1
) c on true
on conflict (id) do nothing;

create or replace function public.set_bradyn_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_role_value text;
  author_name_value text;
begin
  select p.role, coalesce(nullif(p.full_name, ''), p.email)
    into author_role_value, author_name_value
    from public.profiles p
   where p.id = auth.uid();

  if author_role_value is null then
    raise exception 'A Bradyn profile is required to post.';
  end if;

  new.author_id := auth.uid();
  new.author_role := author_role_value;
  new.author_name := coalesce(author_name_value, 'Bradyn user');

  if tg_table_name = 'messages' then
    new.read_by_client := false;
    new.read_by_admin := false;
  elsif author_role_value <> 'admin' then
    new.internal := false;
  end if;
  return new;
end;
$$;

drop trigger if exists set_bradyn_comment_author on public.request_comments;
create trigger set_bradyn_comment_author
  before insert on public.request_comments
  for each row execute procedure public.set_bradyn_author();

drop trigger if exists set_bradyn_message_author on public.messages;
create trigger set_bradyn_message_author
  before insert on public.messages
  for each row execute procedure public.set_bradyn_author();

create or replace function public.guard_bradyn_message_read_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_bradyn_admin()
     and new.read_by_admin is distinct from old.read_by_admin then
    raise exception 'Clients cannot update admin read receipts.';
  end if;
  if public.is_bradyn_admin()
     and new.read_by_client is distinct from old.read_by_client then
    raise exception 'Admins cannot update client read receipts.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_bradyn_message_read_updates on public.messages;
create trigger guard_bradyn_message_read_updates
  before update on public.messages
  for each row execute procedure public.guard_bradyn_message_read_updates();

create or replace function public.touch_bradyn_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at
  before update on public.clients
  for each row execute procedure public.touch_bradyn_updated_at();
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_bradyn_updated_at();
drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute procedure public.touch_bradyn_updated_at();
drop trigger if exists requests_touch_updated_at on public.requests;
create trigger requests_touch_updated_at
  before update on public.requests
  for each row execute procedure public.touch_bradyn_updated_at();

create or replace function public.create_client_with_project(
  client_name text,
  client_business text,
  client_email text,
  client_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_client_id uuid;
  project_key text;
begin
  if not public.is_bradyn_admin() then
    raise exception 'Only a Bradyn administrator can create a client.';
  end if;

  insert into public.clients (name, business, email, phone, website_name)
  values (
    nullif(trim(client_name), ''),
    nullif(trim(client_business), ''),
    lower(trim(client_email)),
    coalesce(trim(client_phone), ''),
    nullif(trim(client_business), '')
  )
  returning id into new_client_id;

  project_key := replace(new_client_id::text, '-', '');
  insert into public.projects (client_id, name, description, status, stage, milestones)
  values (
    new_client_id,
    trim(client_business) || ' website',
    'Website project for ' || trim(client_business) || '.',
    'Planning',
    'Planning',
    jsonb_build_array(
      jsonb_build_object('id', project_key || '-1', 'title', 'Planning', 'complete', false),
      jsonb_build_object('id', project_key || '-2', 'title', 'Design', 'complete', false),
      jsonb_build_object('id', project_key || '-3', 'title', 'Development', 'complete', false),
      jsonb_build_object('id', project_key || '-4', 'title', 'Review', 'complete', false),
      jsonb_build_object('id', project_key || '-5', 'title', 'Launch', 'complete', false)
    )
  );

  update public.profiles
     set client_id = new_client_id
   where lower(email) = lower(trim(client_email))
     and role = 'client';

  return new_client_id;
end;
$$;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.requests enable row level security;
alter table public.request_comments enable row level security;
alter table public.messages enable row level security;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_bradyn_admin());
drop policy if exists profiles_update_admin_only on public.profiles;
create policy profiles_update_admin_only on public.profiles
  for update to authenticated
  using (public.is_bradyn_admin())
  with check (public.is_bradyn_admin());

drop policy if exists clients_read_own_or_admin on public.clients;
create policy clients_read_own_or_admin on public.clients
  for select to authenticated
  using (public.is_bradyn_admin() or id = public.current_bradyn_client_id());
drop policy if exists clients_admin_manage on public.clients;
create policy clients_admin_manage on public.clients
  for all to authenticated
  using (public.is_bradyn_admin())
  with check (public.is_bradyn_admin());

drop policy if exists projects_read_own_or_admin on public.projects;
create policy projects_read_own_or_admin on public.projects
  for select to authenticated
  using (public.is_bradyn_admin() or client_id = public.current_bradyn_client_id());
drop policy if exists projects_admin_manage on public.projects;
create policy projects_admin_manage on public.projects
  for all to authenticated
  using (public.is_bradyn_admin())
  with check (public.is_bradyn_admin());

drop policy if exists requests_read_own_or_admin on public.requests;
create policy requests_read_own_or_admin on public.requests
  for select to authenticated
  using (public.is_bradyn_admin() or client_id = public.current_bradyn_client_id());
drop policy if exists requests_insert_own_or_admin on public.requests;
create policy requests_insert_own_or_admin on public.requests
  for insert to authenticated
  with check (
    public.is_bradyn_admin()
    or client_id = public.current_bradyn_client_id()
  );
drop policy if exists requests_admin_manage on public.requests;
create policy requests_admin_manage on public.requests
  for update to authenticated
  using (public.is_bradyn_admin())
  with check (public.is_bradyn_admin());
drop policy if exists requests_admin_delete on public.requests;
create policy requests_admin_delete on public.requests
  for delete to authenticated
  using (public.is_bradyn_admin());

drop policy if exists comments_read_public_or_admin on public.request_comments;
create policy comments_read_public_or_admin on public.request_comments
  for select to authenticated
  using (
    public.is_bradyn_admin()
    or (
      internal = false
      and exists (
        select 1 from public.requests r
        where r.id = request_id
          and r.client_id = public.current_bradyn_client_id()
      )
    )
  );
drop policy if exists comments_insert_own_or_admin on public.request_comments;
create policy comments_insert_own_or_admin on public.request_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and (
          public.is_bradyn_admin()
          or (r.client_id = public.current_bradyn_client_id() and internal = false)
        )
    )
  );

drop policy if exists messages_read_own_or_admin on public.messages;
create policy messages_read_own_or_admin on public.messages
  for select to authenticated
  using (public.is_bradyn_admin() or client_id = public.current_bradyn_client_id());
drop policy if exists messages_insert_own_or_admin on public.messages;
create policy messages_insert_own_or_admin on public.messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.is_bradyn_admin()
      or client_id = public.current_bradyn_client_id()
    )
  );
drop policy if exists messages_update_own_or_admin on public.messages;
create policy messages_update_own_or_admin on public.messages
  for update to authenticated
  using (public.is_bradyn_admin() or client_id = public.current_bradyn_client_id())
  with check (public.is_bradyn_admin() or client_id = public.current_bradyn_client_id());

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.requests to authenticated;
grant select, insert on public.request_comments to authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_by_client, read_by_admin) on public.messages to authenticated;
revoke all on function public.create_client_with_project(text, text, text, text) from public;
grant execute on function public.create_client_with_project(text, text, text, text) to authenticated;