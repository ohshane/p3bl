import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Store, Search, Loader2, PackageOpen, Library, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { getStoreTemplates, cloneStoreTemplate } from '@/server/api/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function CreatorStore() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cloningId, setCloningId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStoreTemplates() {
      if (!currentUser?.id) return
      setIsLoading(true)
      try {
        const result = await getStoreTemplates({ data: { creatorId: currentUser.id } })
        if (result.success) {
          setTemplates(result.templates || [])
        }
      } catch (error) {
        console.error('Failed to fetch store templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoreTemplates()
  }, [currentUser?.id])

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.creatorName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCloneToLibrary = async (template: any) => {
    if (!currentUser?.id) return
    setCloningId(template.id)
    try {
      const result = await cloneStoreTemplate({
        data: {
          templateId: template.id,
          creatorId: currentUser.id,
        },
      })
      if (result.success) {
        toast.success('Template added to your library!')
        navigate({ to: '/creator/library' })
      } else {
        toast.error(result.error || 'Failed to clone template')
      }
    } catch (error) {
      console.error('Clone store template error:', error)
      toast.error('Failed to clone template')
    } finally {
      setCloningId(null)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Store className="w-8 h-8 text-violet-500" />
            Template Store
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and clone templates shared by creators
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search templates by title, description, or creator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-card border-border"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
          <p className="text-muted-foreground">Loading store templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-dashed py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <PackageOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No templates in the store</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            {searchQuery
              ? `No templates matching "${searchQuery}"`
              : "No creators have published templates yet. You can publish your own from the library!"}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate({ to: '/creator/library' })} variant="outline">
              Go to Library
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="bg-card border-border hover:border-violet-500/50 transition-all group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="bg-violet-500/10 text-violet-500 border-none">
                      Shared Template
                    </Badge>
                    {template.isOwn && (
                      <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-500 border-none">
                        Yours
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {template.sessionCount} sessions
                  </span>
                </div>
                <h3
                  className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-violet-500 transition-colors cursor-pointer"
                  onClick={() => navigate({ to: '/creator/store/$id', params: { id: template.id } })}
                >
                  {template.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {template.description || template.drivingQuestion}
                </p>
              </CardHeader>
              <CardContent>
                {/* Creator info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <User className="w-4 h-4" />
                  <span>by {template.creatorName}{template.isOwn ? ' (you)' : ''}</span>
                </div>

                {template.isOwn ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate({ to: '/creator/library' })}
                  >
                    <Library className="w-4 h-4 mr-2" />
                    View in Library
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => handleCloneToLibrary(template)}
                    disabled={cloningId === template.id}
                  >
                    {cloningId === template.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cloning...
                      </>
                    ) : (
                      <>
                        <Library className="w-4 h-4 mr-2" />
                        Add to Library
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
