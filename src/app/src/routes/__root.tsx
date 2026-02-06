import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

import { useViewportGuard } from '@/hooks/useViewportGuard'
import { MobileBlocker } from '@/components/layout/MobileBlocker'
import { AppHeader } from '@/components/layout/AppHeader'
import { FloatingBot } from '@/components/shared/FloatingBot'
import { useAuthStore } from '@/stores/authStore'

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
  const { isAuthenticated, currentUser } = useAuthStore()
  
  // Show floating bot only in onboarding mode or waiting lounge
  const showFloatingBot = isAuthenticated && 
    currentUser && 
    (!currentUser.joinedProjectIds || currentUser.joinedProjectIds.length === 0)

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
              {showFloatingBot && <FloatingBot />}
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
