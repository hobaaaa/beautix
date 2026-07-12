do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff_appointment_types'
      and policyname = 'staff_appointment_types_customer_select_org'
  ) then
    create policy staff_appointment_types_customer_select_org
      on public.staff_appointment_types
      for select
      using (
        exists (
          select 1
          from public.staff s
          join public.clients c on c.org_id = s.org_id
          where s.id = staff_appointment_types.staff_id
            and c.user_id = auth.uid()
            and c.is_active = true
        )
      );
  end if;
end
$$;

create or replace function public.get_customer_staff_busy_appointments(
  p_org_id uuid,
  p_staff_id uuid,
  p_day_start timestamptz,
  p_next_day_start timestamptz
)
returns table (
  start_at timestamptz,
  end_at timestamptz,
  status public.appointment_status
)
language sql
security definer
set search_path = public
as $$
  select a.start_at, a.end_at, a.status
  from public.appointments a
  where a.org_id = p_org_id
    and a.staff_id = p_staff_id
    and a.start_at >= p_day_start
    and a.start_at < p_next_day_start
    and exists (
      select 1
      from public.clients c
      where c.org_id = p_org_id
        and c.user_id = auth.uid()
        and c.is_active = true
    );
$$;

revoke all on function public.get_customer_staff_busy_appointments(
  uuid,
  uuid,
  timestamptz,
  timestamptz
) from public;
revoke all on function public.get_customer_staff_busy_appointments(
  uuid,
  uuid,
  timestamptz,
  timestamptz
) from anon;
grant execute on function public.get_customer_staff_busy_appointments(
  uuid,
  uuid,
  timestamptz,
  timestamptz
) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'appointments'
      and policyname = 'appointments_customer_insert_own'
  ) then
    create policy appointments_customer_insert_own
      on public.appointments
      for insert
      with check (
        status = 'confirmed'
        and notes is null
        and exists (
          select 1
          from public.clients c
          where c.id = appointments.client_id
            and c.org_id = appointments.org_id
            and c.user_id = auth.uid()
            and c.is_active = true
        )
        and exists (
          select 1
          from public.appointment_types at
          where at.id = appointments.appointment_type_id
            and at.org_id = appointments.org_id
            and at.is_active = true
        )
        and exists (
          select 1
          from public.staff s
          where s.id = appointments.staff_id
            and s.org_id = appointments.org_id
            and s.is_active = true
        )
        and exists (
          select 1
          from public.staff_appointment_types sat
          where sat.staff_id = appointments.staff_id
            and sat.appointment_type_id = appointments.appointment_type_id
        )
      );
  end if;
end
$$;
