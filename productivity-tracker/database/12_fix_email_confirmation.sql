-- Fix email confirmation - only update email_confirmed_at (confirmed_at is generated)
-- This allows users to sign up and log in immediately without email verification

-- Update existing users to be verified (only update email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Create a trigger to auto-verify new users
CREATE OR REPLACE FUNCTION public.auto_verify_new_user()
RETURNS trigger SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Auto-verify the user immediately upon creation (only update email_confirmed_at)
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END; $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_auto_verify ON auth.users;

-- Create trigger to auto-verify users on signup
CREATE TRIGGER on_auth_user_auto_verify
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_verify_new_user();
