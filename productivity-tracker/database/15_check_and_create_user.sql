-- Check if your user exists and create it if needed

-- 1. First, check if you exist in auth.users table
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'brucen@cxnpl.com';

-- 2. Check if you exist in public.users table
SELECT * FROM public.users 
WHERE email = 'brucen@cxnpl.com';

-- 3. If you exist in auth.users but NOT in public.users, run this to create your user record:
-- (Replace the ID below with the ID from step 1)
/*
INSERT INTO public.users (id, email, name, access_level, is_verified, created_at, updated_at)
SELECT 
    id,
    email,
    'Bruce',  -- Your name
    'admin',  -- Your access level (admin or ops)
    true,
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'brucen@cxnpl.com'
ON CONFLICT (id) DO UPDATE SET
    is_verified = true,
    access_level = 'admin';
*/

-- 4. Verify email is confirmed in auth.users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'brucen@cxnpl.com' AND email_confirmed_at IS NULL;

-- 5. Check both tables again to confirm everything is set up
