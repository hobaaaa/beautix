create index if not exists clients_org_user_id_idx
  on public.clients (org_id, user_id)
  where user_id is not null;

create unique index if not exists clients_org_user_id_unique_idx
  on public.clients (org_id, user_id)
  where user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint constraint_record
    join pg_class table_record on table_record.oid = constraint_record.conrelid
    join pg_namespace schema_record on schema_record.oid = table_record.relnamespace
    where constraint_record.contype = 'f'
      and schema_record.nspname = 'public'
      and table_record.relname = 'clients'
      and pg_get_constraintdef(constraint_record.oid) like
        'FOREIGN KEY (user_id) REFERENCES auth.users(id)%'
  ) then
    alter table public.clients
      add constraint clients_user_id_auth_users_fkey
      foreign key (user_id) references auth.users(id)
      on delete set null
      not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'clients_customer_select_own'
  ) then
    create policy clients_customer_select_own
      on public.clients
      for select
      using (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'appointments'
      and policyname = 'appointments_customer_select_own'
  ) then
    create policy appointments_customer_select_own
      on public.appointments
      for select
      using (
        exists (
          select 1
          from public.clients c
          where c.id = appointments.client_id
            and c.org_id = appointments.org_id
            and c.user_id = auth.uid()
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
      and tablename = 'appointment_types'
      and policyname = 'appointment_types_customer_select_org'
  ) then
    create policy appointment_types_customer_select_org
      on public.appointment_types
      for select
      using (
        exists (
          select 1 from public.clients c
          where c.org_id = appointment_types.org_id
            and c.user_id = auth.uid()
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
      and tablename = 'staff'
      and policyname = 'staff_customer_select_org'
  ) then
    create policy staff_customer_select_org
      on public.staff
      for select
      using (
        exists (
          select 1 from public.clients c
          where c.org_id = staff.org_id
            and c.user_id = auth.uid()
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
      and tablename = 'working_hours'
      and policyname = 'working_hours_customer_select_org'
  ) then
    create policy working_hours_customer_select_org
      on public.working_hours
      for select
      using (
        exists (
          select 1 from public.clients c
          where c.org_id = working_hours.org_id
            and c.user_id = auth.uid()
        )
      );
  end if;
end
$$;

create or replace function public.link_customer_client(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  matching_count integer;
  target_client_id uuid;
  target_user_id uuid;
begin
  if current_user_id is null or current_email = '' then
    return 'unauthenticated';
  end if;

  if exists (
    select 1 from public.clients
    where org_id = p_org_id
      and user_id = current_user_id
  ) then
    return 'linked';
  end if;

  select count(*)
  into matching_count
  from public.clients
  where org_id = p_org_id
    and lower(trim(email)) = current_email;

  if matching_count = 0 then
    return 'not_found';
  end if;

  if matching_count > 1 then
    return 'ambiguous';
  end if;

  select id, user_id
  into target_client_id, target_user_id
  from public.clients
  where org_id = p_org_id
    and lower(trim(email)) = current_email
  for update;

  if target_user_id is not null and target_user_id <> current_user_id then
    return 'conflict';
  end if;

  update public.clients
  set user_id = current_user_id
  where id = target_client_id
    and org_id = p_org_id
    and user_id is null;

  return 'linked';
end;
$$;

revoke all on function public.link_customer_client(uuid) from public;
revoke all on function public.link_customer_client(uuid) from anon;
grant execute on function public.link_customer_client(uuid) to authenticated;

create or replace function public.link_customer_clients()
returns table (
  org_id uuid,
  client_id uuid,
  client_name text,
  client_email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if current_user_id is null or current_email = '' then
    return;
  end if;

  update public.clients c
  set user_id = current_user_id
  where c.user_id is null
    and lower(trim(c.email)) = current_email;

  return query
  select
    c.org_id,
    c.id as client_id,
    coalesce(nullif(c.name, ''), trim(c.first_name || ' ' || c.last_name)) as client_name,
    c.email as client_email
  from public.clients c
  where c.user_id = current_user_id
  order by c.created_at asc;
end;
$$;

revoke all on function public.link_customer_clients() from public;
revoke all on function public.link_customer_clients() from anon;
grant execute on function public.link_customer_clients() to authenticated;
