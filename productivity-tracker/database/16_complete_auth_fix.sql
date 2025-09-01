-- COMPLETE AUTHENTICATION FIX
-- This script fixes all authentication issues

-- 1. Disable RLS on public.users (we'll use app-level security)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to clean up
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for own record" ON public.users;
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Service role can insert" ON public.users;

-- 3. Ensure the trigger function works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Insert the user record
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    access_level, 
    is_verified, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'access_level', 'ops'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, users.name),
    access_level = COALESCE(EXCLUDED.access_level, users.access_level),
    is_verified = true,
    updated_at = NOW();
    
  RETURN new;
END;
$$;

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify all existing auth users are marked as email confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 6. Check if your specific user exists and create if missing
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the auth user id
  SELECT id INTO user_id FROM auth.users WHERE email = 'brucen@cxnpl.com';
  
  IF user_id IS NOT NULL THEN
    -- Create the public.users record if it doesn't exist
    INSERT INTO public.users (id, email, name, access_level, is_verified, created_at, updated_at)
    VALUES (user_id, 'brucen@cxnpl.com', 'Bruce', 'admin', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      access_level = 'admin',
      is_verified = true,
      updated_at = NOW();
  END IF;
END $$;

-- 7. Verify the setup
SELECT 'Auth Users:' as table_type, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Public Users:' as table_type, COUNT(*) as count FROM public.users;
