-- Migration to merge staff and users tables
-- This removes the staff table dependency and uses users directly

-- Step 1: Add user_id to daily_entries if it doesn't exist
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Step 2: Migrate existing data - link daily_entries to users via staff_id
UPDATE daily_entries de
SET user_id = u.id
FROM users u
WHERE u.staff_id = de.staff_id
AND de.user_id IS NULL;

-- Step 3: For any remaining entries without user_id, try to match by staff name
UPDATE daily_entries de
SET user_id = u.id
FROM staff s, users u
WHERE de.staff_id = s.id
AND s.name = u.name
AND de.user_id IS NULL;

-- Step 4: Drop the foreign key constraint on staff_id (if exists)
ALTER TABLE daily_entries 
DROP CONSTRAINT IF EXISTS daily_entries_staff_id_fkey;

-- Step 5: Drop the staff_id column from daily_entries
ALTER TABLE daily_entries 
DROP COLUMN IF EXISTS staff_id;

-- Step 6: Make user_id NOT NULL and add unique constraint
ALTER TABLE daily_entries 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE daily_entries
DROP CONSTRAINT IF EXISTS daily_entries_user_date_unique;

ALTER TABLE daily_entries
ADD CONSTRAINT daily_entries_user_date_unique UNIQUE(user_id, entry_date);

-- Step 7: Drop staff_id from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS staff_id;

-- Step 8: Drop the staff table
DROP TABLE IF EXISTS staff CASCADE;

-- Step 9: Update RLS policies for daily_entries
DROP POLICY IF EXISTS "Users can view own entries" ON daily_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON daily_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON daily_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON daily_entries;

-- Enable RLS on daily_entries if not already enabled
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own entries
CREATE POLICY "Users can view own entries" ON daily_entries
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own entries
CREATE POLICY "Users can insert own entries" ON daily_entries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own entries
CREATE POLICY "Users can update own entries" ON daily_entries
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Admins can view all entries
CREATE POLICY "Admins can view all entries" ON daily_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id::text = auth.uid()::text 
      AND u.access_level = 'admin'
    )
  );

-- Step 10: Do the same for daily_entry_items (they inherit access from daily_entries)
ALTER TABLE daily_entry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own entry items" ON daily_entry_items;
DROP POLICY IF EXISTS "Admins can view all entry items" ON daily_entry_items;

CREATE POLICY "Users can manage own entry items" ON daily_entry_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      WHERE de.id = daily_entry_items.daily_entry_id
      AND de.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all entry items" ON daily_entry_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id::text = auth.uid()::text 
      AND u.access_level = 'admin'
    )
  );

-- Migration complete!
-- The staff table has been removed and all references updated to use users directly
