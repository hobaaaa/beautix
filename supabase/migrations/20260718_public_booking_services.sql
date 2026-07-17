create or replace function public.get_public_booking_services(p_public_slug text)
returns table (
  id uuid,
  name text,
  duration_minutes integer
)
language sql
security definer
set search_path = public
as $$
  select
    at.id,
    at.name,
    at.duration_minutes
  from public.organization_profiles op
  join public.appointment_types at on at.org_id = op.org_id
  where op.public_slug = p_public_slug
    and at.is_active = true
  order by at.name asc;
$$;

revoke all on function public.get_public_booking_services(text) from public;
grant execute on function public.get_public_booking_services(text) to anon;
grant execute on function public.get_public_booking_services(text) to authenticated;
