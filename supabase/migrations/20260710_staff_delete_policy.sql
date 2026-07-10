do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'staff'
      and policyname = 'staff_org_members_delete'
  ) then
    create policy staff_org_members_delete
      on public.staff
      for delete
      using (
        exists (
          select 1
          from public.org_members om
          where om.org_id = staff.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;
