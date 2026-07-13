create or replace function public.claim_due_notification_jobs(
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
  updated_at timestamptz
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
    notification_jobs.updated_at;
end;
$$;

revoke all on function public.claim_due_notification_jobs(integer) from public;
revoke all on function public.claim_due_notification_jobs(integer) from anon;
revoke all on function public.claim_due_notification_jobs(integer) from authenticated;
grant execute on function public.claim_due_notification_jobs(integer) to service_role;

-- Supabase Cron production setup example:
--
-- 1. Add these secrets outside this migration:
--    - CRON_SECRET in Vercel/server environment
--    - app base URL and cron secret in Supabase Vault or another secure secret store
--
-- 2. Create a pg_cron job that runs every 5 minutes and POSTs to:
--    https://<your-app-domain>/api/cron/notifications
--
-- 3. The request must include:
--    Authorization: Bearer <CRON_SECRET>
--
-- Do not hardcode the endpoint URL or secret in source-controlled SQL.
-- Schedule: */5 * * * *
