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
