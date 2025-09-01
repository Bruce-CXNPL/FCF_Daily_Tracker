-- Add display_text column to tasks table
-- This allows admins to specify custom display text for each task on the staff input page

-- Check if column exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'display_text'
    ) THEN
        ALTER TABLE tasks ADD COLUMN display_text TEXT;
    END IF;
END $$;

-- Add a comment to document the column
COMMENT ON COLUMN tasks.display_text IS 'Custom display text shown to staff on the input page. If null, defaults to measurement type indicator.';

-- Update existing tasks to have null display_text (will use measurement type as fallback)
-- No need to set default values as the application will handle the fallback logic
