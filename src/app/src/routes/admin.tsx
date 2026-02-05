import { createFileRoute, useNavigate, Outlet, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { 
  LayoutDashboard, 
  Users, 
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuthStore()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/signin' })
      return
    }
    
    // Redirect non-admins to their appropriate dashboard
    if (currentUser && currentUser.role !== 'admin') {
      if (currentUser.role === 'creator' || currentUser.role === 'pioneer') {
        navigate({ to: '/creator' })
      } else {
        navigate({ to: '/explorer' })
      }
    }
  }, [isAuthenticated, currentUser, navigate])

  // Don't render until auth check is complete
  if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', label: 'Users', icon: Users },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-64 shrink-0">
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
                Administration
              </h2>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to)
                  
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                          isActive
                            ? 'bg-cyan-500/10 text-cyan-600'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
