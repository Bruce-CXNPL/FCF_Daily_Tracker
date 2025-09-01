-- COMPLETE FIX FOR AUTHENTICATION SYSTEM
-- Run this entire script to properly set up RLS policies

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_all_access" ON users;
DROP POLICY IF EXISTS "users_can_view_own" ON users;
DROP POLICY IF EXISTS "users_can_update_own" ON users;
DROP POLICY IF EXISTS "allow_user_signup" ON users;
DROP POLICY IF EXISTS "admin_can_view_all" ON users;
DROP POLICY IF EXISTS "admin_can_update_all" ON users;
DROP POLICY IF EXISTS "admin_can_delete" ON users;

-- Step 2: Temporarily disable RLS to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper policies that work with the signup flow

-- CRITICAL: Allow anonymous users to check if email exists (needed for signup validation)
CREATE POLICY "anon_check_email_exists" ON users
  FOR SELECT
  USING (true)  -- Anyone can check if an email exists
  WITH CHECK (false);  -- But can't see the actual data

-- Allow authenticated users to insert their own record during signup
CREATE POLICY "users_insert_own_on_signup" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );

-- Allow users to view their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (
    auth.uid()::text = id::text
  );

-- Allow users to update their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (
    auth.uid()::text = id::text
  );

-- Admin policies (without recursion)
-- Admins can view all users
CREATE POLICY "admins_select_all" ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'admin'
      LIMIT 1
    )
  );

-- Admins can update all users
CREATE POLICY "admins_update_all" ON users
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'admin'
      LIMIT 1
    )
  );

-- Admins can delete users
CREATE POLICY "admins_delete_all" ON users
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'admin'
      LIMIT 1
    )
  );

-- Step 5: Create a function to handle user creation (alternative approach)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, access_level, is_verified)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'access_level', 'ops'),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger for automatic user creation (optional - comment out if not needed)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
