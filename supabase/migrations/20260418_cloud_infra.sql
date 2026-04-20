create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Propietario',
  email text not null default '',
  restaurant_name text not null default 'Mi Restaurante',
  plan text not null default 'FREE' check (plan in ('FREE', 'PRO')),
  role text not null default 'OWNER' check (role in ('OWNER', 'ADMIN')),
  is_active boolean not null default true,
  cloud_sync_enabled boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_plan on public.user_profiles(plan);
create index if not exists idx_user_profiles_stripe_customer on public.user_profiles(stripe_customer_id);
create index if not exists idx_user_profiles_subscription on public.user_profiles(stripe_subscription_id);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  name text not null,
  last_login_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create index if not exists idx_user_devices_user_id on public.user_devices(user_id);
create index if not exists idx_user_devices_last_login on public.user_devices(last_login_at desc);

create table if not exists public.sync_users (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create table if not exists public.sync_products (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create table if not exists public.sync_tables (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create table if not exists public.sync_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create table if not exists public.sync_orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create table if not exists public.sync_categories (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create table if not exists public.sync_inventory_movements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text not null,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create index if not exists idx_sync_users_user_id on public.sync_users(user_id);
create index if not exists idx_sync_products_user_id on public.sync_products(user_id);
create index if not exists idx_sync_tables_user_id on public.sync_tables(user_id);
create index if not exists idx_sync_sessions_user_id on public.sync_sessions(user_id);
create index if not exists idx_sync_orders_user_id on public.sync_orders(user_id);
create index if not exists idx_sync_categories_user_id on public.sync_categories(user_id);
create index if not exists idx_sync_inventory_movements_user_id on public.sync_inventory_movements(user_id);

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute procedure public.set_updated_at();

create trigger trg_user_devices_updated_at
before update on public.user_devices
for each row execute procedure public.set_updated_at();

create trigger trg_sync_users_updated_at
before update on public.sync_users
for each row execute procedure public.set_updated_at();

create trigger trg_sync_products_updated_at
before update on public.sync_products
for each row execute procedure public.set_updated_at();

create trigger trg_sync_tables_updated_at
before update on public.sync_tables
for each row execute procedure public.set_updated_at();

create trigger trg_sync_sessions_updated_at
before update on public.sync_sessions
for each row execute procedure public.set_updated_at();

create trigger trg_sync_orders_updated_at
before update on public.sync_orders
for each row execute procedure public.set_updated_at();

create trigger trg_sync_categories_updated_at
before update on public.sync_categories
for each row execute procedure public.set_updated_at();

create trigger trg_sync_inventory_movements_updated_at
before update on public.sync_inventory_movements
for each row execute procedure public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.user_devices enable row level security;
alter table public.sync_users enable row level security;
alter table public.sync_products enable row level security;
alter table public.sync_tables enable row level security;
alter table public.sync_sessions enable row level security;
alter table public.sync_orders enable row level security;
alter table public.sync_categories enable row level security;
alter table public.sync_inventory_movements enable row level security;

alter table public.user_profiles force row level security;
alter table public.user_devices force row level security;
alter table public.sync_users force row level security;
alter table public.sync_products force row level security;
alter table public.sync_tables force row level security;
alter table public.sync_sessions force row level security;
alter table public.sync_orders force row level security;
alter table public.sync_categories force row level security;
alter table public.sync_inventory_movements force row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_select_own'
  ) then
    create policy user_profiles_select_own on public.user_profiles
      for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_update_own'
  ) then
    create policy user_profiles_update_own on public.user_profiles
      for update using (auth.uid() = id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_insert_own'
    ) then
      create policy user_profiles_insert_own on public.user_profiles
        for insert with check (auth.uid() = id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_delete_own'
    ) then
      create policy user_profiles_delete_own on public.user_profiles
        for delete using (auth.uid() = id);
    end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_devices' and policyname = 'user_devices_manage_own'
  ) then
    create policy user_devices_manage_own on public.user_devices
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sync_users' and policyname = 'sync_users_select_own'
  ) then
    create policy sync_users_select_own on public.sync_users
      for select using (auth.uid() = user_id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_users' and policyname = 'sync_users_insert_own'
    ) then
      create policy sync_users_insert_own on public.sync_users
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_users' and policyname = 'sync_users_update_own'
    ) then
      create policy sync_users_update_own on public.sync_users
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_users' and policyname = 'sync_users_delete_own'
    ) then
      create policy sync_users_delete_own on public.sync_users
        for delete using (auth.uid() = user_id);
    end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sync_products' and policyname = 'sync_products_select_own'
  ) then
    create policy sync_products_select_own on public.sync_products
      for select using (auth.uid() = user_id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_products' and policyname = 'sync_products_insert_own'
    ) then
      create policy sync_products_insert_own on public.sync_products
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_products' and policyname = 'sync_products_update_own'
    ) then
      create policy sync_products_update_own on public.sync_products
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_products' and policyname = 'sync_products_delete_own'
    ) then
      create policy sync_products_delete_own on public.sync_products
        for delete using (auth.uid() = user_id);
    end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sync_tables' and policyname = 'sync_tables_select_own'
  ) then
    create policy sync_tables_select_own on public.sync_tables
      for select using (auth.uid() = user_id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_tables' and policyname = 'sync_tables_insert_own'
    ) then
      create policy sync_tables_insert_own on public.sync_tables
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_tables' and policyname = 'sync_tables_update_own'
    ) then
      create policy sync_tables_update_own on public.sync_tables
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_tables' and policyname = 'sync_tables_delete_own'
    ) then
      create policy sync_tables_delete_own on public.sync_tables
        for delete using (auth.uid() = user_id);
    end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sync_sessions' and policyname = 'sync_sessions_select_own'
  ) then
    create policy sync_sessions_select_own on public.sync_sessions
      for select using (auth.uid() = user_id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_sessions' and policyname = 'sync_sessions_insert_own'
    ) then
      create policy sync_sessions_insert_own on public.sync_sessions
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_sessions' and policyname = 'sync_sessions_update_own'
    ) then
      create policy sync_sessions_update_own on public.sync_sessions
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_sessions' and policyname = 'sync_sessions_delete_own'
    ) then
      create policy sync_sessions_delete_own on public.sync_sessions
        for delete using (auth.uid() = user_id);
    end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sync_orders' and policyname = 'sync_orders_select_own'
  ) then
    create policy sync_orders_select_own on public.sync_orders
      for select using (auth.uid() = user_id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_orders' and policyname = 'sync_orders_insert_own'
    ) then
      create policy sync_orders_insert_own on public.sync_orders
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_orders' and policyname = 'sync_orders_update_own'
    ) then
      create policy sync_orders_update_own on public.sync_orders
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_orders' and policyname = 'sync_orders_delete_own'
    ) then
      create policy sync_orders_delete_own on public.sync_orders
        for delete using (auth.uid() = user_id);
    end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sync_categories' and policyname = 'sync_categories_select_own'
  ) then
    create policy sync_categories_select_own on public.sync_categories
      for select using (auth.uid() = user_id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_categories' and policyname = 'sync_categories_insert_own'
    ) then
      create policy sync_categories_insert_own on public.sync_categories
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_categories' and policyname = 'sync_categories_update_own'
    ) then
      create policy sync_categories_update_own on public.sync_categories
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_categories' and policyname = 'sync_categories_delete_own'
    ) then
      create policy sync_categories_delete_own on public.sync_categories
        for delete using (auth.uid() = user_id);
    end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sync_inventory_movements' and policyname = 'sync_inventory_select_own'
  ) then
    create policy sync_inventory_select_own on public.sync_inventory_movements
      for select using (auth.uid() = user_id);
  end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_inventory_movements' and policyname = 'sync_inventory_insert_own'
    ) then
      create policy sync_inventory_insert_own on public.sync_inventory_movements
        for insert with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_inventory_movements' and policyname = 'sync_inventory_update_own'
    ) then
      create policy sync_inventory_update_own on public.sync_inventory_movements
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'sync_inventory_movements' and policyname = 'sync_inventory_delete_own'
    ) then
      create policy sync_inventory_delete_own on public.sync_inventory_movements
        for delete using (auth.uid() = user_id);
    end if;
end $$;
