do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'appointment_status'
  ) then
    alter type public.appointment_status add value if not exists 'completed';
    alter type public.appointment_status add value if not exists 'no_show';
  end if;
end
$$;
