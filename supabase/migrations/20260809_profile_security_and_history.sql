create extension if not exists pgcrypto;

create table if not exists public.care_needs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_id text unique not null,
  care_city text not null default 'unknown',
  care_district text,
  service_types jsonb not null default '[]'::jsonb,
  self_care_level text not null default 'unknown',
  cognitive_status text not null default 'unknown',
  priorities jsonb not null default '[]'::jsonb,
  note text,
  status text not null default 'submitted',
  answers jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  action_list jsonb not null default '[]'::jsonb,
  source text not null default 'yanglao8',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_id text not null references public.care_needs(profile_id) on delete cascade,
  contact_name text not null,
  relationship text not null default 'family',
  phone text not null,
  city text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.care_needs
  add column if not exists access_token_hash text,
  add column if not exists is_shared boolean not null default true,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.contacts
  add column if not exists updated_at timestamptz not null default now();

create index if not exists care_needs_user_updated_idx
  on public.care_needs(user_id, updated_at desc);

create index if not exists care_needs_access_token_hash_idx
  on public.care_needs(access_token_hash)
  where access_token_hash is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists care_needs_set_updated_at on public.care_needs;
create trigger care_needs_set_updated_at
before update on public.care_needs
for each row execute function public.set_updated_at();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

alter table public.care_needs enable row level security;
alter table public.contacts enable row level security;

drop policy if exists "care_needs_owner_select" on public.care_needs;
drop policy if exists "care_needs_owner_insert" on public.care_needs;
drop policy if exists "care_needs_owner_update" on public.care_needs;
drop policy if exists "care_needs_owner_delete" on public.care_needs;

create policy "care_needs_owner_select"
on public.care_needs for select
to authenticated
using (user_id = auth.uid());

create policy "care_needs_owner_insert"
on public.care_needs for insert
to authenticated
with check (user_id = auth.uid());

create policy "care_needs_owner_update"
on public.care_needs for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "care_needs_owner_delete"
on public.care_needs for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "contacts_owner_select" on public.contacts;
drop policy if exists "contacts_owner_insert" on public.contacts;
drop policy if exists "contacts_owner_update" on public.contacts;
drop policy if exists "contacts_owner_delete" on public.contacts;

create policy "contacts_owner_select"
on public.contacts for select
to authenticated
using (user_id = auth.uid());

create policy "contacts_owner_insert"
on public.contacts for insert
to authenticated
with check (user_id = auth.uid());

create policy "contacts_owner_update"
on public.contacts for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "contacts_owner_delete"
on public.contacts for delete
to authenticated
using (user_id = auth.uid());

comment on column public.care_needs.access_token_hash is
  'SHA-256 hash of the opaque profile link token. The raw token is never stored.';
