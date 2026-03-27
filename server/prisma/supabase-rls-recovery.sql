-- Supabase RLS Recovery / Mode Switch
-- Use in Supabase SQL Editor when policies were over-restrictive.
-- This script provides two modes:
--   Mode A (backend-only): Prisma/Express is the only data access path.
--   Mode B (Supabase client): allow authenticated reads/writes with RLS.

begin;

-- Ensure RLS is enabled
alter table if exists public.users enable row level security;
alter table if exists public.items enable row level security;
alter table if exists public.claims enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.notifications enable row level security;

-- Remove deny-all policies created by strict hardening script (if present)
drop policy if exists users_deny_all_anon on public.users;
drop policy if exists users_deny_all_authenticated on public.users;
drop policy if exists items_deny_all_anon on public.items;
drop policy if exists items_deny_all_authenticated on public.items;
drop policy if exists claims_deny_all_anon on public.claims;
drop policy if exists claims_deny_all_authenticated on public.claims;
drop policy if exists messages_deny_all_anon on public.messages;
drop policy if exists messages_deny_all_authenticated on public.messages;
drop policy if exists notifications_deny_all_anon on public.notifications;
drop policy if exists notifications_deny_all_authenticated on public.notifications;

-- Remove broad helper policies from prior iterations (if present)
drop policy if exists "Anyone can view items" on public.items;
drop policy if exists "Users can create items" on public.items;
drop policy if exists "Enable read access for authenticated users" on public.items;
drop policy if exists "Enable read access for authenticated users" on public.users;
drop policy if exists "Enable read access for authenticated users" on public.claims;
drop policy if exists "Enable read access for authenticated users" on public.messages;
drop policy if exists "Enable read access for authenticated users" on public.notifications;

-- Reset role grants to a known baseline
revoke all privileges on table public.users from anon, authenticated;
revoke all privileges on table public.items from anon, authenticated;
revoke all privileges on table public.claims from anon, authenticated;
revoke all privileges on table public.messages from anon, authenticated;
revoke all privileges on table public.notifications from anon, authenticated;

-- =========================
-- Mode A: Backend-only app
-- =========================
-- Keep anon/authenticated blocked. Express + Prisma (postgres/service role)
-- continues to work outside RLS role restrictions.
-- Uncomment if you want explicit deny-all policies:
-- create policy users_deny_all_anon on public.users for all to anon using (false) with check (false);
-- create policy users_deny_all_authenticated on public.users for all to authenticated using (false) with check (false);
-- create policy items_deny_all_anon on public.items for all to anon using (false) with check (false);
-- create policy items_deny_all_authenticated on public.items for all to authenticated using (false) with check (false);
-- create policy claims_deny_all_anon on public.claims for all to anon using (false) with check (false);
-- create policy claims_deny_all_authenticated on public.claims for all to authenticated using (false) with check (false);
-- create policy messages_deny_all_anon on public.messages for all to anon using (false) with check (false);
-- create policy messages_deny_all_authenticated on public.messages for all to authenticated using (false) with check (false);
-- create policy notifications_deny_all_anon on public.notifications for all to anon using (false) with check (false);
-- create policy notifications_deny_all_authenticated on public.notifications for all to authenticated using (false) with check (false);

-- ======================================
-- Mode B: Supabase client direct access
-- ======================================
-- Uncomment to allow authenticated app users via Supabase client.
-- Note: this is broad and should be tightened with auth.uid()-based ownership.
-- grant select on table public.items to anon;
-- grant select, insert, update, delete on table public.items to authenticated;
-- grant select, insert, update, delete on table public.claims to authenticated;
-- grant select, insert, update, delete on table public.messages to authenticated;
-- grant select, insert, update, delete on table public.notifications to authenticated;
-- grant select, update on table public.users to authenticated;
--
-- create policy "items_select_all" on public.items for select to anon, authenticated using (true);
-- create policy "items_write_authenticated" on public.items for all to authenticated using (true) with check (true);
--
-- create policy "claims_authenticated_all" on public.claims for all to authenticated using (true) with check (true);
-- create policy "messages_authenticated_all" on public.messages for all to authenticated using (true) with check (true);
-- create policy "notifications_authenticated_all" on public.notifications for all to authenticated using (true) with check (true);
-- create policy "users_authenticated_read_update" on public.users for select to authenticated using (true);
-- create policy "users_authenticated_update" on public.users for update to authenticated using (true) with check (true);

commit;
