-- Disable email verification for development
-- This allows users to sign up and log in immediately without email verification

-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET email_confirm = false 
WHERE id = 1;

-- If the above doesn't work, we can manually verify existing users
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Alternative: Create a function to auto-verify users on signup
CREATE OR REPLACE FUNCTION public.auto_verify_user()
RETURNS trigger SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Auto-verify the user immediately
  UPDATE auth.users 
  SET email_confirmed_at = NOW(), 
      confirmed_at = NOW() 
  WHERE id = NEW.id;
  
  RETURN NEW;
END; $$;

-- Create trigger to auto-verify users (optional - only if you want automatic verification)
-- DROP TRIGGER IF EXISTS on_auth_user_auto_verify ON auth.users;
-- CREATE TRIGGER on_auth_user_auto_verify
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.auto_verify_user();
