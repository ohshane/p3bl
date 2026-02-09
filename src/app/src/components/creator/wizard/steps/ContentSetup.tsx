import { useState } from 'react'
import { Upload, FileText, Loader2, Sparkles, X } from 'lucide-react'
import { useCreatorStore } from '@/stores/creatorStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getConfiguredAIModel } from '@/lib/ai-config'

// OpenRouter API configuration
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const API_BASE = import.meta.env.VITE_API_BASE || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_URL = `${API_BASE}/chat/completions`

// System prompt for project generation
const PROJECT_GENERATION_PROMPT = `You are an expert educational project designer for a project-based learning platform.
Your task is to generate a compelling project title, background context, and driving question based on keywords provided by educators.

Guidelines:
- Title: Create an engaging, concise project title (5-10 words) that captures the essence of the learning experience
- Background: Write 2-3 sentences providing context about why this objective matters and what will be explored
- Driving Question: Craft an open-ended, thought-provoking question that will guide inquiry throughout the project
- IMPORTANT: Do NOT use the word "student" or "students" anywhere in the output. Use "learner", "participant", "team", or rephrase to avoid addressing anyone directly.`

// JSON schema for structured output
const PROJECT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Engaging project title (5-10 words)" },
    background: { type: "string", description: "2-3 sentences of context" },
    drivingQuestion: { type: "string", description: "Open-ended guiding question" }
  },
  required: ["title", "background", "drivingQuestion"],
  additionalProperties: false
}

interface GeneratedProject {
  title: string
  background: string
  drivingQuestion: string
}

async function generateProjectFromKeywords(keywords: string): Promise<GeneratedProject> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('API key is not configured')
  }

  let aiModel: string
  try {
    aiModel = await getConfiguredAIModel()
    console.log('Using AI model:', aiModel)
  } catch (error) {
    console.error('Error getting AI model, using default:', error)
    aiModel = 'openrouter/auto'
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Peabee Project Generator',
    },
    body: JSON.stringify({
      model: aiModel,
      messages: [
        { role: 'system', content: PROJECT_GENERATION_PROMPT },
        { role: 'user', content: `Generate a project based on these keywords: ${keywords}` },
      ],
      max_tokens: 500,
      temperature: 0.8,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "project_response",
          strict: true,
          schema: PROJECT_RESPONSE_SCHEMA
        }
      }
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content in API response')
  }

  // Parse the JSON response - handle various formats
  try {
    // First, try to extract JSON from markdown code blocks if present
    let jsonContent = content.trim()
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim()
    }
    
    // Try to find JSON object in the response
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonContent = jsonMatch[0]
    }
    
    const parsed = JSON.parse(jsonContent)
    return {
      title: parsed.title || '',
      background: parsed.background || '',
      drivingQuestion: parsed.drivingQuestion || '',
    }
  } catch (parseError) {
    // If JSON parsing fails, log the error for debugging
    console.error('Failed to parse JSON response:', content, parseError)
    throw new Error('Failed to parse AI response. Please try again.')
  }
}

export function ContentSetup() {
  const { wizardState, updateBasicInfo } = useCreatorStore()
  const { mode, basicInfo, uploadedFiles, ragProcessingStatus, validationErrors } = wizardState

  const [keywords, setKeywords] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mock file upload - in real implementation, would upload to server
    const files = e.target.files
    if (files) {
      // Simulate upload
      console.log('Files uploaded:', files)
    }
  }

  const handleGenerateFromKeywords = async () => {
    if (!keywords.trim()) return
    
    // Check if API key is configured
    if (!OPENROUTER_API_KEY) {
      setGenerationError('AI generation is not configured. Please enter project details manually.')
      return
    }
    
    setIsGenerating(true)
    setGenerationError(null)
    
    try {
      const generated = await generateProjectFromKeywords(keywords)
      updateBasicInfo(generated)
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationError(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate project. Please try again.'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Content Analysis & Setup</h2>
        <p className="text-muted-foreground">Define your project's foundation</p>
      </div>

      {/* Document Upload (for document-driven mode) */}
      {mode === 'document' && (
        <div className="p-6 border-2 border-dashed border-border rounded-xl bg-muted/20">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Upload Course Materials</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to upload syllabus, lecture notes, or assignments (PDF, DOCX, PPTX)
            </p>
            <Input
              type="file"
              accept=".pdf,.docx,.pptx,.doc,.ppt"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Select Files
                </span>
              </Button>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <span className="text-sm text-foreground">{file.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {ragProcessingStatus === 'processing' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-cyan-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing documents with AI...
            </div>
          )}
        </div>
      )}

      {/* Keyword Input (for keyword-driven mode) */}
      {mode === 'keyword' && (
        <div className="p-6 bg-card rounded-xl border border-border">
          <Label className="text-foreground mb-2 block">Enter Keywords</Label>
          <div className="flex gap-2">
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., machine learning, data science, python"
              className="bg-background border-border"
            />
            <Button
              onClick={handleGenerateFromKeywords}
              disabled={isGenerating || !keywords.trim()}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enter comma-separated keywords related to your project objective
          </p>
          {generationError && (
            <p className="text-xs text-red-400 mt-2">
              {generationError}
            </p>
          )}
        </div>
      )}

      {/* Basic Info Editor */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-foreground">
            Project Title <span className="text-red-400">*</span>
          </Label>
          <Input
            id="title"
            value={basicInfo.title}
            onChange={(e) => updateBasicInfo({ title: e.target.value })}
            placeholder="Enter a descriptive project title"
            className={`mt-1 bg-background border-border ${
              validationErrors.title ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.title && (
            <p className="text-xs text-red-400 mt-1">{validationErrors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="background" className="text-foreground">Background</Label>
          <Textarea
            id="background"
            value={basicInfo.background}
            onChange={(e) => updateBasicInfo({ background: e.target.value })}
            placeholder="Provide context and background for the project"
            className="mt-1 bg-background border-border min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="drivingQuestion" className="text-foreground">
            Driving Question <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="drivingQuestion"
            value={basicInfo.drivingQuestion}
            onChange={(e) => updateBasicInfo({ drivingQuestion: e.target.value })}
            placeholder="What is the central question students will explore?"
            className={`mt-1 bg-background border-border ${
              validationErrors.drivingQuestion ? 'border-red-500' : ''
            }`}
          />
          {validationErrors.drivingQuestion && (
            <p className="text-xs text-red-400 mt-1">{validationErrors.drivingQuestion}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            A good driving question is open-ended, engaging, and connects to real-world problems
          </p>
        </div>
      </div>
    </div>
  )
}
