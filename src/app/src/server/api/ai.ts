import { createServerFn } from '@tanstack/react-start'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const API_BASE = process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_URL = `${API_BASE}/chat/completions`

/**
 * Server-side proxy for OpenRouter chat completions.
 * Keeps the API key on the server — never exposed to the client.
 */
export const aiChatCompletion = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      model: string
      messages: { role: string; content: string }[]
      max_tokens?: number
      temperature?: number
      response_format?: unknown
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!OPENROUTER_API_KEY) {
      return { success: false as const, error: 'AI API key is not configured' }
    }

    try {
      const body: Record<string, unknown> = {
        model: data.model,
        messages: data.messages,
        max_tokens: data.max_tokens ?? 500,
        temperature: data.temperature ?? 0.7,
      }

      if (data.response_format) {
        body.response_format = data.response_format
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenRouter API error:', response.status, errorText)
        return { success: false as const, error: `API error: ${response.status}` }
      }

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content ?? null

      return { success: true as const, content }
    } catch (error) {
      console.error('OpenRouter proxy error:', error)
      return { success: false as const, error: 'Failed to call AI API' }
    }
  })

/**
 * Server-side proxy for listing available OpenRouter models.
 */
export const aiListModels = createServerFn({ method: 'GET' })
  .handler(async () => {
    if (!OPENROUTER_API_KEY) {
      return { success: false as const, error: 'AI API key is not configured' }
    }

    try {
      const response = await fetch(`${API_BASE}/models`, {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
      })

      if (!response.ok) {
        return { success: false as const, error: `API error: ${response.status}` }
      }

      const data = await response.json()
      return { success: true as const, models: data.data || [] }
    } catch (error) {
      console.error('OpenRouter list models error:', error)
      return { success: false as const, error: 'Failed to fetch models' }
    }
  })
