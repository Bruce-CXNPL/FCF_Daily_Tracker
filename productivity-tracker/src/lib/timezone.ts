import { format, parseISO } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'

const SYDNEY_TIMEZONE = 'Australia/Sydney'

/**
 * Get current date in Sydney timezone as YYYY-MM-DD string
 */
export function getCurrentSydneyDate(): string {
  const now = new Date()
  const sydneyTime = utcToZonedTime(now, SYDNEY_TIMEZONE)
  return format(sydneyTime, 'yyyy-MM-dd')
}

/**
 * Convert a date string to Sydney timezone and format as YYYY-MM-DD
 */
export function toSydneyDateString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const sydneyTime = utcToZonedTime(dateObj, SYDNEY_TIMEZONE)
  return format(sydneyTime, 'yyyy-MM-dd')
}

/**
 * Convert a Sydney date string to UTC for database storage
 */
export function sydneyDateToUtc(dateString: string): Date {
  // Parse as Sydney date at start of day (00:00:00)
  const sydneyDate = new Date(`${dateString}T00:00:00`)
  return zonedTimeToUtc(sydneyDate, SYDNEY_TIMEZONE)
}

/**
 * Format a date for display in Sydney timezone
 */
export function formatSydneyDate(date: Date | string, formatString: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const sydneyTime = utcToZonedTime(dateObj, SYDNEY_TIMEZONE)
  return format(sydneyTime, formatString)
}

/**
 * Get date range for filtering (both dates in Sydney timezone)
 */
export function getDateRange(startDate: string, endDate: string) {
  return {
    start: sydneyDateToUtc(startDate).toISOString(),
    end: sydneyDateToUtc(endDate).toISOString()
  }
}

/**
 * Get default date range for current week in Sydney timezone
 */
export function getCurrentWeekRange() {
  const today = getCurrentSydneyDate()
  const todayDate = new Date(today)
  const dayOfWeek = todayDate.getDay()
  
  // Get Monday of current week
  const monday = new Date(todayDate)
  monday.setDate(todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
  
  // Get Friday of current week
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  
  return {
    start: format(monday, 'yyyy-MM-dd'),
    end: format(friday, 'yyyy-MM-dd')
  }
}
