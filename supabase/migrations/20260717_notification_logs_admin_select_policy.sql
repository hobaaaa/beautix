do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_logs'
      and policyname = 'notification_logs_org_members_select'
  ) then
    create policy notification_logs_org_members_select
      on public.notification_logs
      for select
      using (
        exists (
          select 1
          from public.org_members om
          where om.org_id = notification_logs.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;
