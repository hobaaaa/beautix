alter table public.notification_jobs
  drop constraint if exists notification_jobs_type_check;

alter table public.notification_jobs
  add constraint notification_jobs_type_check check (
    type in (
      'booking_confirmation',
      'appointment_reminder',
      'business_booking_notification'
    )
  );

create or replace function public.get_business_notification_recipient_email(
  p_org_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  member_count integer;
  recipient_email text;
begin
  select count(*)
  into member_count
  from public.org_members om
  join auth.users u on u.id = om.user_id
  where om.org_id = p_org_id
    and u.email is not null
    and trim(u.email) <> '';

  if member_count <> 1 then
    return null;
  end if;

  select lower(trim(u.email))
  into recipient_email
  from public.org_members om
  join auth.users u on u.id = om.user_id
  where om.org_id = p_org_id
    and u.email is not null
    and trim(u.email) <> ''
  limit 1;

  return recipient_email;
end;
$$;

revoke all on function public.get_business_notification_recipient_email(uuid)
  from public;
revoke all on function public.get_business_notification_recipient_email(uuid)
  from anon;
revoke all on function public.get_business_notification_recipient_email(uuid)
  from authenticated;
grant execute on function public.get_business_notification_recipient_email(uuid)
  to service_role;

create or replace function public.enqueue_business_booking_notification_job(
  p_appointment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_appointment record;
  target_job_id uuid;
begin
  select
    a.id,
    a.org_id,
    a.client_id
  into target_appointment
  from public.appointments a
  join public.clients c on c.id = a.client_id
    and c.org_id = a.org_id
  where a.id = p_appointment_id
    and c.user_id = auth.uid()
    and c.is_active = true;

  if target_appointment.id is null then
    raise exception 'appointment_not_found'
      using errcode = 'P0002';
  end if;

  insert into public.notification_jobs (
    org_id,
    appointment_id,
    client_id,
    type,
    status,
    scheduled_for,
    attempt_count
  )
  values (
    target_appointment.org_id,
    target_appointment.id,
    target_appointment.client_id,
    'business_booking_notification',
    'pending',
    now(),
    0
  )
  on conflict (appointment_id, type) do update
    set updated_at = public.notification_jobs.updated_at
  returning id into target_job_id;

  return target_job_id;
end;
$$;

revoke all on function public.enqueue_business_booking_notification_job(uuid)
  from public;
revoke all on function public.enqueue_business_booking_notification_job(uuid)
  from anon;
grant execute on function public.enqueue_business_booking_notification_job(uuid)
  to authenticated;
