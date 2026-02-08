import type { UserRole } from '@/types'

const AUTH_REDIRECT_STORAGE_KEY = 'p3bl:auth-redirect'

/**
 * Returns the home path based on role priority: admin > creator > explorer
 */
export function getRoleBasedHomePath(roles: UserRole[]): string {
  if (roles.includes('admin')) return '/admin'
  if (roles.includes('creator')) return '/creator'
  return '/explorer'
}

export function storeRedirectPath(path: string) {
  if (typeof window === 'undefined') return
  if (!path.startsWith('/')) return
  if (path.startsWith('/signin') || path.startsWith('/signup')) return

  sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, path)
}

export function getStoredRedirectPath() {
  if (typeof window === 'undefined') return null

  const value = sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY)
  if (!value || !value.startsWith('/')) return null
  if (value.startsWith('/signin') || value.startsWith('/signup')) return null

  return value
}

export function clearStoredRedirectPath() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY)
}
