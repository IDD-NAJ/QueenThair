-- ============================================================
--  QUEENTHAIR – Migration 005: Inventory RPC Functions
--  Called by Edge Functions via service_role key.
-- ============================================================

-- ── Reserve inventory (before payment) ──────────────────────
create or replace function reserve_inventory(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity    int
) returns void language plpgsql security definer as $$
begin
  if p_variant_id is not null then
    update public.inventory
    set quantity_reserved = quantity_reserved + p_quantity
    where product_id = p_product_id and variant_id = p_variant_id;
  else
    update public.inventory
    set quantity_reserved = quantity_reserved + p_quantity
    where product_id = p_product_id and variant_id is null;
  end if;
end;
$$;

-- ── Confirm deduct (after successful payment) ────────────────
create or replace function confirm_inventory_deduct(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity    int
) returns void language plpgsql security definer as $$
begin
  if p_variant_id is not null then
    update public.inventory
    set
      quantity_available = greatest(0, quantity_available - p_quantity),
      quantity_reserved  = greatest(0, quantity_reserved  - p_quantity)
    where product_id = p_product_id and variant_id = p_variant_id;
  else
    update public.inventory
    set
      quantity_available = greatest(0, quantity_available - p_quantity),
      quantity_reserved  = greatest(0, quantity_reserved  - p_quantity)
    where product_id = p_product_id and variant_id is null;
  end if;
end;
$$;

-- ── Release reservation (on payment failure / cancellation) ──
create or replace function release_inventory_reservation(
  p_product_id uuid,
  p_variant_id uuid,
  p_quantity    int
) returns void language plpgsql security definer as $$
begin
  if p_variant_id is not null then
    update public.inventory
    set quantity_reserved = greatest(0, quantity_reserved - p_quantity)
    where product_id = p_product_id and variant_id = p_variant_id;
  else
    update public.inventory
    set quantity_reserved = greatest(0, quantity_reserved - p_quantity)
    where product_id = p_product_id and variant_id is null;
  end if;
end;
$$;
