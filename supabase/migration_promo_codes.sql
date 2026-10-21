-- ============================================================================
-- Promo codes (percentage discount) + minimum-order / free-shipping support.
-- Safe to run multiple times on an existing project — paste into Supabase
-- SQL Editor and run once.
-- ============================================================================

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 100),
  is_active boolean not null default true,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists discount_amount numeric(10, 2) not null default 0;

alter table public.promo_codes enable row level security;

drop policy if exists "promo_codes_admin_all" on public.promo_codes;
create policy "promo_codes_admin_all" on public.promo_codes
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.validate_promo_code(p_code text)
returns table(valid boolean, discount_percent numeric, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select * into rec from public.promo_codes where upper(code) = upper(p_code);
  if rec is null then
    return query select false, null::numeric, 'Промокод не найден.';
    return;
  end if;
  if not rec.is_active then
    return query select false, null::numeric, 'Промокод неактивен.';
    return;
  end if;
  if rec.expires_at is not null and rec.expires_at < now() then
    return query select false, null::numeric, 'Промокод истёк.';
    return;
  end if;
  if rec.max_uses is not null and rec.used_count >= rec.max_uses then
    return query select false, null::numeric, 'Промокод уже использован максимальное число раз.';
    return;
  end if;
  return query select true, rec.discount_percent, null::text;
end;
$$;

grant execute on function public.validate_promo_code(text) to anon, authenticated;

create or replace function public.redeem_promo_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.promo_codes
  set used_count = used_count + 1
  where upper(code) = upper(p_code)
    and is_active
    and (expires_at is null or expires_at > now())
    and (max_uses is null or used_count < max_uses);
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

grant execute on function public.redeem_promo_code(text) to authenticated;
