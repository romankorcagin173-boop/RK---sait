-- ============================================================================
-- RK Private Edition — Telegram shop bot migration
-- Run this once in the Supabase SQL editor if your project already has
-- `orders` from an earlier version of schema.sql (the CREATE TABLE in that
-- file only applies to a brand-new table, so an existing one needs these
-- ALTERs run separately). Safe to run more than once.
-- ============================================================================

alter table public.orders alter column user_id drop not null;
alter table public.orders alter column contact_email drop not null;

alter table public.orders add column if not exists source text not null default 'site';
alter table public.orders add column if not exists telegram_chat_id bigint;
alter table public.orders add column if not exists telegram_username text;

alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders add constraint orders_source_check check (source in ('site', 'telegram'));

alter table public.orders drop constraint if exists orders_owner_check;
alter table public.orders add constraint orders_owner_check check (user_id is not null or telegram_chat_id is not null);
