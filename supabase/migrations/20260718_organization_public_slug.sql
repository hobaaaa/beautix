alter table public.organization_profiles
  add column if not exists public_slug text;

insert into public.organization_profiles (org_id, name)
select distinct
  om.org_id,
  'İşletme ' || left(om.org_id::text, 8)
from public.org_members om
where not exists (
  select 1
  from public.organization_profiles op
  where op.org_id = om.org_id
);

create or replace function public.normalize_organization_public_slug(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(translate(
          coalesce(value, ''),
          'çğıöşüÇĞİÖŞÜ',
          'cgiosuCGIOSU'
        )),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '-+',
      '-',
      'g'
    ),
    '(^-)|(-$)',
    '',
    'g'
  ));
$$;

do $$
declare
  profile_record record;
  base_slug text;
  candidate_slug text;
  suffix integer;
begin
  for profile_record in
    select org_id, name
    from public.organization_profiles
    where public_slug is null
       or trim(public_slug) = ''
    order by created_at asc, org_id asc
  loop
    base_slug := public.normalize_organization_public_slug(profile_record.name);

    if length(base_slug) < 3 then
      base_slug := 'isletme';
    end if;

    base_slug := left(base_slug, 60);
    base_slug := trim(both '-' from base_slug);
    candidate_slug := base_slug;
    suffix := 2;

    while exists (
      select 1
      from public.organization_profiles existing_profile
      where existing_profile.public_slug = candidate_slug
        and existing_profile.org_id <> profile_record.org_id
    ) loop
      candidate_slug := left(base_slug, greatest(3, 60 - length('-' || suffix::text))) ||
        '-' || suffix::text;
      candidate_slug := trim(both '-' from candidate_slug);
      suffix := suffix + 1;
    end loop;

    update public.organization_profiles
    set
      public_slug = candidate_slug,
      updated_at = now()
    where org_id = profile_record.org_id;
  end loop;
end
$$;

alter table public.organization_profiles
  alter column public_slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_profiles_public_slug_check'
  ) then
    alter table public.organization_profiles
      add constraint organization_profiles_public_slug_check check (
        public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
        and length(public_slug) between 3 and 60
      );
  end if;
end
$$;

create unique index if not exists organization_profiles_public_slug_unique_idx
  on public.organization_profiles (public_slug);

create or replace function public.get_public_organization_by_slug(p_public_slug text)
returns table (
  id uuid,
  name text,
  public_slug text
)
language sql
security definer
set search_path = public
as $$
  select
    op.org_id as id,
    op.name,
    op.public_slug
  from public.organization_profiles op
  where op.public_slug = p_public_slug
  limit 1;
$$;

revoke all on function public.get_public_organization_by_slug(text) from public;
grant execute on function public.get_public_organization_by_slug(text) to anon;
grant execute on function public.get_public_organization_by_slug(text) to authenticated;
