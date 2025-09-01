-- Add measurement_type column to tasks table
-- 'tasks' = count-based measurement (current behavior)
-- 'time' = direct time input in minutes

ALTER TABLE tasks 
ADD COLUMN measurement_type VARCHAR(10) DEFAULT 'tasks' CHECK (measurement_type IN ('tasks', 'time'));

-- Update the recalculate_historical_data function to handle measurement types
CREATE OR REPLACE FUNCTION recalculate_historical_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate for 'tasks' measurement type
  -- For 'time' measurement type, the calculated_time_minutes should equal the count (direct time input)
  IF NEW.measurement_type = 'tasks' THEN
    UPDATE daily_entry_items 
    SET calculated_time_minutes = count * NEW.expected_duration_minutes
    WHERE task_id = NEW.id;
  ELSE
    -- For time-based tasks, calculated_time_minutes should equal count (direct time input)
    UPDATE daily_entry_items 
    SET calculated_time_minutes = count
    WHERE task_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
