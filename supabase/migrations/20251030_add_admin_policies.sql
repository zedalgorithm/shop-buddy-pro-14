-- Add RLS policies for admin users
-- This allows admins to update any user's profile and manage users

-- Drop existing admin policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update any profile.') THEN
    DROP POLICY "Admins can update any profile." ON public.profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert profiles.') THEN
    DROP POLICY "Admins can insert profiles." ON public.profiles;
  END IF;
END $$;

-- Create policy for admins to update any profile
CREATE POLICY "Admins can update any profile."
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for admins to insert profiles (for creating new users)
CREATE POLICY "Admins can insert profiles."
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

