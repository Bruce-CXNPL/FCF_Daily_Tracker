# Productivity Tracker

A web application for operations teams to record daily task counts and calculate estimated time spent based on configurable task durations.

## Features

### Staff Input (Landing Page)
- Staff selection dropdown with preset staff names
- Date selector for recording task data
- Task table organized by categories
- Real-time calculation of total time spent
- Automatic save/update functionality for daily entries

### Admin Dashboard
Three main sections accessible via tabs:

1. **Staff Daily Output**
   - View daily productivity data by staff member
   - Filter by date range and specific staff
   - Export data to CSV
   - Expandable rows showing task breakdown

2. **Task Calibration**
   - Manage expected duration for each task
   - Add new tasks to existing categories
   - Create new categories
   - Edit or delete existing tasks

3. **Staff Management**
   - Add new staff members
   - Rename existing staff
   - Activate/deactivate staff members
   - Inactive staff are hidden from the input dropdown

## Tech Stack

- **Frontend**: Next.js 15.5.0 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Vercel account (for deployment)

### Local Development

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

1. Create a new Supabase project
2. Run the SQL scripts in order:
   - `database/schema.sql` - Creates the database structure
   - `database/seed.sql` - Adds initial data

### Admin Access

- Click "Admin Login" on the home page
- Default password: `admin123` (change this in production via environment variable)
- Admin mode persists in browser localStorage

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
4. Deploy

The `vercel.json` file is pre-configured with the necessary build settings.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `ADMIN_PASSWORD` | Password for admin access | Yes |
| `NEXT_PUBLIC_DEFAULT_TIMEZONE` | Default timezone (defaults to Australia/Sydney) | No |

## Data Model

### Tables

- **staff**: Employee records with active/inactive status
- **tasks**: Task definitions with categories and expected durations
- **daily_entries**: Header records for staff daily submissions
- **daily_entry_items**: Individual task counts for each daily entry

### Calculations

- Total time = Σ(task_count × expected_duration_minutes)
- Productivity ratio = total_minutes / 450 (based on 7.5 hour workday)

## Migration from Demo

If you're migrating from the demo.html version, see `MIGRATION_GUIDE.md` for detailed instructions.

## Security Considerations

- The admin authentication is basic and suitable for internal tools
- For production use, consider implementing:
  - Proper authentication (OAuth, SSO)
  - Row-level security in Supabase
  - API rate limiting
  - Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.
