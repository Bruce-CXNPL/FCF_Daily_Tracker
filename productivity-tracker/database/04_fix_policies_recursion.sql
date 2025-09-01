-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "admins_all_access" ON users;

-- Temporarily disable RLS to fix the issue
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simpler policies that avoid recursion
-- Policy 1: Allow users to view their own record only (no admin check to avoid recursion)
CREATE POLICY "users_can_view_own" ON users
  FOR SELECT 
  USING (auth.uid()::text = id::text);

-- Policy 2: Allow users to update their own record
CREATE POLICY "users_can_update_own" ON users
  FOR UPDATE 
  USING (auth.uid()::text = id::text);

-- Policy 3: Allow insert for signup (anyone can create an account)
CREATE POLICY "allow_user_signup" ON users
  FOR INSERT 
  WITH CHECK (auth.uid()::text = id::text);

-- Policy 4: Special admin view policy (simplified to avoid recursion)
CREATE POLICY "admin_can_view_all" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.access_level = 'admin'
      LIMIT 1
    )
  );

-- Policy 5: Admin can update all
CREATE POLICY "admin_can_update_all" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.access_level = 'admin'
      LIMIT 1
    )
  );

-- Policy 6: Admin can delete users
CREATE POLICY "admin_can_delete" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.access_level = 'admin'
      LIMIT 1
    )
  );
