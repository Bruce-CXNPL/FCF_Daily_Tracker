# Migration Guide: Demo to Supabase/Vercel

This guide will help you migrate the demo.html productivity tracker to the full Supabase/Vercel architecture.

## Prerequisites

1. **Supabase Account**: Sign up at https://supabase.com
2. **Vercel Account**: Sign up at https://vercel.com
3. **Node.js**: Version 18+ installed
4. **Git**: For version control

## Step 1: Set Up Supabase

### 1.1 Create a New Project
1. Log into Supabase Dashboard
2. Click "New Project"
3. Fill in:
   - Project name: `productivity-tracker`
   - Database Password: (save this securely)
   - Region: Choose closest to your users

### 1.2 Run Database Schema
1. Go to SQL Editor in Supabase
2. Copy and run the schema from `database/schema.sql`
3. This creates all necessary tables with RLS policies

### 1.3 Get Your API Keys
1. Go to Settings → API
2. Copy:
   - `anon` public key
   - Project URL

## Step 2: Configure the Next.js Application

### 2.1 Install Dependencies
```bash
cd productivity-tracker
npm install
```

### 2.2 Set Up Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2.3 Update Initial Data
The demo data needs to be migrated to Supabase:

1. **Staff Members**: 
   - Go to Supabase Table Editor
   - Select `staff` table
   - Insert: Stevie, Chloe, Hunter, Swetha, Tharaka

2. **Task Categories**:
   - Select `task_categories` table
   - Insert: ONBOARDING, FRAUD, UMR'S, TRANSACTION MONITORING, ADMIN, LENDING

3. **Tasks**:
   - Select `tasks` table
   - Insert all tasks from demo with their categories and durations

## Step 3: Deploy to Vercel

### 3.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

### 3.2 Deploy on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Next.js
   - Root Directory: `productivity-tracker`
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click Deploy

## Step 4: Post-Deployment Setup

### 4.1 Configure Authentication (Optional)
If you want to add authentication:
1. Enable Auth in Supabase
2. Configure providers (Email, Google, etc.)
3. Update RLS policies to use auth.uid()

### 4.2 Set Up Admin Access
1. Create an admin role in Supabase:
```sql
-- Add is_admin column to auth.users metadata
ALTER TABLE auth.users 
ADD COLUMN raw_user_meta_data jsonb;

-- Create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Update RLS policies to check admin status for admin operations

### 4.3 Configure Timezone
Update `src/lib/timezone.ts` with your default timezone:
```typescript
export const DEFAULT_TIMEZONE = 'Australia/Sydney';
```

## Step 5: Data Migration

### 5.1 Export Demo Data
If you have data in the demo that needs to be preserved:

1. Open demo.html in browser
2. Open Developer Console
3. Run:
```javascript
// Export saved entries
console.log(JSON.stringify(savedEntries, null, 2));

// Export staff members
console.log(JSON.stringify(staffMembers, null, 2));

// Export tasks
console.log(JSON.stringify(tasks, null, 2));
```

### 5.2 Import to Supabase
Use the Supabase SQL Editor to insert the exported data:

```sql
-- Example: Insert daily entries
INSERT INTO daily_entries (staff_id, date, created_at)
VALUES 
  ((SELECT id FROM staff WHERE name = 'Stevie'), '2024-08-24', NOW());

-- Insert daily entry items
INSERT INTO daily_entry_items (daily_entry_id, task_id, count)
VALUES 
  (last_insert_id(), (SELECT id FROM tasks WHERE name = 'Manual reviews'), 5);
```

## Step 6: Feature Parity Checklist

Ensure all demo features work in production:

- [ ] Staff can select their name and date
- [ ] Staff can enter task counts
- [ ] Entries are saved/updated correctly
- [ ] Admin can view Team Output with filters
- [ ] Task percentages display correctly
- [ ] Task Calibration allows editing durations
- [ ] Tasks can be added/deleted
- [ ] Categories can be created
- [ ] Staff can be added/deactivated
- [ ] All calculations match demo behavior

## Step 7: Production Considerations

### 7.1 Security
- [ ] Enable RLS on all tables
- [ ] Implement proper authentication
- [ ] Validate all inputs server-side
- [ ] Set up CORS properly

### 7.2 Performance
- [ ] Enable Vercel Edge Functions for API routes
- [ ] Set up database indexes:
```sql
CREATE INDEX idx_daily_entries_date ON daily_entries(date);
CREATE INDEX idx_daily_entries_staff ON daily_entries(staff_id);
```

### 7.3 Position-Based Ordering Migration
If you're updating from drag-and-drop to position-based ordering:

1. **Run the position columns migration**:
   - Go to Supabase SQL Editor
   - Run the contents of `database/add_position_columns.sql`
   - This adds `position` and `category_position` columns to tasks

2. **The migration will**:
   - Add position columns for manual ordering
   - Set initial positions based on current alphabetical order
   - Create indexes for performance

3. **After migration**:
   - Tasks and categories can be reordered using position numbers
   - Changes are saved with the "Save Position Changes" button
   - No more drag-and-drop complexity

### 7.3 Monitoring
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Set up database backups in Supabase

## Step 8: Testing

### 8.1 Local Testing
```bash
npm run dev
# Visit http://localhost:3000
```

### 8.2 Production Testing
1. Test all CRUD operations
2. Verify calculations match demo
3. Test with multiple concurrent users
4. Check mobile responsiveness

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check Supabase URL in environment variables
2. **RLS Errors**: Ensure policies are set up correctly
3. **Build Errors**: Check all dependencies are installed
4. **Data Not Saving**: Verify Supabase connection and table permissions

### Debug Mode
Add to `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

This will log Supabase queries to console.

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

## Next Steps

1. Add authentication for secure access
2. Implement data export functionality
3. Add email notifications for daily reminders
4. Create mobile app using React Native
5. Set up automated backups
