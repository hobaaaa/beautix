create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  notification_job_id uuid not null references public.notification_jobs(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null,
  channel text not null,
  provider text not null,
  status text not null,
  attempt_number integer not null,
  recipient text,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  constraint notification_logs_channel_check check (channel in ('email')),
  constraint notification_logs_provider_check check (provider in ('resend')),
  constraint notification_logs_status_check check (status in ('sent', 'failed', 'skipped')),
  constraint notification_logs_attempt_number_check check (attempt_number > 0)
);

alter table public.notification_logs enable row level security;

create index if not exists notification_logs_org_id_idx
  on public.notification_logs (org_id);

create index if not exists notification_logs_notification_job_id_idx
  on public.notification_logs (notification_job_id);

create index if not exists notification_logs_appointment_id_idx
  on public.notification_logs (appointment_id);

create index if not exists notification_logs_status_idx
  on public.notification_logs (status);

create index if not exists notification_logs_created_at_idx
  on public.notification_logs (created_at);
