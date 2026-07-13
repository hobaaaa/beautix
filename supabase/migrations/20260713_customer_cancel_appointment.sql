create or replace function public.cancel_customer_appointment(
  p_appointment_id uuid,
  p_org_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  updated_id uuid;
begin
  if current_user_id is null then
    return 'unauthenticated';
  end if;

  update public.appointments a
  set status = 'cancelled'
  where a.id = p_appointment_id
    and a.org_id = p_org_id
    and a.status = 'confirmed'
    and a.start_at > now()
    and exists (
      select 1
      from public.clients c
      where c.id = a.client_id
        and c.org_id = a.org_id
        and c.user_id = current_user_id
        and c.is_active = true
    )
  returning a.id into updated_id;

  if updated_id is null then
    return 'not_cancelled';
  end if;

  return 'cancelled';
end;
$$;

revoke all on function public.cancel_customer_appointment(uuid, uuid) from public;
revoke all on function public.cancel_customer_appointment(uuid, uuid) from anon;
grant execute on function public.cancel_customer_appointment(uuid, uuid) to authenticated;
