create type subsidy_category as enum (
  '高龄津贴',
  '长护险',
  '失能补贴',
  '低保相关',
  '养老服务补贴',
  '残疾人补贴',
  '其他'
);

create type confidence_level as enum ('high', 'medium', 'low');

create table if not exists subsidies (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  name text not null,
  category subsidy_category not null,
  age_min integer,
  age_max integer,
  -- care_levels: 自理/半失能/失能/重度失能/失智，null 表示不限
  care_levels text[],
  -- hukou_type: 城镇/农村/不限
  hukou_type text default '不限',
  -- income_type: 低保/低收入/不限
  income_type text default '不限',
  amount text not null,
  amount_monthly integer,              -- 月均金额（元），用于排序和汇总
  eligibility text[] not null default '{}',
  materials text[] not null default '{}',
  apply_channel text,
  apply_url text,
  policy_year integer,
  confidence confidence_level not null default 'medium',
  notes text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subsidies_city_idx on subsidies(city);
create index if not exists subsidies_category_idx on subsidies(category);
create index if not exists subsidies_published_idx on subsidies(is_published) where is_published = true;
create index if not exists subsidies_city_published_idx on subsidies(city, is_published);
