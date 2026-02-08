import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import { listUsers, deleteUser, type UserListItem } from '@/server/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { EditRoleDialog } from '@/components/admin/EditRoleDialog'
import { 
  Search, 
  UserPlus, 
  Loader2, 
  MoreVertical,
  Pencil,
  Trash2,
  Shield,
  Compass,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const Route = createFileRoute('/admin/users/')({
  component: UsersPage,
})

function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | 'role'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editRoleUser, setEditRoleUser] = useState<UserListItem | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await listUsers({
        data: {
          page,
          limit,
          search: search || undefined,
          role: roleFilter === 'all' ? undefined : roleFilter as 'explorer' | 'creator' | 'admin',
          sortBy,
          sortOrder,
        }
      })
      
      if (result.success) {
        setUsers(result.users)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, roleFilter, sortBy, sortOrder])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, sortBy, sortOrder])

  const handleDelete = async () => {
    if (!deleteUserId) return
    
    setDeleteLoading(true)
    try {
      const result = await deleteUser({ data: { userId: deleteUserId } })
      if (result.success) {
        loadUsers()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to delete user')
    } finally {
      setDeleteLoading(false)
      setDeleteUserId(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'creator':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
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
      default:
        return <Compass className="w-3 h-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-500" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? 'user' : 'users'} total
          </p>
        </div>
        <Button 
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-card border border-border rounded-xl p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px] bg-background border-border">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="explorer">Explorer</SelectItem>
            <SelectItem value="creator">Creator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[140px] bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="createdAt">Date Joined</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="role">Role</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="border-border"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-foreground font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.role.map((r) => (
                        <Badge key={r} className={`${getRoleBadgeColor(r)} gap-1`}>
                          {getRoleIcon(r)}
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{user.level}</span>
                      <span className="text-sm text-muted-foreground">({user.xp} XP)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem 
                          className="text-popover-foreground focus:text-foreground focus:bg-muted"
                          onClick={() => setEditRoleUser(user)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setDeleteUserId(user.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={loadUsers}
      />

      {/* Edit Role Dialog */}
      <EditRoleDialog
        open={!!editRoleUser}
        onOpenChange={(open) => !open && setEditRoleUser(null)}
        user={editRoleUser}
        onRoleUpdated={loadUsers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this user? This action cannot be undone.
              All user data including projects, artifacts, and progress will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
