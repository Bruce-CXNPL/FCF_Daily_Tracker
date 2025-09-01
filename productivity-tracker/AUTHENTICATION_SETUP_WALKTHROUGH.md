# Authentication Setup Walkthrough - Steps 2-4

This guide provides detailed instructions for setting up the authentication system after configuring Supabase Authentication.

## Step 2: Create Users Table in Supabase

### 2.1 Access the SQL Editor
1. Log into your Supabase dashboard
2. In the left sidebar, click on **SQL Editor** (it has a terminal/code icon)

### 2.2 Create the Users Table
1. Click on **"New query"** button (usually in the top right)
2. Copy and paste ALL of the following SQL code into the editor:

```sql
-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('ops', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_login TIMESTAMP WITH TIME ZONE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.access_level = 'admin'
  ));

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy: Admins can manage all users
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.access_level = 'admin'
  ));

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before any update
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Click **"Run"** or **"Execute"** button (usually has a play icon ▶️)
4. You should see a success message like "Success. No rows returned"

### 2.3 Verify the Table Was Created
1. In the left sidebar, click on **Table Editor**
2. You should now see a new table called **"users"** in your list of tables
3. Click on it to view its structure - it should have columns for id, email, name, access_level, etc.

---

## Step 3: Add User ID to Daily Entries Table

This step links daily entries to the users who create them.

### 3.1 Run the Migration SQL
1. Go back to **SQL Editor** in your Supabase dashboard
2. Click **"New query"** again
3. Copy and paste this SQL:

```sql
-- Add user_id column to daily_entries if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'daily_entries' 
                 AND column_name = 'user_id') THEN
    ALTER TABLE daily_entries ADD COLUMN user_id UUID REFERENCES users(id);
    CREATE INDEX idx_daily_entries_user_id ON daily_entries(user_id);
  END IF;
END $$;
```

4. Click **"Run"** or **"Execute"**
5. You should see "Success. No rows returned"

### 3.2 Verify the Column Was Added
1. Go to **Table Editor**
2. Click on the **"daily_entries"** table
3. Check that there's now a **"user_id"** column (it will be empty for existing entries, which is fine)

---

## Step 4: Install Required Dependencies

This step installs the Supabase authentication helper for Next.js.

### 4.1 Open Terminal/Command Prompt
You have two options:

**Option A: Using VS Code Terminal**
1. Open VS Code with your project
2. Open terminal: `View` → `Terminal` (or press `Ctrl+` ` on Windows)
3. Make sure you're in the productivity-tracker folder

**Option B: Using Windows Command Prompt/PowerShell**
1. Open Command Prompt or PowerShell
2. Navigate to your project:
   ```
   cd "C:\FFC Workload Manager\productivity-tracker"
   ```

### 4.2 Install the Package
1. Run this command:
   ```bash
   npm install @supabase/auth-helpers-nextjs
   ```

2. Wait for installation to complete. You should see messages like:
   ```
   added X packages, and audited XXX packages in Xs
   ```

3. If you see any errors about running scripts being disabled (PowerShell), try:
   ```bash
   npm.cmd install @supabase/auth-helpers-nextjs
   ```

### 4.3 Verify Installation
1. Open the file `productivity-tracker/package.json`
2. Look in the `"dependencies"` section
3. You should see a line like:
   ```json
   "@supabase/auth-helpers-nextjs": "^X.X.X",
   ```

---

## What Happens Next?

After completing these steps:

1. **Your database is ready** - The users table exists and is secured
2. **Daily entries can track users** - The user_id column links entries to users
3. **Authentication package is installed** - Your app can now handle user login/logout

## Testing Your Setup

### Quick Test in Supabase:
1. Go to **Table Editor** → **users** table
2. Click **"Insert row"** button
3. Try adding a test user:
   - email: test@example.com
   - name: Test User
   - access_level: ops
   - is_verified: true (toggle on)
4. Click **"Save"**
5. If it saves successfully, your table is working!
6. You can delete this test user after

### Next Steps:
1. Deploy your updated code to Vercel
2. Navigate to `https://your-app.vercel.app/auth/signup`
3. Create your first real admin account
4. The system will automatically handle email verification

---

## Troubleshooting

### "Permission denied" error in SQL Editor
- Make sure you're logged in as the project owner
- Check that RLS is not blocking the operation

### Package installation fails
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

### Can't find SQL Editor or Table Editor
- These are in the left sidebar of Supabase dashboard
- SQL Editor icon looks like: `</>` or terminal
- Table Editor icon looks like: table/grid

### "Table already exists" error
- This is fine! It means the table was already created
- You can proceed to the next step

---

## Need Help?

If you encounter any issues:
1. Take a screenshot of the error
2. Check the Supabase logs (Settings → Logs → Recent)
3. The error messages usually indicate what's wrong

Remember: All these changes are reversible, so don't worry about making mistakes!
