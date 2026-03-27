-- Supabase RLS Backend-Only Policies
-- Purpose: remove rls_enabled_no_policy INFO findings while keeping
-- browser-facing anon/authenticated roles fully blocked.

begin;

-- Users
drop policy if exists users_deny_all_anon on public.users;
create policy users_deny_all_anon
on public.users
for all
to anon
using (false)
with check (false);

drop policy if exists users_deny_all_authenticated on public.users;
create policy users_deny_all_authenticated
on public.users
for all
to authenticated
using (false)
with check (false);

-- Items
drop policy if exists items_deny_all_anon on public.items;
create policy items_deny_all_anon
on public.items
for all
to anon
using (false)
with check (false);

drop policy if exists items_deny_all_authenticated on public.items;
create policy items_deny_all_authenticated
on public.items
for all
to authenticated
using (false)
with check (false);

-- Claims
drop policy if exists claims_deny_all_anon on public.claims;
create policy claims_deny_all_anon
on public.claims
for all
to anon
using (false)
with check (false);

drop policy if exists claims_deny_all_authenticated on public.claims;
create policy claims_deny_all_authenticated
on public.claims
for all
to authenticated
using (false)
with check (false);

-- Messages
drop policy if exists messages_deny_all_anon on public.messages;
create policy messages_deny_all_anon
on public.messages
for all
to anon
using (false)
with check (false);

drop policy if exists messages_deny_all_authenticated on public.messages;
create policy messages_deny_all_authenticated
on public.messages
for all
to authenticated
using (false)
with check (false);

-- Notifications
drop policy if exists notifications_deny_all_anon on public.notifications;
create policy notifications_deny_all_anon
on public.notifications
for all
to anon
using (false)
with check (false);

drop policy if exists notifications_deny_all_authenticated on public.notifications;
create policy notifications_deny_all_authenticated
on public.notifications
for all
to authenticated
using (false)
with check (false);

commit;
