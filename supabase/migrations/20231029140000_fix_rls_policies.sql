-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Enable read access for all users" 
ON public.categories 
FOR SELECT 
TO public 
USING (true);

-- Allow insert for all users
CREATE POLICY "Enable insert for all users" 
ON public.categories 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Enable read access for all users" 
ON public.products 
FOR SELECT 
TO public 
USING (true);

-- Allow insert for all users
CREATE POLICY "Enable insert for all users" 
ON public.products 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Enable RLS on product_variants table
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Allow public read access to product_variants
CREATE POLICY "Enable read access for all users" 
ON public.product_variants 
FOR SELECT 
TO public 
USING (true);

-- Allow insert for all users
CREATE POLICY "Enable insert for all users" 
ON public.product_variants 
FOR INSERT 
TO public 
WITH CHECK (true);
