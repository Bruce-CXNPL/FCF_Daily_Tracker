-- MANUAL SETUP FOR YOUR ADMIN ACCOUNT
-- Since the auth user was created but the users table insert failed

-- Step 1: First check if your auth user exists in Supabase Auth
-- Go to Authentication > Users in Supabase dashboard
-- Find your email (brucen@cxnpl.com) and copy the User UID

-- Step 2: Insert your user record manually
-- Replace 'YOUR-USER-ID-HERE' with the actual UUID from step 1
INSERT INTO users (
  id,
  email,
  name,
  access_level,
  is_verified,
  created_at,
  updated_at
) VALUES (
  'YOUR-USER-ID-HERE',  -- Replace with your actual User UID from Supabase Auth
  'brucen@cxnpl.com',
  'Bruce',  -- Or your preferred name
  'admin',
  true,  -- Set to true to bypass email verification for now
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_verified = true,
  access_level = 'admin';

-- Step 3: If you want to link to existing staff record
UPDATE users 
SET staff_id = (SELECT id FROM staff WHERE name = 'Bruce' LIMIT 1)
WHERE email = 'brucen@cxnpl.com';

-- Step 4: Verify it worked
SELECT * FROM users WHERE email = 'brucen@cxnpl.com';
