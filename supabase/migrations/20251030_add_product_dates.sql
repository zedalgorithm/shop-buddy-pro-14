-- Add purchase_date and expiry_date columns to products table
ALTER TABLE IF EXISTS public.products
ADD COLUMN IF NOT EXISTS purchase_date date NULL,
ADD COLUMN IF NOT EXISTS expiry_date date NULL;

-- Optional: simple index to filter/sort by expiry
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON public.products(expiry_date);

