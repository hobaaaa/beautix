create or replace function public.enqueue_appointment_reminder_notification_job(
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
    a.client_id,
    a.start_at,
    a.status
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

  if target_appointment.status <> 'confirmed' then
    return null;
  end if;

  if target_appointment.start_at - now() < interval '24 hours' then
    return null;
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
    'appointment_reminder',
    'pending',
    target_appointment.start_at - interval '24 hours',
    0
  )
  on conflict (appointment_id, type) do update
    set updated_at = public.notification_jobs.updated_at
  returning id into target_job_id;

  return target_job_id;
end;
$$;

revoke all on function public.enqueue_appointment_reminder_notification_job(uuid)
  from public;
revoke all on function public.enqueue_appointment_reminder_notification_job(uuid)
  from anon;
grant execute on function public.enqueue_appointment_reminder_notification_job(uuid)
  to authenticated;
