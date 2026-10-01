-- ============================================================================
-- RK Private Edition — volume-option pricing, remainder-ml pricing, admin
-- order deletion, and automatic remaining_ml deduction on fulfillment.
-- Run this once in the Supabase SQL editor if your project already has
-- `products`/`orders` from an earlier version of schema.sql (their CREATE
-- TABLE only applies to a brand-new table, so an existing one needs these
-- ALTERs run separately). Safe to run more than once.
-- ============================================================================

alter table public.products add column if not exists volume_options jsonb not null default '[]';
alter table public.products add column if not exists price_per_ml numeric(10, 2);

alter table public.orders add column if not exists fulfillment_applied boolean not null default false;

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());

create or replace function public.apply_order_fulfillment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_quantity int;
begin
  if new.status = 'done' and not coalesce(old.fulfillment_applied, false) then
    for item in select * from jsonb_array_elements(new.items)
    loop
      if (item ->> 'volume_label') is not null then
        v_product_id := (item ->> 'product_id')::uuid;
        v_quantity := coalesce((item ->> 'quantity')::int, 1);
        if (item -> 'volume_ml') = 'null'::jsonb then
          update public.products set remaining_ml = 0
          where id = v_product_id and remaining_ml is not null;
        else
          update public.products
          set remaining_ml = greatest(0, coalesce(remaining_ml, 0) - (item ->> 'volume_ml')::numeric * v_quantity)
          where id = v_product_id;
        end if;
      end if;
    end loop;
    new.fulfillment_applied := true;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_apply_fulfillment on public.orders;
create trigger orders_apply_fulfillment
  before update on public.orders
  for each row execute function public.apply_order_fulfillment();
