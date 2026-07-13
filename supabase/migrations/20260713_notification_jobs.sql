create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  scheduled_for timestamptz not null,
  attempt_count integer not null default 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_jobs_type_check check (
    type in ('booking_confirmation', 'appointment_reminder')
  ),
  constraint notification_jobs_status_check check (
    status in ('pending', 'processing', 'sent', 'failed')
  ),
  constraint notification_jobs_attempt_count_check check (attempt_count >= 0)
);

alter table public.notification_jobs enable row level security;

create unique index if not exists notification_jobs_appointment_type_unique_idx
  on public.notification_jobs (appointment_id, type);

create index if not exists notification_jobs_status_idx
  on public.notification_jobs (status);

create index if not exists notification_jobs_scheduled_for_idx
  on public.notification_jobs (scheduled_for);

create index if not exists notification_jobs_org_id_idx
  on public.notification_jobs (org_id);

create index if not exists notification_jobs_appointment_id_idx
  on public.notification_jobs (appointment_id);

create or replace function public.set_notification_jobs_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_jobs_set_updated_at on public.notification_jobs;

create trigger notification_jobs_set_updated_at
before update on public.notification_jobs
for each row
execute function public.set_notification_jobs_updated_at();

create or replace function public.enqueue_booking_confirmation_notification_job(
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
    'booking_confirmation',
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

revoke all on function public.enqueue_booking_confirmation_notification_job(uuid)
  from public;
revoke all on function public.enqueue_booking_confirmation_notification_job(uuid)
  from anon;
grant execute on function public.enqueue_booking_confirmation_notification_job(uuid)
  to authenticated;
