create or replace function public.get_public_booking_staff(
  p_public_slug text,
  p_service_id uuid
)
returns table (
  id uuid,
  name text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.name
  from public.organization_profiles op
  join public.appointment_types at on at.org_id = op.org_id
    and at.id = p_service_id
    and at.is_active = true
  join public.staff_appointment_types sat on sat.appointment_type_id = at.id
  join public.staff s on s.id = sat.staff_id
    and s.org_id = op.org_id
    and s.is_active = true
  where op.public_slug = p_public_slug
  order by s.name asc;
$$;

revoke all on function public.get_public_booking_staff(text, uuid) from public;
grant execute on function public.get_public_booking_staff(text, uuid) to anon;
grant execute on function public.get_public_booking_staff(text, uuid) to authenticated;

create or replace function public.get_public_booking_working_hours(
  p_public_slug text,
  p_service_id uuid,
  p_day_of_week integer
)
returns table (
  start_time time,
  end_time time
)
language sql
security definer
set search_path = public
as $$
  select
    wh.start_time,
    wh.end_time
  from public.organization_profiles op
  join public.appointment_types at on at.org_id = op.org_id
    and at.id = p_service_id
    and at.is_active = true
  join public.working_hours wh on wh.org_id = op.org_id
    and wh.day_of_week = p_day_of_week
  where op.public_slug = p_public_slug
  limit 1;
$$;

revoke all on function public.get_public_booking_working_hours(text, uuid, integer) from public;
grant execute on function public.get_public_booking_working_hours(text, uuid, integer) to anon;
grant execute on function public.get_public_booking_working_hours(text, uuid, integer) to authenticated;

create or replace function public.get_public_staff_busy_appointments(
  p_public_slug text,
  p_service_id uuid,
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
  select
    a.start_at,
    a.end_at,
    a.status
  from public.organization_profiles op
  join public.appointment_types at on at.org_id = op.org_id
    and at.id = p_service_id
    and at.is_active = true
  join public.staff s on s.org_id = op.org_id
    and s.id = p_staff_id
    and s.is_active = true
  join public.staff_appointment_types sat on sat.staff_id = s.id
    and sat.appointment_type_id = at.id
  join public.appointments a on a.org_id = op.org_id
    and a.staff_id = s.id
    and a.start_at >= p_day_start
    and a.start_at < p_next_day_start
    and a.status <> 'cancelled'
  where op.public_slug = p_public_slug
  order by a.start_at asc;
$$;

revoke all on function public.get_public_staff_busy_appointments(text, uuid, uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_public_staff_busy_appointments(text, uuid, uuid, timestamptz, timestamptz) to anon;
grant execute on function public.get_public_staff_busy_appointments(text, uuid, uuid, timestamptz, timestamptz) to authenticated;
