-- Table for FIFO stock batches (lots)
create table if not exists public.stock_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_remaining integer not null check (quantity_remaining >= 0),
  cost numeric not null default 0,
  price numeric not null default 0,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_stock_batches_product_oldest
  on public.stock_batches(product_id, created_at);

