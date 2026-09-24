-- ============================================================================
-- RK Private Edition — volume-option pricing + admin order deletion
-- Run this once in the Supabase SQL editor if your project already has
-- `products`/`orders` from an earlier version of schema.sql (their CREATE
-- TABLE only applies to a brand-new table, so an existing one needs these
-- ALTERs run separately). Safe to run more than once.
-- ============================================================================

alter table public.products add column if not exists volume_options jsonb not null default '[]';

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());
