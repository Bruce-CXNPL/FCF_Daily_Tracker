-- PERMANENT FIX: Automatic user creation for ALL signups
-- This creates a trigger that automatically adds users to the users table when they sign up

-- Step 1: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create a function that runs with elevated privileges (SECURITY DEFINER)
-- This bypasses RLS to create the user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    access_level,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'access_level', 'ops'),
    false,  -- Will be set to true when they verify email
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$;

-- Step 3: Create trigger that fires when a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Update RLS policies to allow the trigger to work
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- This policy allows the trigger function to insert (runs as definer)
-- And also allows authenticated users to insert their own record as backup
CREATE POLICY "allow_user_creation" ON users
  FOR INSERT
  WITH CHECK (
    -- Allow if it's the user creating their own record
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text)
    OR
    -- Allow if it's being created by the trigger (no auth context)
    auth.uid() IS NULL
  );

-- Step 5: Test that existing policies still work
-- Keep all the other policies from before
-- (users can view/update own, admins can do everything)

-- Step 6: For users who already signed up but don't have a users record
-- This will create their record retroactively
INSERT INTO public.users (id, email, name, access_level, is_verified)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'access_level', 'ops'),
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Step 7: Verify everything is set up correctly
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'Public Users' as table_name,
  COUNT(*) as count 
FROM public.users;
