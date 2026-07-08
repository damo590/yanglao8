alter table public.care_needs
  add column if not exists profile_id text,
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists result jsonb not null default '{}'::jsonb,
  add column if not exists action_list jsonb not null default '[]'::jsonb,
  add column if not exists source text not null default 'yanglao8';

alter table public.contacts
  add column if not exists profile_id text,
  add column if not exists city text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'care_needs'
      and column_name = 'user_id'
      and is_nullable = 'NO'
  ) then
    alter table public.care_needs alter column user_id drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contacts'
      and column_name = 'user_id'
      and is_nullable = 'NO'
  ) then
    alter table public.contacts alter column user_id drop not null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'care_needs_profile_id_unique'
  ) then
    alter table public.care_needs
      add constraint care_needs_profile_id_unique unique (profile_id);
  end if;
end $$;

create index if not exists contacts_profile_id_idx on public.contacts(profile_id);
