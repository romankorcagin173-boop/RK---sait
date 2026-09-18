-- ============================================================================
-- RK Private Edition — Supabase schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type product_category as enum ('parfum', '3d_print');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('new', 'processing', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- profiles — one row per registered user, linked 1:1 to auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  phone text,
  telegram_username text,
  is_admin boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_contact_required
  check (phone is not null or telegram_username is not null);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category product_category not null,
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'RUB',
  images text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  -- parfum-only fields
  volume_ml numeric(6, 1),
  remaining_ml numeric(6, 1),
  aroma_notes text,
  -- 3d-print-only fields
  material text,
  dimensions text,
  print_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 2 and 5),
  pros text,
  cons text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  -- nullable: an order placed through the Telegram shop bot has no
  -- website account, only a telegram_chat_id (see orders_owner_check below)
  user_id uuid references public.profiles(id),
  items jsonb not null,
  total numeric(10, 2) not null,
  contact_name text not null,
  contact_phone text,
  contact_telegram text,
  -- nullable for the same reason — the bot doesn't collect an email
  contact_email text,
  comment text,
  status order_status not null default 'new',
  -- 'site' (web checkout) or 'telegram' (shop bot)
  source text not null default 'site',
  telegram_chat_id bigint,
  telegram_username text,
  created_at timestamptz not null default now()
);

alter table public.orders
  drop constraint if exists orders_source_check;
alter table public.orders
  add constraint orders_source_check check (source in ('site', 'telegram'));

alter table public.orders
  drop constraint if exists orders_owner_check;
alter table public.orders
  add constraint orders_owner_check check (user_id is not null or telegram_chat_id is not null);

-- ----------------------------------------------------------------------------
-- site_settings — small key/value store editable from the admin panel
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null
);

insert into public.site_settings (key, value) values
  ('brand_description', '"RK — private edition. Приватная марка на стыке парфюмерии, технологий и 3D-печати. Каждый продукт выпускается ограниченным тиражом для тех, кто выбирает вещи не для всех."'),
  ('contacts', '{"email": "romankorcagin173@gmail.com", "telegram": "", "phone": "", "instagram": ""}')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- helper functions
-- ----------------------------------------------------------------------------

-- Resolve a login identifier (username OR email) to the account email,
-- so the client can call supabase.auth.signInWithPassword({ email, password }).
-- SECURITY DEFINER: allowed to read profiles even for anon callers, but it
-- only ever returns the email column.
create or replace function public.get_email_for_login(identifier text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from public.profiles
  where lower(username) = lower(identifier) or lower(email) = lower(identifier)
  limit 1;
$$;

grant execute on function public.get_email_for_login(text) to anon, authenticated;

-- Lets the registration form check "is this username taken?" before signup,
-- without exposing the rest of the profiles table to anon.
create or replace function public.username_exists(u text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where lower(username) = lower(u));
$$;

grant execute on function public.username_exists(text) to anon, authenticated;

-- Auto-create the profile row as soon as an auth user is created, using the
-- metadata passed in supabase.auth.signUp({ options: { data: {...} } }).
-- This keeps registration working whether or not "Confirm email" is enabled,
-- since it runs server-side in the same transaction, independent of RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, username, email, phone, telegram_username)
  values (
    new.id,
    v_username,
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'telegram_username', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Used inside RLS policies to check the caller's admin flag without
-- triggering recursive RLS evaluation on public.profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Used inside RLS policies to block a suspended account from writing data.
create or replace function public.is_blocked()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_blocked from public.profiles where id = auth.uid()), false);
$$;

-- keep products.updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.site_settings enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- products -----------------------------------------------------------------
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- reviews --------------------------------------------------------------
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id and not public.is_blocked());

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (auth.uid() = user_id or public.is_admin());

-- orders -----------------------------------------------------------------
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id and not public.is_blocked());

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- site_settings ------------------------------------------------------------
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_write_admin" on public.site_settings;
create policy "site_settings_write_admin" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Storage buckets: product photos (admin-managed) and review photos (user-uploaded)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "review_photos_public_read" on storage.objects;
create policy "review_photos_public_read" on storage.objects
  for select using (bucket_id = 'review-photos');

drop policy if exists "review_photos_authenticated_write" on storage.objects;
create policy "review_photos_authenticated_write" on storage.objects
  for insert with check (
    bucket_id = 'review-photos'
    and auth.role() = 'authenticated'
    and not public.is_blocked()
  );

-- ============================================================================
-- After running this file, make yourself an admin (see README.md ->
-- "Активация администратора") — do NOT hardcode admin credentials here.
-- ============================================================================
