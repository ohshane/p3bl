import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getAdminStats } from '@/server/api/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Compass, 
  PenTool, 
  Shield,
  Rocket,
  ArrowRight,
  Loader2,
  Settings
} from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

interface Stats {
  totalUsers: number
  explorers: number
  creators: number
  pioneers: number
  admins: number
}

interface RecentUser {
  id: string
  name: string
  email: string
  role: 'explorer' | 'creator' | 'pioneer' | 'admin'
  createdAt: string
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getAdminStats()
        if (result.success) {
          setStats(result.stats)
          setRecentUsers(result.recentUsers)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    loadStats()
  }, [])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'creator':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'pioneer':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />
      case 'creator':
        return <PenTool className="w-3 h-3" />
      case 'pioneer':
        return <Rocket className="w-3 h-3" />
      default:
        return <Compass className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: Users,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    { 
      label: 'Explorers', 
      value: stats?.explorers || 0, 
      icon: Compass,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    { 
      label: 'Creators', 
      value: stats?.creators || 0, 
      icon: PenTool,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    { 
      label: 'Pioneers', 
      value: stats?.pioneers || 0, 
      icon: Rocket,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    { 
      label: 'Admins', 
      value: stats?.admins || 0, 
      icon: Shield,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-500" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage users and system settings</p>
        </div>
        <Link to="/admin/users">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Recent Users</CardTitle>
            <CardDescription>Users registered in the last 7 days</CardDescription>
          </div>
          <Link to="/admin/users">
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No new users in the last 7 days
            </p>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-foreground font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={`${getRoleBadgeColor(user.role)} gap-1`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-600" />
              Create New User
            </CardTitle>
            <CardDescription>
              Add explorers, creators, pioneers, or admins to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full border-border text-muted-foreground hover:bg-muted">
                Go to User Management
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Manage Roles
            </CardTitle>
            <CardDescription>
              Promote users to different roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full border-border text-muted-foreground hover:bg-muted">
                Manage User Roles
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
