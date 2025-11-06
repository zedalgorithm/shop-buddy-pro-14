-- Enable RLS on categories table
alter table public.categories enable row level security;

-- Allow public read access to categories
create policy "Allow public read access to categories"
on public.categories
for select
using (true);

-- Allow authenticated users to insert categories
create policy "Allow authenticated users to insert categories"
on public.categories
for insert
to authenticated
with check (true);

-- Allow authenticated users to update their own categories
create policy "Allow authenticated users to update categories"
on public.categories
for update
to authenticated
using (true);

-- Enable RLS on products table
alter table public.products enable row level security;

-- Allow public read access to products
create policy "Allow public read access to products"
on public.products
for select
using (true);

-- Allow authenticated users to insert products
create policy "Allow authenticated users to insert products"
on public.products
for insert
to authenticated
with check (true);

-- Allow authenticated users to update their own products
create policy "Allow authenticated users to update products"
on public.products
for update
to authenticated
using (true);
