create table if not exists public.organization_profiles (
  org_id uuid primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_profiles_name_check check (length(trim(name)) > 0)
);

alter table public.organization_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_profiles'
      and policyname = 'organization_profiles_org_members_select'
  ) then
    create policy organization_profiles_org_members_select
      on public.organization_profiles
      for select
      using (
        exists (
          select 1
          from public.org_members om
          where om.org_id = organization_profiles.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_profiles'
      and policyname = 'organization_profiles_customers_select'
  ) then
    create policy organization_profiles_customers_select
      on public.organization_profiles
      for select
      using (
        exists (
          select 1
          from public.clients c
          where c.org_id = organization_profiles.org_id
            and c.user_id = auth.uid()
            and c.is_active = true
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_profiles'
      and policyname = 'organization_profiles_org_members_insert'
  ) then
    create policy organization_profiles_org_members_insert
      on public.organization_profiles
      for insert
      with check (
        exists (
          select 1
          from public.org_members om
          where om.org_id = organization_profiles.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_profiles'
      and policyname = 'organization_profiles_org_members_update'
  ) then
    create policy organization_profiles_org_members_update
      on public.organization_profiles
      for update
      using (
        exists (
          select 1
          from public.org_members om
          where om.org_id = organization_profiles.org_id
            and om.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.org_members om
          where om.org_id = organization_profiles.org_id
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;
