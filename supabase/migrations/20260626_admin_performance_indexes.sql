create index if not exists org_members_user_id_idx
  on public.org_members (user_id);

create index if not exists org_members_org_id_user_id_idx
  on public.org_members (org_id, user_id);

create index if not exists appointment_types_org_created_at_idx
  on public.appointment_types (org_id, created_at desc);

create index if not exists appointment_types_org_name_idx
  on public.appointment_types (org_id, name);

create index if not exists clients_org_name_idx
  on public.clients (org_id, name);

create index if not exists working_hours_org_day_of_week_idx
  on public.working_hours (org_id, day_of_week);

create index if not exists appointments_org_start_at_idx
  on public.appointments (org_id, start_at);

create index if not exists appointments_org_appointment_type_start_at_idx
  on public.appointments (org_id, appointment_type_id, start_at);

create index if not exists staff_org_created_at_idx
  on public.staff (org_id, created_at desc);
