create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists staff_org_id_idx on public.staff (org_id);
create index if not exists staff_org_is_active_idx on public.staff (org_id, is_active);

alter table public.staff enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff'
      and policyname = 'staff_org_members_select'
  ) then
    create policy staff_org_members_select
      on public.staff
      for select
      using (
        exists (
          select 1
          from public.org_members om
          where om.org_id = staff.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff'
      and policyname = 'staff_org_members_insert'
  ) then
    create policy staff_org_members_insert
      on public.staff
      for insert
      with check (
        exists (
          select 1
          from public.org_members om
          where om.org_id = staff.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff'
      and policyname = 'staff_org_members_update'
  ) then
    create policy staff_org_members_update
      on public.staff
      for update
      using (
        exists (
          select 1
          from public.org_members om
          where om.org_id = staff.org_id
            and om.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.org_members om
          where om.org_id = staff.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

create table if not exists public.staff_appointment_types (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  appointment_type_id uuid not null references public.appointment_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (staff_id, appointment_type_id)
);

create index if not exists staff_appointment_types_staff_id_idx
  on public.staff_appointment_types (staff_id);
create index if not exists staff_appointment_types_appointment_type_id_idx
  on public.staff_appointment_types (appointment_type_id);

alter table public.staff_appointment_types enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff_appointment_types'
      and policyname = 'staff_appointment_types_org_members_select'
  ) then
    create policy staff_appointment_types_org_members_select
      on public.staff_appointment_types
      for select
      using (
        exists (
          select 1
          from public.staff s
          join public.org_members om on om.org_id = s.org_id
          where s.id = staff_appointment_types.staff_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff_appointment_types'
      and policyname = 'staff_appointment_types_org_members_insert'
  ) then
    create policy staff_appointment_types_org_members_insert
      on public.staff_appointment_types
      for insert
      with check (
        exists (
          select 1
          from public.staff s
          join public.org_members om on om.org_id = s.org_id
          where s.id = staff_appointment_types.staff_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff_appointment_types'
      and policyname = 'staff_appointment_types_org_members_update'
  ) then
    create policy staff_appointment_types_org_members_update
      on public.staff_appointment_types
      for update
      using (
        exists (
          select 1
          from public.staff s
          join public.org_members om on om.org_id = s.org_id
          where s.id = staff_appointment_types.staff_id
            and om.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.staff s
          join public.org_members om on om.org_id = s.org_id
          where s.id = staff_appointment_types.staff_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'staff_id'
  ) then
    alter table public.appointments add column staff_id uuid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_staff_id_fkey'
  ) then
    alter table public.appointments
      add constraint appointments_staff_id_fkey
      foreign key (staff_id) references public.staff(id) on delete restrict;
  end if;
end
$$;

create index if not exists appointments_staff_id_idx on public.appointments (staff_id);
create index if not exists appointments_org_staff_start_at_idx
  on public.appointments (org_id, staff_id, start_at);

with distinct_orgs as (
  select distinct org_id from public.org_members
  union
  select distinct org_id from public.appointment_types
  union
  select distinct org_id from public.appointments
  union
  select distinct org_id from public.clients
  union
  select distinct org_id from public.working_hours
)
insert into public.staff (org_id, name, is_active)
select org_id, 'Varsayılan Personel', true
from distinct_orgs
where org_id is not null
  and not exists (
    select 1
    from public.staff s
    where s.org_id = distinct_orgs.org_id
  );

insert into public.staff_appointment_types (staff_id, appointment_type_id)
select s.id, at.id
from public.staff s
join public.appointment_types at on at.org_id = s.org_id
where not exists (
  select 1
  from public.staff_appointment_types sat
  where sat.staff_id = s.id
    and sat.appointment_type_id = at.id
);

update public.appointments a
set staff_id = (
  select st.id
  from public.staff st
  where st.org_id = a.org_id
  order by st.created_at asc, st.id asc
  limit 1
)
where a.staff_id is null;

alter table public.appointments
  alter column staff_id set not null;

alter table public.appointments
  drop constraint if exists appointments_no_overlap;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_overlap_by_staff'
  ) then
    alter table public.appointments
      add constraint appointments_no_overlap_by_staff
      exclude using gist (
        staff_id with =,
        tstzrange(start_at, end_at, '[)') with &&
      )
      where (status <> 'cancelled');
  end if;
end
$$;
