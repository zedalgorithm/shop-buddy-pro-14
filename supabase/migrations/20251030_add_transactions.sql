-- Sales transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  total_amount numeric NOT NULL,
  subtotal numeric NOT NULL,
  tax numeric NOT NULL DEFAULT 0,
  payment_method text,
  status text DEFAULT 'completed',
  -- Optionally add user_id/FK here
  customer_name text
);

-- Link table for products in each transaction
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.stock_batches(id),
  quantity integer NOT NULL,
  price numeric NOT NULL,
  cost numeric NOT NULL,
  name text -- snapshot of name at time
);

-- Patch: Ensure 'tax' column exists for safety (run this if already migrated)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tax numeric NOT NULL DEFAULT 0;
