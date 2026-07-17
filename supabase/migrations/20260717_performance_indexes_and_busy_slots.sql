create index if not exists appointments_org_client_start_at_idx
  on public.appointments (org_id, client_id, start_at desc);

create index if not exists appointment_types_org_active_name_idx
  on public.appointment_types (org_id, is_active, name);

create index if not exists notification_jobs_pending_schedule_idx
  on public.notification_jobs (scheduled_for asc, created_at asc)
  where status = 'pending';

create index if not exists notification_logs_org_created_at_desc_idx
  on public.notification_logs (org_id, created_at desc);

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
    and a.status <> 'cancelled'
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
