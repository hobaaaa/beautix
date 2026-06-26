do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = ''public''
      and tablename = ''staff_appointment_types''
      and policyname = ''staff_appointment_types_org_members_delete''
  ) then
    create policy staff_appointment_types_org_members_delete
      on public.staff_appointment_types
      for delete
      using (
        exists (
          select 1
          from public.staff s
          join public.org_members om on om.org_id = s.org_id
          where s.id = staff_appointment_types.staff_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;