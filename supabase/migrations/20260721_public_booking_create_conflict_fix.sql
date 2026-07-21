do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_jobs_appointment_type_unique'
      and conrelid = 'public.notification_jobs'::regclass
  ) then
    alter table public.notification_jobs
      add constraint notification_jobs_appointment_type_unique
      unique using index notification_jobs_appointment_type_unique_idx;
  end if;
end
$$;

create or replace function public.create_public_booking(
  p_public_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_date date,
  p_time time,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_notes text
)
returns table (
  appointment_id uuid,
  created_client boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  target_service record;
  target_client_id uuid;
  target_email_client_id uuid;
  target_phone_client_id uuid;
  target_has_inactive_match boolean;
  normalized_email text := lower(trim(p_email));
  normalized_phone text := public.normalize_public_booking_phone(p_phone);
  target_start_at timestamptz;
  target_end_at timestamptz;
  target_day_of_week integer := extract(isodow from p_date)::integer;
  target_working_hours record;
  new_appointment_id uuid;
  was_client_created boolean := false;
begin
  select op.org_id
  into target_org_id
  from public.organization_profiles op
  where op.public_slug = p_public_slug;

  if target_org_id is null then
    raise exception 'public_booking_not_found' using errcode = 'P0002';
  end if;

  select at.id, at.duration_minutes
  into target_service
  from public.appointment_types at
  where at.id = p_service_id
    and at.org_id = target_org_id
    and at.is_active = true;

  if target_service.id is null then
    raise exception 'public_booking_not_found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.staff s
    join public.staff_appointment_types sat on sat.staff_id = s.id
    where s.id = p_staff_id
      and s.org_id = target_org_id
      and s.is_active = true
      and sat.appointment_type_id = p_service_id
  ) then
    raise exception 'public_booking_not_found' using errcode = 'P0002';
  end if;

  target_start_at := (p_date::text || ' ' || p_time::text || '+03')::timestamptz;
  target_end_at := target_start_at + make_interval(mins => target_service.duration_minutes);

  if target_start_at <= now() then
    raise exception 'public_booking_past' using errcode = 'P0001';
  end if;

  select wh.start_time, wh.end_time
  into target_working_hours
  from public.working_hours wh
  where wh.org_id = target_org_id
    and wh.day_of_week = target_day_of_week;

  if target_working_hours.start_time is null then
    raise exception 'public_booking_closed' using errcode = 'P0001';
  end if;

  if p_time < target_working_hours.start_time
    or (p_time + make_interval(mins => target_service.duration_minutes)) > target_working_hours.end_time
  then
    raise exception 'public_booking_outside_working_hours' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.org_id = target_org_id
      and a.staff_id = p_staff_id
      and a.status <> 'cancelled'
      and tstzrange(a.start_at, a.end_at, '[)') &&
        tstzrange(target_start_at, target_end_at, '[)')
  ) then
    raise exception 'public_booking_slot_unavailable' using errcode = 'P0001';
  end if;

  select exists (
    select 1
    from public.clients c
    where c.org_id = target_org_id
      and (
        lower(trim(coalesce(c.email, ''))) = normalized_email
        or public.normalize_public_booking_phone(c.phone) = normalized_phone
      )
      and c.is_active = false
  )
  into target_has_inactive_match;

  if target_has_inactive_match then
    raise exception 'public_booking_contact_conflict' using errcode = 'P0001';
  end if;

  select c.id
  into target_email_client_id
  from public.clients c
  where c.org_id = target_org_id
    and c.is_active = true
    and lower(trim(coalesce(c.email, ''))) = normalized_email
  order by c.created_at asc, c.id asc
  limit 1;

  select c.id
  into target_phone_client_id
  from public.clients c
  where c.org_id = target_org_id
    and c.is_active = true
    and public.normalize_public_booking_phone(c.phone) = normalized_phone
  order by c.created_at asc, c.id asc
  limit 1;

  if target_email_client_id is not null
    and target_phone_client_id is not null
    and target_email_client_id <> target_phone_client_id
  then
    raise exception 'public_booking_contact_conflict' using errcode = 'P0001';
  end if;

  target_client_id := coalesce(target_email_client_id, target_phone_client_id);

  if target_client_id is null then
    insert into public.clients (
      org_id,
      user_id,
      name,
      first_name,
      last_name,
      phone,
      email,
      address,
      notes,
      birth_date,
      is_active
    )
    values (
      target_org_id,
      null,
      trim(p_first_name) || ' ' || trim(p_last_name),
      trim(p_first_name),
      trim(p_last_name),
      normalized_phone,
      normalized_email,
      null,
      null,
      null,
      true
    )
    returning id into target_client_id;

    was_client_created := true;
  end if;

  insert into public.appointments (
    org_id,
    client_id,
    appointment_type_id,
    staff_id,
    start_at,
    end_at,
    status,
    notes
  )
  values (
    target_org_id,
    target_client_id,
    p_service_id,
    p_staff_id,
    target_start_at,
    target_end_at,
    'confirmed',
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into new_appointment_id;

  insert into public.notification_jobs (
    org_id,
    appointment_id,
    client_id,
    type,
    status,
    scheduled_for,
    attempt_count
  )
  values
    (
      target_org_id,
      new_appointment_id,
      target_client_id,
      'booking_confirmation',
      'pending',
      now(),
      0
    ),
    (
      target_org_id,
      new_appointment_id,
      target_client_id,
      'business_booking_notification',
      'pending',
      now(),
      0
    )
  on conflict on constraint notification_jobs_appointment_type_unique do nothing;

  if target_start_at - now() >= interval '24 hours' then
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
      target_org_id,
      new_appointment_id,
      target_client_id,
      'appointment_reminder',
      'pending',
      target_start_at - interval '24 hours',
      0
    )
    on conflict on constraint notification_jobs_appointment_type_unique do nothing;
  end if;

  return query select new_appointment_id, was_client_created;
end;
$$;

revoke all on function public.create_public_booking(
  text,
  uuid,
  uuid,
  date,
  time,
  text,
  text,
  text,
  text,
  text
) from public;
grant execute on function public.create_public_booking(
  text,
  uuid,
  uuid,
  date,
  time,
  text,
  text,
  text,
  text,
  text
) to anon;
grant execute on function public.create_public_booking(
  text,
  uuid,
  uuid,
  date,
  time,
  text,
  text,
  text,
  text,
  text
) to authenticated;
