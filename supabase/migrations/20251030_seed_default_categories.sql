-- Seed default categories if they don't already exist
INSERT INTO public.categories (name)
SELECT name FROM (VALUES ('Food'), ('Beverages'), ('Hardware')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.name = v.name
);

