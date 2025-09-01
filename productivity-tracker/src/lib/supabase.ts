import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createPagesBrowserClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey
})

// Database types
export interface Staff {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Task {
  id: string
  name: string
  category: string
  expected_duration_minutes: number
  is_active: boolean
  created_at: string
}

export interface DailyEntry {
  id: string
  staff_id: string
  entry_date: string
  total_calculated_time_minutes: number
  productivity_ratio: number
  created_at: string
  updated_at: string
}

export interface DailyEntryItem {
  id: string
  daily_entry_id: string
  task_id: string
  count: number
  calculated_time_minutes: number
  created_at: string
}

// View types for joined data
export interface DailyEntryWithStaff extends DailyEntry {
  staff: Staff
}

export interface DailyEntryItemWithTask extends DailyEntryItem {
  task: Task
}

export interface TeamOutputRow {
  staff_name: string
  entry_date: string
  task_name: string
  task_category: string
  count: number
  calculated_time_minutes: number
  total_calculated_time_minutes: number
  productivity_ratio: number
}
