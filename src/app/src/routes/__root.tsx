import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { useEffect } from 'react'

import { useViewportGuard } from '@/hooks/useViewportGuard'
import { MobileBlocker } from '@/components/layout/MobileBlocker'
import { AppHeader } from '@/components/layout/AppHeader'
import { useAuthStore } from '@/stores/authStore'
import { storeRedirectPath } from '@/lib/authRedirect'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Peabee - Project-Based Learning Platform',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
})

function RootComponent() {
  const { isDesktop, minWidth } = useViewportGuard()
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const search = location.search
    const searchString = (() => {
      if (!search) return ''
      if (typeof search === 'string') {
        return search.startsWith('?') ? search : `?${search}`
      }

      const params = new URLSearchParams(search as Record<string, string>)
      const serialized = params.toString()
      return serialized ? `?${serialized}` : ''
    })()

    const path = `${location.pathname}${searchString}${location.hash ?? ''}`
    storeRedirectPath(path)
  }, [location.pathname, location.search, location.hash])
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {!isDesktop ? (
            <MobileBlocker minWidth={minWidth} />
          ) : (
            <>
              {isAuthenticated && <AppHeader />}
              <main>
                <Outlet />
              </main>
              <Toaster position="top-right" />
            </>
          )}
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  )
}
