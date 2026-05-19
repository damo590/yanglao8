create table if not exists parent_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id text unique not null,
  answers jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  action_list jsonb not null default '[]'::jsonb,
  source text not null default 'yanglao8_demo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile_contacts (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references parent_profiles(profile_id) on delete cascade,
  name text not null,
  phone_or_wechat text not null,
  city text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists parent_profiles_profile_id_idx on parent_profiles(profile_id);
create index if not exists profile_contacts_profile_id_idx on profile_contacts(profile_id);
