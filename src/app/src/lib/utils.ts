import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely format a date string. Returns fallback if the date is invalid.
 * Handles null, undefined, empty strings, and invalid date values.
 */
export function safeFormatDate(
  dateString: string | null | undefined,
  formatStr: string,
  fallback = 'N/A'
): string {
  if (!dateString) return fallback
  
  try {
    const date = new Date(dateString)
    // Check if date is valid (getTime returns NaN for invalid dates)
    if (isNaN(date.getTime())) return fallback
    return format(date, formatStr)
  } catch {
    return fallback
  }
}

/**
 * Check if a date string is valid
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

export function getProjectTimeStatus(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): 'scheduled' | 'opened' | 'closed' {
  const now = new Date()
  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null

  if (start && !isNaN(start.getTime()) && start > now) {
    return 'scheduled'
  }

  if (end && !isNaN(end.getTime()) && end <= now) {
    return 'closed'
  }

  return 'opened'
}

/**
 * Calculate the progress percentage of a project based on duration and current time.
 * Returns 0 if scheduled, 100 if closed, or percentage if opened.
 */
export function getProjectProgress(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number {
  const now = new Date().getTime()
  const start = startDate ? new Date(startDate).getTime() : null
  const end = endDate ? new Date(endDate).getTime() : null

  if (!start || !end || isNaN(start) || isNaN(end)) {
    return 0
  }

  if (now < start) {
    return 0
  }

  if (now >= end) {
    return 100
  }

  const total = end - start
  const elapsed = now - start
  return Math.round((elapsed / total) * 100)
}

/**
 * Format duration in milliseconds to a human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return `${seconds}s`
}

/**
 * Get elapsed time and time left for a project
 */
export function getProjectTimeInfo(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { elapsed: string; remaining: string } {
  const now = new Date().getTime()
  const start = startDate ? new Date(startDate).getTime() : null
  const end = endDate ? new Date(endDate).getTime() : null

  if (!start || !end || isNaN(start) || isNaN(end)) {
    return { elapsed: '-', remaining: '-' }
  }

  if (now < start) {
    const total = end - start
    return { elapsed: '-', remaining: formatDuration(total) }
  }

  if (now >= end) {
    const total = end - start
    return { elapsed: formatDuration(total), remaining: '-' }
  }

  const elapsed = now - start
  const remaining = end - now
  return { elapsed: formatDuration(elapsed), remaining: formatDuration(remaining) }
}
