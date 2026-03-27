-- Supabase Security Hardening
-- Purpose: resolve `rls_disabled_in_public` advisor finding for this project.
-- Run in Supabase SQL Editor against the target project.

begin;

-- Enable RLS for all app tables in the public schema
alter table if exists public.users enable row level security;
alter table if exists public.items enable row level security;
alter table if exists public.claims enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.notifications enable row level security;

-- Remove direct table privileges from REST-exposed roles.
-- Backend server connections (service role / postgres) continue to work.
revoke all privileges on table public.users from anon, authenticated;
revoke all privileges on table public.items from anon, authenticated;
revoke all privileges on table public.claims from anon, authenticated;
revoke all privileges on table public.messages from anon, authenticated;
revoke all privileges on table public.notifications from anon, authenticated;

-- Defensive deny-all policies for REST roles.
-- If policies already exist, replace by dropping known names first.
drop policy if exists users_deny_all_anon on public.users;
drop policy if exists users_deny_all_authenticated on public.users;
create policy users_deny_all_anon on public.users for all to anon using (false) with check (false);
create policy users_deny_all_authenticated on public.users for all to authenticated using (false) with check (false);

drop policy if exists items_deny_all_anon on public.items;
drop policy if exists items_deny_all_authenticated on public.items;
create policy items_deny_all_anon on public.items for all to anon using (false) with check (false);
create policy items_deny_all_authenticated on public.items for all to authenticated using (false) with check (false);

drop policy if exists claims_deny_all_anon on public.claims;
drop policy if exists claims_deny_all_authenticated on public.claims;
create policy claims_deny_all_anon on public.claims for all to anon using (false) with check (false);
create policy claims_deny_all_authenticated on public.claims for all to authenticated using (false) with check (false);

drop policy if exists messages_deny_all_anon on public.messages;
drop policy if exists messages_deny_all_authenticated on public.messages;
create policy messages_deny_all_anon on public.messages for all to anon using (false) with check (false);
create policy messages_deny_all_authenticated on public.messages for all to authenticated using (false) with check (false);

drop policy if exists notifications_deny_all_anon on public.notifications;
drop policy if exists notifications_deny_all_authenticated on public.notifications;
create policy notifications_deny_all_anon on public.notifications for all to anon using (false) with check (false);
create policy notifications_deny_all_authenticated on public.notifications for all to authenticated using (false) with check (false);

commit;
