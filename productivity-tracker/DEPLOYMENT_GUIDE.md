# Deployment Guide for Productivity Tracker

This guide walks you through deploying the Productivity Tracker application to Supabase and Vercel.

## Prerequisites

Before starting, ensure you have:
- A GitHub account with the code repository
- A Supabase account (free tier is sufficient)
- A Vercel account (free tier is sufficient)
- Node.js 18+ installed locally

## Step 1: Set Up Supabase

### 1.1 Create a New Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New project"
3. Fill in the project details:
   - Project name: `productivity-tracker` (or your preferred name)
   - Database password: Choose a strong password (save this!)
   - Region: Select the closest to your users
   - Pricing plan: Free tier is fine to start

### 1.2 Set Up the Database

1. Once the project is created, go to the SQL Editor
2. Click "New query"
3. Copy and paste the contents of `database/schema.sql`
4. Click "Run" to create the tables
5. Create another new query
6. Copy and paste the contents of `database/seed.sql`
7. Click "Run" to add initial data

### 1.3 Get Your API Keys

1. Go to Settings → API
2. Copy these values (you'll need them later):
   - Project URL (looks like `https://xxxxx.supabase.co`)
   - `anon` public key (a long string)

### 1.4 Configure Database Security (Optional but Recommended)

1. Go to Authentication → Policies
2. Enable Row Level Security (RLS) on all tables
3. For a simple setup, you can create policies that allow all operations
4. For production, implement proper authentication and restrictive policies

## Step 2: Prepare Your Code

### 2.1 Create Environment File

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ADMIN_PASSWORD=your-secure-admin-password
   ```

### 2.2 Test Locally

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Test the application at `http://localhost:3000`
4. Verify you can:
   - Select a staff member and enter task counts
   - Login as admin using your password
   - Access all admin features

### 2.3 Push to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a repository on GitHub
3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/productivity-tracker.git
   git push -u origin main
   ```

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [https://vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project

### 3.2 Configure Environment Variables

1. Before deploying, add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `ADMIN_PASSWORD`: Your chosen admin password
   - `NEXT_PUBLIC_DEFAULT_TIMEZONE`: `Australia/Sydney` (or your timezone)

2. Click "Deploy"

### 3.3 Wait for Deployment

1. Vercel will build and deploy your application
2. This usually takes 2-3 minutes
3. Once complete, you'll get a URL like `https://your-app.vercel.app`

## Step 4: Post-Deployment Setup

### 4.1 Test Your Deployment

1. Visit your Vercel URL
2. Test all functionality:
   - Staff can enter daily tasks
   - Admin login works
   - All admin features function correctly
   - Data persists in Supabase

### 4.2 Custom Domain (Optional)

1. In Vercel, go to your project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to update DNS

### 4.3 Set Up Monitoring

1. Vercel provides basic analytics for free
2. Consider setting up:
   - Vercel Analytics for performance monitoring
   - Supabase dashboard for database monitoring
   - Error tracking (e.g., Sentry) for production

## Troubleshooting

### Common Issues

1. **"Invalid API key" errors**
   - Double-check your Supabase keys in Vercel environment variables
   - Ensure you're using the `anon` key, not the `service_role` key

2. **"Cannot connect to database"**
   - Verify your Supabase project is active
   - Check that tables were created successfully
   - Ensure Row Level Security policies allow access

3. **Build failures on Vercel**
   - Check the build logs for specific errors
   - Ensure all dependencies are in package.json
   - Try building locally first with `npm run build`

4. **Admin login not working**
   - Verify ADMIN_PASSWORD is set in Vercel environment variables
   - Check browser console for errors
   - Ensure the API route is deployed correctly

### Getting Help

- Check Vercel deployment logs for errors
- Review Supabase logs in the dashboard
- Test locally to isolate issues
- Check browser console for client-side errors

## Security Checklist

Before going to production:

- [ ] Change the default admin password
- [ ] Enable Row Level Security in Supabase
- [ ] Set up proper authentication (consider Supabase Auth)
- [ ] Review and restrict database permissions
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set up backup strategy for database
- [ ] Configure rate limiting if needed
- [ ] Review all environment variables

## Maintenance

### Regular Tasks

1. **Database Backups**
   - Supabase provides daily backups on paid plans
   - Consider exporting data regularly on free tier

2. **Monitoring**
   - Check Vercel analytics weekly
   - Review Supabase usage to stay within limits
   - Monitor error rates and performance

3. **Updates**
   - Keep dependencies updated
   - Review and update security patches
   - Test updates in development first

### Scaling Considerations

As your usage grows:

1. **Database**
   - Monitor Supabase usage limits
   - Consider upgrading Supabase plan
   - Optimize queries if needed

2. **Frontend**
   - Vercel scales automatically
   - Monitor performance metrics
   - Consider caching strategies

3. **Features**
   - Add proper user authentication
   - Implement data archiving
   - Add more detailed reporting

## Conclusion

Your Productivity Tracker should now be live and accessible to your team. Remember to:

1. Share the URL with your team
2. Provide the admin password to authorized users only
3. Train staff on how to use the system
4. Regularly backup your data
5. Monitor usage and gather feedback for improvements

For additional help, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
