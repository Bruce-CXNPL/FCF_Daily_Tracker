-- Simple fix: Just update existing users to be verified
-- Run this in your Supabase SQL Editor

UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
