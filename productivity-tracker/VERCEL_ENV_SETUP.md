# Vercel Environment Variables Setup

## Issue
Your Vercel deployment is failing because the required Supabase environment variables are not configured in Vercel. The error shows:

```
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
```

## Required Environment Variables

You need to add these environment variables to your Vercel project:

1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
3. `ADMIN_PASSWORD` - Admin password for the application
4. `NEXT_PUBLIC_DEFAULT_TIMEZONE` - Default timezone (optional, defaults to Australia/Sydney)

## How to Fix This

### Step 1: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy your:
   - Project URL (looks like: `https://your-project.supabase.co`)
   - Anon/Public key (starts with `eyJ...`)

### Step 2: Add Environment Variables to Vercel
1. Go to [vercel.com](https://vercel.com) and log in
2. Navigate to your project dashboard
3. Click on your "FCF Daily Tracker" project
4. Go to Settings → Environment Variables
5. Add each variable:

   **Variable Name:** `NEXT_PUBLIC_SUPABASE_URL`
   **Value:** Your Supabase project URL
   **Environment:** Production, Preview, Development (select all)

   **Variable Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   **Value:** Your Supabase anon key
   **Environment:** Production, Preview, Development (select all)

   **Variable Name:** `ADMIN_PASSWORD`
   **Value:** `admin123` (or your preferred admin password)
   **Environment:** Production, Preview, Development (select all)

   **Variable Name:** `NEXT_PUBLIC_DEFAULT_TIMEZONE`
   **Value:** `Australia/Sydney`
   **Environment:** Production, Preview, Development (select all)

### Step 3: Redeploy
After adding the environment variables:
1. Go to the Deployments tab in your Vercel project
2. Click the three dots (...) on the latest deployment
3. Select "Redeploy"
4. Or simply push a new commit to trigger a new deployment

## Alternative: Quick Fix via Vercel CLI
If you have Vercel CLI installed, you can add environment variables from the command line:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ADMIN_PASSWORD
vercel env add NEXT_PUBLIC_DEFAULT_TIMEZONE
```

## Verification
Once the environment variables are added and you redeploy:
1. The build should complete successfully
2. Your application will be accessible at your Vercel URL
3. All authentication features should work properly

## Security Note
- Never commit your actual environment variables to Git
- The `.env.local` file is already in `.gitignore` to prevent accidental commits
- Only the `NEXT_PUBLIC_*` variables are exposed to the browser - others remain server-side only
