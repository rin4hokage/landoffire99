alter table public.beat_sales
  add column if not exists polar_order_id text,
  add column if not exists polar_checkout_id text;

create index if not exists beat_sales_polar_order_id_idx
  on public.beat_sales (polar_order_id);

create index if not exists beat_sales_polar_checkout_id_idx
  on public.beat_sales (polar_checkout_id);
