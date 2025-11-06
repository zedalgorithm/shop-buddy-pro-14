-- Add delete policies for products table
CREATE POLICY "Enable delete for all users" 
ON public.products 
FOR DELETE 
TO public 
USING (true);

-- Add delete policies for product_variants table
CREATE POLICY "Enable delete for all users" 
ON public.product_variants 
FOR DELETE 
TO public 
USING (true);

-- Add update policies for products table to allow image_url updates
CREATE POLICY "Enable update for all users" 
ON public.products 
FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);
