create table if not exists public.public_booking_attempts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organization_profiles(org_id) on delete cascade,
  ip_hash text not null,
  contact_hash text,
  outcome text not null,
  created_at timestamptz not null default now(),
  constraint public_booking_attempts_outcome_check check (
    outcome in ('allowed', 'blocked', 'success')
  ),
  constraint public_booking_attempts_ip_hash_check check (length(trim(ip_hash)) > 0)
);

alter table public.public_booking_attempts enable row level security;

create index if not exists public_booking_attempts_ip_created_at_idx
  on public.public_booking_attempts (ip_hash, created_at);

create index if not exists public_booking_attempts_org_ip_created_at_idx
  on public.public_booking_attempts (org_id, ip_hash, created_at);

create index if not exists public_booking_attempts_contact_created_at_idx
  on public.public_booking_attempts (contact_hash, created_at)
  where contact_hash is not null;

create index if not exists public_booking_attempts_created_at_idx
  on public.public_booking_attempts (created_at);

create or replace function public.check_public_booking_rate_limit(
  p_org_id uuid,
  p_ip_hash text,
  p_contact_hashes text[] default array[]::text[]
)
returns table (
  allowed boolean,
  reason_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_ip_hash text := trim(coalesce(p_ip_hash, ''));
  clean_contact_hashes text[] := coalesce(p_contact_hashes, array[]::text[]);
  ip_attempt_count integer;
  org_ip_attempt_count integer;
  contact_success_count integer;
  block_reason text := null;
  contact_hash text;
begin
  if clean_ip_hash = '' then
    raise exception 'public_booking_rate_limit_invalid_ip_hash'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.organization_profiles op
    where op.org_id = p_org_id
  ) then
    raise exception 'public_booking_rate_limit_org_not_found'
      using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('public_booking_ip:' || clean_ip_hash, 0)
  );

  foreach contact_hash in array clean_contact_hashes loop
    if trim(coalesce(contact_hash, '')) <> '' then
      perform pg_advisory_xact_lock(
        hashtextextended('public_booking_contact:' || contact_hash, 0)
      );
    end if;
  end loop;

  select count(*)
  into ip_attempt_count
  from public.public_booking_attempts pba
  where pba.ip_hash = clean_ip_hash
    and pba.outcome in ('allowed', 'blocked')
    and pba.created_at >= now() - interval '10 minutes';

  if ip_attempt_count >= 5 then
    block_reason := 'ip_window_limit';
  end if;

  if block_reason is null then
    select count(*)
    into org_ip_attempt_count
    from public.public_booking_attempts pba
    where pba.org_id = p_org_id
      and pba.ip_hash = clean_ip_hash
      and pba.outcome in ('allowed', 'blocked')
      and pba.created_at >= now() - interval '1 minute';

    if org_ip_attempt_count >= 2 then
      block_reason := 'org_ip_burst_limit';
    end if;
  end if;

  if block_reason is null and array_length(clean_contact_hashes, 1) is not null then
    select coalesce(max(success_count), 0)
    into contact_success_count
    from (
      select count(*) as success_count
      from public.public_booking_attempts pba
      where pba.contact_hash = any(clean_contact_hashes)
        and pba.outcome = 'success'
        and pba.created_at >= now() - interval '30 minutes'
      group by pba.contact_hash
    ) contact_success_counts;

    if contact_success_count >= 3 then
      block_reason := 'contact_success_limit';
    end if;
  end if;

  insert into public.public_booking_attempts (
    org_id,
    ip_hash,
    contact_hash,
    outcome
  )
  values (
    p_org_id,
    clean_ip_hash,
    null,
    case when block_reason is null then 'allowed' else 'blocked' end
  );

  return query select block_reason is null, block_reason;
end;
$$;

revoke all on function public.check_public_booking_rate_limit(uuid, text, text[])
  from public;
revoke all on function public.check_public_booking_rate_limit(uuid, text, text[])
  from anon;
revoke all on function public.check_public_booking_rate_limit(uuid, text, text[])
  from authenticated;
grant execute on function public.check_public_booking_rate_limit(uuid, text, text[])
  to service_role;

create or replace function public.cleanup_public_booking_attempts(
  p_before timestamptz default now() - interval '7 days'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.public_booking_attempts
  where created_at < p_before;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_public_booking_attempts(timestamptz)
  from public;
revoke all on function public.cleanup_public_booking_attempts(timestamptz)
  from anon;
revoke all on function public.cleanup_public_booking_attempts(timestamptz)
  from authenticated;
grant execute on function public.cleanup_public_booking_attempts(timestamptz)
  to service_role;
