-- FINAL COMPLETE FIX FOR AUTHENTICATION SYSTEM
-- This version fixes all syntax errors

-- Step 1: Drop ALL existing policies to start fresh
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
DROP POLICY IF EXISTS "anon_check_email_exists" ON users;
DROP POLICY IF EXISTS "users_insert_own_on_signup" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "admins_select_all" ON users;
DROP POLICY IF EXISTS "admins_update_all" ON users;
DROP POLICY IF EXISTS "admins_delete_all" ON users;

-- Step 2: Disable and re-enable RLS to reset
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create correct policies

-- Policy 1: Allow anyone to check if email exists (for signup validation)
-- Using USING clause only (no WITH CHECK for SELECT)
CREATE POLICY "public_email_check" ON users
  FOR SELECT
  USING (true);

-- Policy 2: Allow authenticated users to insert their own record
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );

-- Policy 3: Allow users to view their own record
CREATE POLICY "users_view_own" ON users
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = id::text
  );

-- Policy 4: Allow users to update their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = id::text
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = id::text
  );

-- Policy 5: Admins can view all users (simplified)
CREATE POLICY "admins_view_all" ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'admin'
    )
  );

-- Policy 6: Admins can update all users
CREATE POLICY "admins_update_all" ON users
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'admin'
    )
  );

-- Policy 7: Admins can delete users
CREATE POLICY "admins_delete_users" ON users
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'admin'
    )
  );

-- Step 4: Create or replace the trigger function for auto user creation
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
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if user already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
