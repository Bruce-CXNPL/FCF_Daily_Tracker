-- MANUAL EMAIL VERIFICATION
-- This will verify your account so you can log in without waiting for the email

-- Step 1: Check if your user exists and get their details
SELECT 
  id,
  email,
  name,
  access_level,
  is_verified,
  created_at
FROM users 
WHERE email = 'brucen@cxnpl.com';

-- Step 2: Manually verify your account
UPDATE users 
SET 
  is_verified = true,
  updated_at = NOW()
WHERE email = 'brucen@cxnpl.com';

-- Step 3: Also update the Supabase Auth user to mark email as confirmed
-- (This requires admin access to auth.users table)
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'brucen@cxnpl.com';

-- Step 4: Verify the changes worked
SELECT 
  'Public Users Table' as table_name,
  email,
  is_verified,
  access_level
FROM users 
WHERE email = 'brucen@cxnpl.com'
UNION ALL
SELECT 
  'Auth Users Table' as table_name,
  email,
  CASE WHEN email_confirmed_at IS NOT NULL THEN 'true' ELSE 'false' END as is_verified,
  COALESCE(raw_user_meta_data->>'access_level', 'ops') as access_level
FROM auth.users 
WHERE email = 'brucen@cxnpl.com';
