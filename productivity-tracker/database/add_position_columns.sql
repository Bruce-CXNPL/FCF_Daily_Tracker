-- Add position columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_position INTEGER DEFAULT 0;

-- Update existing tasks with initial positions based on current order
WITH category_positions AS (
  SELECT DISTINCT category,
    ROW_NUMBER() OVER (ORDER BY category) as cat_pos
  FROM tasks
  WHERE is_active = true
),
task_positions AS (
  SELECT id, category,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY name) as task_pos
  FROM tasks
  WHERE is_active = true
)
UPDATE tasks t
SET 
  category_position = cp.cat_pos,
  position = tp.task_pos
FROM category_positions cp, task_positions tp
WHERE t.category = cp.category
  AND t.id = tp.id
  AND t.is_active = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(category_position, position);
