# Database Migration Instructions

## Position Columns Migration

To enable position ordering functionality, you need to run the migration script.

### Steps:

1. **Go to your Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to the **SQL Editor** tab

2. **Run the Migration**
   - Copy the entire contents of `add_position_columns.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute the migration

3. **What this migration does:**
   - Adds `position` and `category_position` columns to the tasks table
   - Sets initial position values based on current alphabetical order
   - Creates database indexes for better performance

### File to Run:
```
productivity-tracker/database/add_position_columns.sql
```

### After Migration:
- Position ordering will work in both Task Calibration and Staff Input pages
- Changes made in Task Calibration will persist to the database
- The yellow warning banner will disappear from the Task Calibration page

### Verification:
After running the migration, refresh your app and check:
- Task Calibration page should no longer show the yellow warning
- Position changes should save successfully when clicking "Save Position Changes"
- Staff Input page should display tasks in the order set in Task Calibration
