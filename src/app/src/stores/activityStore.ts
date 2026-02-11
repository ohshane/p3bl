import { create } from 'zustand'
import type { VoyagePanel, PreCheckResult, PreCheckItem } from '@/types'
import { storePrecheckResults } from '@/server/api'
import { getConfiguredAIModel } from '@/lib/ai-config'
import { aiChatCompletion } from '@/server/api/ai'

// Helper function to call AI for pre-check via server proxy
async function callOpenRouterForPreCheck(content: string, rubricContext?: string): Promise<{
  overallScore: 'ready' | 'needs_work' | 'critical_issues'
  score: number
  items: PreCheckItem[]
  rubricScores?: Record<string, number>
}> {
  const rubricScoresInstruction = rubricContext
    ? `- rubricScores: an object mapping each rubric criterion name to its score (0-100). Use the exact criterion names as keys.\n`
    : ''

  const systemPrompt = `You are an academic writing assistant that reviews student submissions. 
Analyze the following content and provide feedback.

${rubricContext ? `Rubric criteria to consider:\n${rubricContext}\n` : ''}

Respond with a JSON object containing:
- overallScore: "ready" (good to submit), "needs_work" (minor issues), or "critical_issues" (major problems)
- score: a number from 0-100 representing overall quality${rubricContext ? ' (should reflect the weighted rubric scores)' : ''}
${rubricScoresInstruction}- items: an array of feedback items, each with:
  - id: unique string
  - severity: "critical", "warning", or "suggestion"
  - message: what the issue is
  - suggestion: how to fix it

Only return valid JSON, no other text.`

  try {
    const aiModel = await getConfiguredAIModel()
    const result = await aiChatCompletion({
      data: {
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please review this submission:\n\n${content}` },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      },
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    const responseText = result.content || '{}'
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    throw new Error('Invalid response format')
  } catch (error) {
    console.error('AI pre-check error:', error)
    // Fall back to basic analysis if API fails
    return generateBasicPreCheck(content)
  }
}

// Basic pre-check as fallback when API is unavailable
function generateBasicPreCheck(content: string): {
  overallScore: 'ready' | 'needs_work' | 'critical_issues'
  score: number
  items: PreCheckItem[]
} {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const items: PreCheckItem[] = []
  let score = 60

  if (wordCount < 100) {
    items.push({
      id: 'pc_length',
      rubricItemId: 'rub_001',
      severity: 'critical',
      message: 'Content is too short. Minimum 500 words recommended.',
      suggestion: 'Expand your analysis with more detail and examples.',
    })
  } else if (wordCount < 300) {
    items.push({
      id: 'pc_length_warn',
      rubricItemId: 'rub_001',
      severity: 'warning',
      message: 'Content could be more comprehensive.',
      suggestion: 'Consider adding more supporting evidence or examples.',
    })
    score += 15
  } else {
    score += 30
  }

  const overallStatus: 'ready' | 'needs_work' | 'critical_issues' = 
    items.some(i => i.severity === 'critical') ? 'critical_issues' :
    items.some(i => i.severity === 'warning') ? 'needs_work' :
    'ready'

  return { overallScore: overallStatus, score: Math.min(100, score), items }
}

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
  runPreCheck: (artifactId?: string, rubricContext?: string) => Promise<PreCheckResult>
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
  
  runPreCheck: async (artifactId?: string, rubricContext?: string) => {
    set({ isRunningPreCheck: true })
    
    const { editorContent } = get()
    
    try {
      // Use AI-powered pre-check
      const aiResult = await callOpenRouterForPreCheck(editorContent, rubricContext)
      
      const result: PreCheckResult = {
        id: `pc_${Date.now()}`,
        overallStatus: aiResult.overallScore,
        score: aiResult.score,
        items: aiResult.items.map((item, idx) => ({
          ...item,
          id: item.id || `pc_item_${idx}`,
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
              feedback: result.items.map(item => ({
                severity: item.severity,
                message: item.message,
                suggestion: item.suggestion,
              })),
              rubricScores: aiResult.rubricScores,
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
      
      // Fallback to basic pre-check
      const basicResult = generateBasicPreCheck(editorContent)
      const result: PreCheckResult = {
        id: `pc_${Date.now()}`,
        overallStatus: basicResult.overallScore,
        score: basicResult.score,
        items: basicResult.items,
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
