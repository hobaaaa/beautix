alter table public.clients
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists address text,
  add column if not exists is_active boolean not null default true,
  add column if not exists notes text,
  add column if not exists birth_date date;

update public.clients
set
  first_name = coalesce(
    nullif(first_name, ''),
    nullif(split_part(trim(name), ' ', 1), ''),
    'Müşteri'
  ),
  last_name = coalesce(
    nullif(last_name, ''),
    nullif(trim(regexp_replace(trim(name), '^\S+\s*', '')), ''),
    ''
  )
where first_name is null
   or last_name is null;

alter table public.clients
  alter column first_name set not null,
  alter column last_name set not null;

create unique index if not exists clients_org_email_unique_idx
  on public.clients (org_id, lower(email))
  where email is not null;

create index if not exists clients_org_is_active_name_idx
  on public.clients (org_id, is_active, first_name, last_name);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'clients_org_members_select'
  ) then
    create policy clients_org_members_select
      on public.clients
      for select
      using (
        exists (
          select 1 from public.org_members om
          where om.org_id = clients.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'clients_org_members_insert'
  ) then
    create policy clients_org_members_insert
      on public.clients
      for insert
      with check (
        exists (
          select 1 from public.org_members om
          where om.org_id = clients.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'clients_org_members_update'
  ) then
    create policy clients_org_members_update
      on public.clients
      for update
      using (
        exists (
          select 1 from public.org_members om
          where om.org_id = clients.org_id
            and om.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.org_members om
          where om.org_id = clients.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;
