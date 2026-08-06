alter table public.organization_profiles
  add column if not exists default_locale text not null default 'tr';

alter table public.organization_profiles
  drop constraint if exists organization_profiles_default_locale_check;

alter table public.organization_profiles
  add constraint organization_profiles_default_locale_check
  check (default_locale in ('tr', 'en'));

alter table public.notification_jobs
  add column if not exists locale text not null default 'tr';

alter table public.notification_jobs
  drop constraint if exists notification_jobs_locale_check;

alter table public.notification_jobs
  add constraint notification_jobs_locale_check
  check (locale in ('tr', 'en'));

create or replace function public.set_notification_job_locale()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  organization_locale text;
begin
  select op.default_locale
  into organization_locale
  from public.organization_profiles op
  where op.org_id = new.org_id;

  new.locale := coalesce(nullif(new.locale, ''), organization_locale, 'tr');
  return new;
end;
$$;

drop trigger if exists notification_jobs_set_locale on public.notification_jobs;

create trigger notification_jobs_set_locale
before insert on public.notification_jobs
for each row
execute function public.set_notification_job_locale();

drop function if exists public.claim_due_notification_jobs(integer);

create function public.claim_due_notification_jobs(
  batch_size integer default 10
)
returns table (
  id uuid,
  org_id uuid,
  appointment_id uuid,
  client_id uuid,
  type text,
  status text,
  scheduled_for timestamptz,
  attempt_count integer,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  locale text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_batch_size integer := least(greatest(coalesce(batch_size, 10), 1), 50);
begin
  return query
  with due_jobs as (
    select notification_jobs.id
    from public.notification_jobs
    where notification_jobs.status = 'pending'
      and notification_jobs.scheduled_for <= now()
    order by notification_jobs.scheduled_for asc, notification_jobs.created_at asc
    limit safe_batch_size
    for update skip locked
  )
  update public.notification_jobs
  set
    status = 'processing',
    updated_at = now()
  from due_jobs
  where notification_jobs.id = due_jobs.id
  returning
    notification_jobs.id,
    notification_jobs.org_id,
    notification_jobs.appointment_id,
    notification_jobs.client_id,
    notification_jobs.type,
    notification_jobs.status,
    notification_jobs.scheduled_for,
    notification_jobs.attempt_count,
    notification_jobs.last_error,
    notification_jobs.processed_at,
    notification_jobs.created_at,
    notification_jobs.updated_at,
    notification_jobs.locale;
end;
$$;

revoke all on function public.claim_due_notification_jobs(integer) from public;
revoke all on function public.claim_due_notification_jobs(integer) from anon;
revoke all on function public.claim_due_notification_jobs(integer) from authenticated;
grant execute on function public.claim_due_notification_jobs(integer) to service_role;
