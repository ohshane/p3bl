import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { Bell, LogOut, User, ChevronDown, Settings, LayoutDashboard, FolderPlus, Briefcase, Calendar, Shield, PenTool, Compass, Library } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'

export function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    currentUser, 
    notifications, 
    unreadNotificationCount,
    logout,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuthStore()

  const roles = currentUser?.role ?? []
  const hasAdmin = roles.includes('admin')
  const hasCreator = roles.includes('creator')
  const hasExplorer = roles.includes('explorer')
  const isAdminView = location.pathname.startsWith('/admin')
  const isCreatorView = location.pathname.startsWith('/creator')
  const isExplorerView = location.pathname.startsWith('/explorer') || location.pathname.startsWith('/activity')

  const homeLink = hasAdmin ? '/admin' : isCreatorView ? '/creator' : '/explorer'

  const handleLogout = () => {
    logout()
    navigate({ to: '/' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_earned':
        return '🏆'
      case 'level_up':
        return '⬆️'
      case 'new_feedback':
        return '💬'
      case 'review_complete':
        return '✅'
      case 'deadline_reminder':
        return '⏰'
      case 'team_message':
        return '👥'
      default:
        return '🔔'
    }
  }

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Logo & View Switcher */}
      <div className="flex items-center gap-4">
        <Link to={homeLink} className="flex items-center gap-3">
          <img 
            src="/android-chrome-192x192.png" 
            alt="Peabee" 
            className="w-10 h-10 rounded-xl"
          />
          <span className="text-xl font-semibold text-foreground hidden sm:block">
            Peabee
          </span>
        </Link>
        
        {/* View Switcher - shows all roles the user has */}
        {roles.length > 0 && (
          <div className="hidden sm:flex items-center bg-muted rounded-lg p-1">
            {hasAdmin && (
              <button
                onClick={() => navigate({ to: '/admin' })}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  isAdminView 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5 inline mr-1" />
                Admin
              </button>
            )}
            {hasCreator && (
              <button
                onClick={() => navigate({ to: '/creator' })}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  isCreatorView 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 inline mr-1" />
                Creator
              </button>
            )}
            {hasExplorer && (
              <button
                onClick={() => navigate({ to: '/explorer' })}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  isExplorerView 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Compass className="w-3.5 h-3.5 inline mr-1" />
                Explorer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links - Center */}
      <nav className="hidden md:flex items-center gap-6">
        {isAdminView && (
          <>
            <Link
              to="/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <LayoutDashboard className="w-4 h-4 inline mr-1" />
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <User className="w-4 h-4 inline mr-1" />
              Users
            </Link>
            <Link
              to="/admin/settings"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Settings
            </Link>
          </>
        )}
        {isCreatorView && (
          <>
            <Link
              to="/creator"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <LayoutDashboard className="w-4 h-4 inline mr-1" />
              Dashboard
            </Link>
            <Link
              to="/creator/calendar"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Calendar
            </Link>
            <Link
              to="/creator/library"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <Library className="w-4 h-4 inline mr-1" />
              Library
            </Link>
            <Link
              to="/creator/project/new"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <FolderPlus className="w-4 h-4 inline mr-1" />
              New Project
            </Link>
          </>
        )}
        {isExplorerView && (
          <>
            <Link
              to="/explorer"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <LayoutDashboard className="w-4 h-4 inline mr-1" />
              Dashboard
            </Link>
            <Link
              to="/explorer/calendar"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Calendar
            </Link>
            <Link
              to="/explorer/portfolio"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-sm font-medium text-foreground' }}
            >
              <Briefcase className="w-4 h-4 inline mr-1" />
              Portfolio
            </Link>
          </>
        )}
      </nav>

      {/* Right side - Notifications & Profile */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {currentUser && (
          <>
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadNotificationCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllNotificationsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {!notifications || notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.slice(0, 10).map(notification => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            markNotificationRead(notification.id)
                            if (notification.actionUrl) {
                              navigate({ to: notification.actionUrl })
                            }
                          }}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                            !notification.read ? 'bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatarUrl || undefined} />
                    <AvatarFallback className="bg-cyan-600 text-white text-sm">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{currentUser.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Level {currentUser.level} • {currentUser.xp} XP
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isExplorerView && (
                  <DropdownMenuItem asChild>
                    <Link to="/explorer/portfolio" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Portfolio
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                  <Badge variant="outline" className="ml-auto text-xs">
                    Soon
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  )
}
