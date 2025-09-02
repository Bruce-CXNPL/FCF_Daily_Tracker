-- Add is_active column to users table for soft delete functionality
-- This allows us to "delete" users while preserving their historical data

-- Add the is_active column (defaults to true for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance when filtering active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update any existing users to be active (in case column already existed)
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN users.is_active IS 'Soft delete flag - false means user is deleted but data is preserved';
