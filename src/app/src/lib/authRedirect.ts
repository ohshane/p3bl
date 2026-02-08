const AUTH_REDIRECT_STORAGE_KEY = 'p3bl:auth-redirect'

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
