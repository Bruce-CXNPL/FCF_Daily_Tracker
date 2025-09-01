# Authentication System Migration Guide

This guide will help you implement the new authentication system for the FC&F Daily Tracker.

## Overview

The authentication system adds:
- User registration with email verification
- Login/logout functionality
- User roles (Ops and Admin)
- User management interface for admins
- Automatic staff record linking

## Prerequisites

1. Ensure your Supabase project is set up and running
2. Have access to the Supabase dashboard
3. Backup your existing data before migration

## Step 1: Configure Supabase Authentication

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider if not already enabled
4. Configure email settings:
   - Enable "Confirm email" (for verification)
   - Set up SMTP settings for production (optional for testing)

## Step 2: Create Users Table

Run the following SQL in your Supabase SQL editor:

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.access_level = 'admin'
  ));

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.access_level = 'admin'
  ));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 3: Add User ID to Daily Entries

Run this SQL to link daily entries to users:

```sql
-- Add user_id column to daily_entries if not exists
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

## Step 4: Install Required Dependencies

In your project directory, run:

```bash
npm install @supabase/auth-helpers-nextjs
```

## Step 5: Configure Email Templates (Optional)

1. In Supabase dashboard, go to **Authentication** → **Email Templates**
2. Customize the verification email template:

```html
<h2>Confirm your email</h2>
<p>Welcome to FC&F Daily Tracker!</p>
<p>Please click the link below to verify your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
```

## Step 6: Create Initial Admin User

After deploying the authentication system:

1. Navigate to `/auth/signup`
2. Create an account with:
   - Your name (first name only)
   - Your email address
   - Choose "Admin" access level
   - Enter admin password: `admin123`
3. Check your email for verification link
4. Click the verification link
5. Log in at `/auth/login`

## Step 7: Migrate Existing Staff to Users

If you have existing staff records, you can create user accounts for them:

```sql
-- This is an example - adjust as needed
-- Create users for existing active staff
INSERT INTO users (email, name, access_level, is_verified, staff_id)
SELECT 
  LOWER(REPLACE(name, ' ', '.')) || '@company.com' as email,
  name,
  'ops' as access_level,
  true as is_verified,
  id as staff_id
FROM staff
WHERE is_active = true
ON CONFLICT (email) DO NOTHING;
```

**Note:** You'll need to:
- Replace `@company.com` with your actual domain
- Inform staff of their temporary email/password
- Have them reset passwords on first login

## Step 8: Test the System

1. **Test Registration:**
   - Go to `/auth/signup`
   - Create a test account
   - Verify email works

2. **Test Login:**
   - Go to `/auth/login`
   - Log in with test account
   - Verify redirect to home page

3. **Test Access Control:**
   - As Ops user: Should only see task entry page
   - As Admin user: Should see Admin Dashboard button

4. **Test User Management:**
   - As Admin, go to Admin Dashboard
   - Navigate to User Management tab
   - Test editing and deleting users

## Step 9: Security Considerations

1. **Change Default Admin Password:**
   - Update `admin123` in the code to a secure password
   - Location: `src/app/auth/signup/page.tsx`

2. **Enable Email Verification in Production:**
   - Ensure email verification is required
   - Configure proper SMTP settings

3. **Review RLS Policies:**
   - Test that users can only see their own data
   - Verify admins have appropriate access

## Troubleshooting

### Users can't receive verification emails
- Check SMTP settings in Supabase
- For testing, you can manually verify users in Supabase dashboard

### Middleware not working
- Ensure `@supabase/auth-helpers-nextjs` is installed
- Check that middleware.ts is in the src directory
- Verify Supabase environment variables are set

### Users can't log in after verification
- Check that `is_verified` is set to true in users table
- Verify Supabase Auth and database user records match

## Rollback Plan

If you need to rollback:

1. Remove authentication middleware
2. Restore original StaffInput component with dropdown
3. Disable RLS on users table
4. Keep users table for future migration

## Support

For issues or questions:
- Check Supabase logs for errors
- Review browser console for client-side errors
- Ensure all environment variables are correctly set
