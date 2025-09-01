-- Add user_id column to daily_entries if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_entries' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE daily_entries ADD COLUMN user_id UUID REFERENCES users(id);
    CREATE INDEX idx_daily_entries_user_id ON daily_entries(user_id);
  END IF;
END $$;
