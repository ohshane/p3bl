import { create } from 'zustand'
import type { ChatMessage } from '@/types'
import { buildUserContextString } from '@/lib/userContext'
import {
  sendMessage as sendMessageApi,
  getMessages as getMessagesApi,
  sendFloatingBotMessage,
  getFloatingBotMessages,
  getTeamPersonas,
} from '@/server/api'

// OpenRouter API configuration
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const API_BASE = import.meta.env.VITE_API_BASE || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_URL = `${API_BASE}/chat/completions`

// System prompt for the learning assistant
const BASE_SYSTEM_PROMPT = `You are a friendly and supportive Assistant for a project-based learning platform called Peabee. 
Your role is to help students navigate the platform, understand their projects, and provide guidance.

Key responsibilities:
- Help students join projects using join codes or invitation links
- Explain how the platform works (sessions, artifacts, team collaboration)
- Provide encouragement and guidance on their learning journey
- Answer questions clearly and concisely
- Reference the user's specific projects and progress when relevant

Keep responses friendly, concise (2-4 sentences usually), and encouraging. Use simple language appropriate for students.`

// Helper function to call OpenRouter API with user context
async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  // Check if API key is configured
  if (!OPENROUTER_API_KEY) {
    console.error('OpenRouter API key is not configured')
    return "API key is not configured. Please check your environment settings."
  }

  try {
    // Build the system prompt with current user context
    const userContext = buildUserContextString()
    const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${userContext}`
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Peabee Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error response:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again."
  } catch (error) {
    console.error('OpenRouter API error:', error)
    return "I'm having trouble connecting right now. Please try again in a moment."
  }
}

interface ChatState {
  // Messages by team ID
  messagesByTeam: Record<string, ChatMessage[]>
  isLoadingMessages: boolean
  
  // Bot state
  isFloatingBotOpen: boolean
  floatingBotMessages: ChatMessage[]
  hasShownInitialGreeting: boolean
  isBotTyping: boolean
  
  // Actions
  getTeamMessages: (teamId: string) => ChatMessage[]
  fetchTeamMessages: (teamId: string) => Promise<void>
  sendMessage: (teamId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  
  // Floating bot actions
  toggleFloatingBot: () => void
  openFloatingBot: () => void
  closeFloatingBot: () => void
  sendBotMessage: (content: string, userId: string, userName: string) => void
  markInitialGreetingShown: () => void
  loadFloatingBotHistory: (userId: string) => Promise<void>
  
  // AI response generation
  generateAIResponse: (teamId: string, context?: string) => void
  generateBotResponse: (userMessage: string, userId?: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByTeam: {},
  isLoadingMessages: false,
  
  isFloatingBotOpen: false,
  floatingBotMessages: [],
  hasShownInitialGreeting: false,
  isBotTyping: false,
  
  getTeamMessages: (teamId: string) => {
    return get().messagesByTeam[teamId] || []
  },
  
  fetchTeamMessages: async (teamId: string) => {
    set({ isLoadingMessages: true })
    try {
      const result = await getMessagesApi({ teamId, limit: 50 })
      if (result.success && result.messages) {
        // Transform API messages to ChatMessage format
        const messages: ChatMessage[] = result.messages.map(m => ({
          id: m.id,
          teamId,
          senderId: m.sender?.id || 'unknown',
          senderName: m.sender?.name || 'Unknown',
          senderAvatar: m.sender?.avatarUrl || m.sender?.avatar || null,
          senderType: m.sender?.type === 'ai' ? 'ai' : 'user',
          content: m.content,
          timestamp: m.createdAt,
        }))
        
        set(state => ({
          messagesByTeam: {
            ...state.messagesByTeam,
            [teamId]: messages,
          },
          isLoadingMessages: false,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch team messages:', error)
      set({ isLoadingMessages: false })
    }
  },
  
  sendMessage: async (teamId: string, message) => {
    // Optimistically add message to UI
    const tempId = `msg_${Date.now()}`
    const newMessage: ChatMessage = {
      ...message,
      id: tempId,
      timestamp: new Date().toISOString(),
    }
    
    set(state => ({
      messagesByTeam: {
        ...state.messagesByTeam,
        [teamId]: [...(state.messagesByTeam[teamId] || []), newMessage],
      },
    }))
    
    // Send to real API
    try {
      const result = await sendMessageApi({
        teamId,
        userId: message.senderType === 'user' ? message.senderId : undefined,
        personaId: message.senderType === 'ai' ? message.senderId : undefined,
        content: message.content,
        type: 'text',
      })
      
      if (result.success && result.message) {
        // Update with real message ID
        set(state => ({
          messagesByTeam: {
            ...state.messagesByTeam,
            [teamId]: state.messagesByTeam[teamId]?.map(m =>
              m.id === tempId ? { ...m, id: result.message!.id } : m
            ) || [],
          },
        }))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
    
    // Trigger AI response after user message
    if (message.senderType === 'user') {
      setTimeout(() => {
        get().generateAIResponse(teamId)
      }, 1500 + Math.random() * 1000)
    }
  },
  
  toggleFloatingBot: () => {
    set(state => ({ isFloatingBotOpen: !state.isFloatingBotOpen }))
  },
  
  openFloatingBot: () => {
    set({ isFloatingBotOpen: true })
  },
  
  closeFloatingBot: () => {
    set({ isFloatingBotOpen: false })
  },
  
  sendBotMessage: async (content: string, userId: string, userName: string) => {
    const userMessage: ChatMessage = {
      id: `bot_msg_${Date.now()}`,
      teamId: 'bot',
      senderId: userId,
      senderName: userName,
      senderAvatar: null,
      senderType: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    
    set(state => ({
      floatingBotMessages: [...state.floatingBotMessages, userMessage],
    }))
    
    // Store user message in database
    try {
      await sendFloatingBotMessage({ userId, role: 'user', content })
    } catch (error) {
      console.error('Failed to store user message:', error)
    }
    
    // Generate bot response using OpenRouter API
    get().generateBotResponse(content, userId)
  },
  
  markInitialGreetingShown: () => {
    // Add initial greeting message
    const greetingMessage: ChatMessage = {
      id: 'bot_greeting',
      teamId: 'bot',
      senderId: 'assistant',
      senderName: 'Assistant',
      senderAvatar: null,
      senderType: 'ai',
      content: "Hi! I'm here to help you get started. Have a join code or invitation link? I can help you join your first project!",
      timestamp: new Date().toISOString(),
    }
    
    set(state => ({
      hasShownInitialGreeting: true,
      floatingBotMessages: [greetingMessage, ...state.floatingBotMessages],
    }))
  },
  
  loadFloatingBotHistory: async (userId: string) => {
    try {
      const result = await getFloatingBotMessages({ userId, limit: 50 })
      if (result.success && result.messages) {
        const messages: ChatMessage[] = result.messages.map(m => ({
          id: m.id,
          teamId: 'bot',
          senderId: m.role === 'assistant' ? 'assistant' : userId,
          senderName: m.role === 'assistant' ? 'Learning Assistant' : 'You',
          senderAvatar: null,
          senderType: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content,
          timestamp: m.createdAt,
        }))
        
        set({ floatingBotMessages: messages })
      }
    } catch (error) {
      console.error('Failed to load floating bot history:', error)
    }
  },
  
  generateAIResponse: async (teamId: string) => {
    // Get the last user message for context
    const messages = get().messagesByTeam[teamId] || []
    const lastUserMessage = [...messages].reverse().find(m => m.senderType === 'user')
    
    if (!lastUserMessage) return
    
    // Build conversation history for OpenRouter
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.senderType === 'ai' ? 'assistant' : 'user',
      content: msg.content,
    }))
    
    try {
      // Get team personas for context
      const personasResult = await getTeamPersonas({ teamId })
      const personas = personasResult.success ? personasResult.personas : []
      const selectedPersona = personas[0] || { id: 'ai_001', name: 'Professor Sage' }
      
      // Use OpenRouter for real AI response
      const response = await callOpenRouter(conversationHistory)
      
      const aiMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        teamId,
        senderId: selectedPersona.id,
        senderName: selectedPersona.name,
        senderAvatar: null,
        senderType: 'ai',
        content: response,
        timestamp: new Date().toISOString(),
      }
      
      // Add to UI
      set(state => ({
        messagesByTeam: {
          ...state.messagesByTeam,
          [teamId]: [...(state.messagesByTeam[teamId] || []), aiMessage],
        },
      }))
      
      // Store in database
      await sendMessageApi({
        teamId,
        personaId: selectedPersona.id,
        content: response,
        type: 'text',
      })
    } catch (error) {
      console.error('Failed to generate AI response:', error)
    }
  },
  
  generateBotResponse: async (userMessage: string, userId?: string) => {
    // Set typing indicator
    set({ isBotTyping: true })
    
    try {
      // Build conversation history for context
      const messages = get().floatingBotMessages
      const conversationHistory = messages.map(msg => ({
        role: msg.senderType === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      }))
      
      // Add the current user message
      conversationHistory.push({ role: 'user', content: userMessage })
      
      // Call OpenRouter API
      const response = await callOpenRouter(conversationHistory)
      
      const botMessage: ChatMessage = {
        id: `bot_msg_${Date.now()}`,
        teamId: 'bot',
        senderId: 'assistant',
        senderName: 'Assistant',
        senderAvatar: null,
        senderType: 'ai',
        content: response,
        timestamp: new Date().toISOString(),
      }
      
      set(state => ({
        floatingBotMessages: [...state.floatingBotMessages, botMessage],
        isBotTyping: false,
      }))
      
      // Store assistant response in database
      if (userId) {
        try {
          await sendFloatingBotMessage({ userId, role: 'assistant', content: response })
        } catch (error) {
          console.error('Failed to store assistant message:', error)
        }
      }
    } catch (error) {
      console.error('Error generating bot response:', error)
      
      const errorMessage: ChatMessage = {
        id: `bot_msg_${Date.now()}`,
        teamId: 'bot',
        senderId: 'assistant',
        senderName: 'Assistant',
        senderAvatar: null,
        senderType: 'ai',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      
      set(state => ({
        floatingBotMessages: [...state.floatingBotMessages, errorMessage],
        isBotTyping: false,
      }))
    }
  },
}))
