import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getSystemSettings, updateSystemSetting } from '@/server/api/admin'
import { SETTING_KEYS } from '@/db/schema/settings'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings,
  Loader2,
  Save,
  Bot,
  Check,
  AlertCircle,
  Search,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/settings/')({
  component: AdminSettings,
})

import { aiListModels } from '@/server/api/ai'

interface OpenRouterModel {
  id: string
  name: string
  description?: string
  pricing?: {
    prompt: string
    completion: string
  }
  context_length?: number
  top_provider?: {
    max_completion_tokens?: number
  }
}

function AdminSettings() {
  const { currentUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Settings state
  const [aiModel, setAiModel] = useState('')
  const [savedModel, setSavedModel] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  
  // Models from API
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [modelSearch, setModelSearch] = useState('')

  // Fetch models via server-side proxy
  const fetchModels = async () => {
    setLoadingModels(true)
    try {
      const result = await aiListModels()
      if (result.success) {
        const sortedModels = (result.models || [])
          .sort((a: OpenRouterModel, b: OpenRouterModel) => a.name.localeCompare(b.name))
        setModels(sortedModels)
      } else {
        console.error('Failed to fetch models:', result.error)
      }
    } catch (err) {
      console.error('Error fetching models:', err)
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await getSystemSettings()
        if (result.success) {
          const modelSetting = result.settings.find(s => s.key === SETTING_KEYS.AI_MODEL)
          if (modelSetting) {
            setAiModel(modelSetting.value)
            setSavedModel(modelSetting.value)
            setLastUpdated(modelSetting.updatedAt)
          }
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
    fetchModels()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (!aiModel) {
        toast.error('Please select an AI model')
        setSaving(false)
        return
      }

      const result = await updateSystemSetting({
        data: {
          key: SETTING_KEYS.AI_MODEL,
          value: aiModel,
          updatedBy: currentUser?.id,
        }
      })

      if (result.success) {
        setSavedModel(aiModel)
        setLastUpdated(result.setting.updatedAt)
        toast.success('Settings saved successfully')
      } else {
        toast.error(result.error)
      }
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Filter models based on search
  const filteredModels = models.filter(model => 
    model.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
    model.name.toLowerCase().includes(modelSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-500" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure application-wide settings</p>
      </div>

      {/* AI Model Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-500" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>
            Select the AI model used for generating content, chat responses, and analysis across the platform.
            Models are fetched from OpenRouter API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Model Display */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Model</p>
                <p className="font-mono text-foreground text-lg">
                  {savedModel || '(not set)'}
                </p>
              </div>
              {lastUpdated && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm text-foreground">
                    {new Date(lastUpdated).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Model Search */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Select a Model</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchModels}
                disabled={loadingModels}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={cn("w-4 h-4 mr-1", loadingModels && "animate-spin")} />
                Refresh
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Search models..."
                className="pl-9 bg-background border-border"
              />
            </div>
          </div>

          {/* Models List */}
          <div className="border border-border rounded-lg">
            {loadingModels ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                <span className="ml-2 text-muted-foreground">Loading models...</span>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {modelSearch ? 'No models match your search' : 'No models available'}
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="divide-y divide-border">
                  {filteredModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setAiModel(model.id)}
                      className={cn(
                        "w-full p-4 text-left transition-colors hover:bg-muted/50",
                        aiModel === model.id && "bg-cyan-600/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {model.name}
                            </span>
                            {aiModel === model.id && (
                              <Check className="w-4 h-4 text-cyan-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono block truncate">
                            {model.id}
                          </span>
                        </div>
                        {model.context_length && (
                          <span className="text-xs text-muted-foreground ml-4 shrink-0">
                            {(model.context_length / 1000).toFixed(0)}k ctx
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Custom Model Input */}
          <div className="space-y-2">
            <Label className="text-foreground">Or enter a custom model ID</Label>
            <Input
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="e.g., google/gemini-2.0-flash-001"
              className="bg-background border-border font-mono"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
