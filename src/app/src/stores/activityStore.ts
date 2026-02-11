import { create } from 'zustand'
import type { VoyagePanel, PreCheckResult } from '@/types'
import { storePrecheckResults, runExplorerPrecheck } from '@/server/api'
import { getConfiguredAIModel } from '@/lib/ai-config'
import { aiChatCompletion } from '@/server/api/ai'

// Helper function to generate ghost suggestions using AI
async function generateAIGhostSuggestion(content: string, context?: string): Promise<string> {
  try {
    const aiModel = await getConfiguredAIModel()
    const result = await aiChatCompletion({
      data: {
        model: aiModel,
        messages: [
          {
            role: 'system',
            content: `You are a writing assistant that suggests the next sentence to continue academic writing.
${context ? `Context: ${context}` : ''}
Provide only 1 sentence as a natural continuation. No explanation, just the sentence.`,
          },
          { role: 'user', content: `Continue this text:\n\n${content.slice(-500)}` },
        ],
        max_tokens: 100,
        temperature: 0.7,
      },
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.content?.trim() || ''
  } catch (error) {
    console.error('Ghost suggestion error:', error)
    return ''
  }
}

interface ActivityState {
  // Current activity state
  currentProjectId: string | null
  currentSessionIndex: number
  expandedPanel: VoyagePanel
  
  // Editor state
  editorContent: string
  isDirty: boolean
  lastSaved: string | null
  
  // Pre-check state
  isRunningPreCheck: boolean
  preCheckResult: PreCheckResult | null
  
  // Submission state
  isSubmitting: boolean
  
  // Ghost typing state
  ghostSuggestion: string | null
  isGhostTypingEnabled: boolean
  
  // Resource hub state
  isResourceHubExpanded: boolean

  // External action handlers
  runPreCheckAction?: () => void
  submitAction?: () => void
  
  // Actions
  setCurrentProject: (projectId: string | null) => void
  setCurrentSession: (sessionIndex: number) => void
  setExpandedPanel: (panel: VoyagePanel) => void
  
  // Editor actions
  setEditorContent: (content: string) => void
  markSaved: () => void
  
  // Pre-check actions
  runPreCheck: (artifactId?: string, rubrics?: Array<{ id: string; criterion: string; description: string; weight: number }>) => Promise<PreCheckResult>
  clearPreCheck: () => void
  
  // Ghost typing
  setGhostSuggestion: (suggestion: string | null) => void
  acceptGhostSuggestion: () => void
  toggleGhostTyping: () => void
  
  // Resource hub
  toggleResourceHub: () => void

  // External actions
  setActionHandlers: (handlers: {
    runPreCheck?: () => void
    submit?: () => void
  }) => void
}



export const useActivityStore = create<ActivityState>((set, get) => ({
  currentProjectId: null,
  currentSessionIndex: 0,
  expandedPanel: 'cockpit',
  
  editorContent: '',
  isDirty: false,
  lastSaved: null,
  
  isRunningPreCheck: false,
  preCheckResult: null,
  
  isSubmitting: false,
  
  ghostSuggestion: null,
  isGhostTypingEnabled: true,
  
  isResourceHubExpanded: true,

  runPreCheckAction: undefined,
  submitAction: undefined,
  
  setCurrentProject: (projectId: string | null) => {
    const { currentProjectId } = get()
    // Only reset editor state when actually switching projects
    if (projectId === currentProjectId) return
    set({ 
      currentProjectId: projectId,
      currentSessionIndex: 0,
      expandedPanel: 'cockpit',
      editorContent: '',
      isDirty: false,
      preCheckResult: null,
    })
  },
  
  setCurrentSession: (sessionIndex: number) => {
    const { currentSessionIndex } = get()
    // Only reset editor state when actually switching sessions
    if (sessionIndex === currentSessionIndex) return
    set({ 
      currentSessionIndex: sessionIndex,
      expandedPanel: 'cockpit',
      editorContent: '',
      isDirty: false,
      preCheckResult: null,
      ghostSuggestion: null,
    })
  },
  
  setExpandedPanel: (panel: VoyagePanel) => {
    set({ expandedPanel: panel })
  },
  
  setEditorContent: (content: string) => {
    set({ 
      editorContent: content, 
      isDirty: true,
      ghostSuggestion: null, // Clear ghost suggestion when typing
    })
  },
  
  markSaved: () => {
    set({ 
      isDirty: false, 
      lastSaved: new Date().toISOString() 
    })
  },
  
  runPreCheck: async (artifactId?: string, rubrics?: Array<{ id: string; criterion: string; description: string; weight: number }>) => {
    set({ isRunningPreCheck: true })
    
    const { editorContent } = get()
    
    try {
      // Map frontend RubricItem shape (criterion) to DB shape (criteria) so
      // the server function uses the exact same field names as submission scoring.
      const serverRubrics = (rubrics || []).map(r => ({
        id: r.id,
        criteria: r.criterion,
        description: r.description as string | null,
        weight: r.weight,
      }))

      // Call the same server-side scoring pipeline used at submission time.
      // This ensures identical model, prompt, key-normalization, and fallback
      // logic, so the explorer Pre-check score matches the creator AI Score.
      const aiResult = await runExplorerPrecheck({
        data: {
          content: editorContent,
          rubrics: serverRubrics,
        },
      })
      
      const result: PreCheckResult = {
        id: `pc_${Date.now()}`,
        overallStatus: aiResult.overallScore,
        score: aiResult.score,
        items: aiResult.items.map((item: { id?: string; severity: 'critical' | 'warning' | 'suggestion'; message: string; suggestion?: string }, idx: number) => ({
          id: item.id || `pc_item_${idx}`,
          rubricItemId: '',
          severity: item.severity,
          message: item.message,
          suggestion: item.suggestion || '',
        })),
        generatedAt: new Date().toISOString(),
      }
      
      // Store pre-check results in database if artifactId provided
      if (artifactId) {
        try {
          await storePrecheckResults({
            data: {
              artifactId,
              overallScore: result.overallStatus,
              score: aiResult.score,
              feedback: result.items.map(item => ({
                severity: item.severity,
                message: item.message,
                suggestion: item.suggestion,
              })),
              rubricScores: aiResult.rubricScores,
              contentSnapshot: editorContent,
            },
          })
        } catch (error) {
          console.error('Failed to store pre-check results:', error)
        }
      }
      
      set({ 
        isRunningPreCheck: false, 
        preCheckResult: result 
      })
      
      return result
    } catch (error) {
      console.error('Pre-check error:', error)
      
      // The server function already handles fallback internally, so if we
      // reach here it's a network/transport error. Build a minimal result.
      const result: PreCheckResult = {
        id: `pc_${Date.now()}`,
        overallStatus: 'needs_work',
        score: 0,
        items: [{
          id: 'pc_error',
          rubricItemId: '',
          severity: 'warning',
          message: 'Pre-check could not be completed. Please try again.',
          suggestion: 'Check your connection and retry.',
        }],
        generatedAt: new Date().toISOString(),
      }
      
      set({ 
        isRunningPreCheck: false, 
        preCheckResult: result 
      })
      
      return result
    }
  },
  
  clearPreCheck: () => {
    set({ preCheckResult: null })
  },
  
  setGhostSuggestion: (suggestion: string | null) => {
    set({ ghostSuggestion: suggestion })
  },
  
  acceptGhostSuggestion: () => {
    const { editorContent, ghostSuggestion } = get()
    if (ghostSuggestion) {
      set({ 
        editorContent: editorContent + ghostSuggestion,
        ghostSuggestion: null,
        isDirty: true,
      })
    }
  },
  
  toggleGhostTyping: () => {
    set(state => ({ isGhostTypingEnabled: !state.isGhostTypingEnabled }))
  },
  
  toggleResourceHub: () => {
    set(state => ({ isResourceHubExpanded: !state.isResourceHubExpanded }))
  },

  setActionHandlers: (handlers) => {
    set({
      runPreCheckAction: handlers.runPreCheck,
      submitAction: handlers.submit,
    })
  },
}))

// Helper to generate AI-powered ghost suggestion
export const getGhostSuggestion = async (content: string, context?: string): Promise<string> => {
  // Only generate if there's enough content to work with
  if (content.length < 50) {
    return ''
  }
  
  return generateAIGhostSuggestion(content, context)
}
