-- Populate last_login for existing users from auth.users.last_sign_in_at
-- This is a one-time migration to backfill data for users who signed in before last_login was added

UPDATE public.profiles p
SET last_login = (
  SELECT last_sign_in_at 
  FROM auth.users 
  WHERE id = p.id
)
WHERE last_login IS NULL 
  AND EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = p.id 
    AND last_sign_in_at IS NOT NULL
  );

