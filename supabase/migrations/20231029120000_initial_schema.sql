-- Enable UUID extension
create extension if not exists "uuid-ossp" with schema extensions;

-- Create categories table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  cost numeric(10, 2) not null check (cost >= 0),
  sku text,
  barcode text,
  in_stock boolean default true,
  stock_quantity integer default 0,
  low_stock_threshold integer default 10,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create product_variants table
create table if not exists public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price_adjustment numeric(10, 2) default 0,
  sku text,
  barcode text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, name)
);

-- Create customers table
create table if not exists public.customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  transaction_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0),
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  payment_method text not null,
  payment_status text not null default 'pending',
  status text not null default 'completed',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transaction_items table
create table if not exists public.transaction_items (
  id uuid default uuid_generate_v4() primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_price numeric(10, 2) not null check (total_price >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create inventory_logs table
create table if not exists public.inventory_logs (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  quantity_change integer not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_transactions_customer_id on public.transactions(customer_id);
create index if not exists idx_transaction_items_transaction_id on public.transaction_items(transaction_id);
create index if not exists idx_transaction_items_product_id on public.transaction_items(product_id);
create index if not exists idx_inventory_logs_product_id on public.inventory_logs(product_id);
create index if not exists idx_inventory_logs_variant_id on public.inventory_logs(variant_id);

-- Add RLS (Row Level Security) policies
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.inventory_logs enable row level security;

-- Create a function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers to update updated_at columns
create or replace trigger update_categories_updated_at
  before update on public.categories
  for each row execute procedure update_updated_at_column();

create or replace trigger update_products_updated_at
  before update on public.products
  for each row execute procedure update_updated_at_column();

create or replace trigger update_product_variants_updated_at
  before update on public.product_variants
  for each row execute procedure update_updated_at_column();

create or replace trigger update_customers_updated_at
  before update on public.customers
  for each row execute procedure update_updated_at_column();

create or replace trigger update_transactions_updated_at
  before update on public.transactions
  for each row execute procedure update_updated_at_column();
