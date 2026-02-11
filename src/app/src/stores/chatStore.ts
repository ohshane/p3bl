import { create } from 'zustand'
import type { ChatMessage } from '@/types'
import { buildUserContextString } from '@/lib/userContext'
import { getConfiguredAIModel } from '@/lib/ai-config'
import {
  getOrCreateRoom as getOrCreateRoomApi,
  sendMessage as sendMessageApi,
  getMessages as getMessagesApi,
  sendFloatingBotMessage,
  getFloatingBotMessages,
  getTeamPersonas,
} from '@/server/api'
import { aiChatCompletion } from '@/server/api/ai'
import { initWebSocket, joinRoom, leaveRoom, broadcastMessage } from '@/lib/websocket'

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

// Helper function to call AI via server-side proxy
async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const userContext = buildUserContextString()
    const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${userContext}`
    const aiModel = await getConfiguredAIModel()
    
    const result = await aiChatCompletion({
      data: {
        model: aiModel,
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
    })

    if (!result.success) {
      console.error('AI API error:', result.error)
      return "I'm having trouble connecting right now. Please try again in a moment."
    }

    return result.content || "I'm sorry, I couldn't generate a response. Please try again."
  } catch (error) {
    console.error('AI API error:', error)
    return "I'm having trouble connecting right now. Please try again in a moment."
  }
}

interface ChatRoom {
  id: string
  projectId: string
  teamId: string
  name: string
}

interface ChatState {
  // Room management
  roomsByTeam: Record<string, ChatRoom> // teamId -> ChatRoom
  isLoadingRoom: boolean
  
  // Messages by room ID
  messagesByRoom: Record<string, ChatMessage[]>
  isLoadingMessages: boolean
  
  // Bot state
  isFloatingBotOpen: boolean
  floatingBotMessages: ChatMessage[]
  hasShownInitialGreeting: boolean
  isBotTyping: boolean
  
  // Room actions
  getOrCreateRoom: (projectId: string, teamId: string, userId: string, roomName?: string) => Promise<ChatRoom | null>
  getRoomForTeam: (teamId: string) => ChatRoom | null
  
  // Message actions
  getRoomMessages: (roomId: string) => ChatMessage[]
  fetchRoomMessages: (roomId: string) => Promise<void>
  sendMessage: (roomId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  
  // Floating bot actions
  toggleFloatingBot: () => void
  openFloatingBot: () => void
  closeFloatingBot: () => void
  sendBotMessage: (content: string, userId: string, userName: string) => void
  markInitialGreetingShown: () => void
  loadFloatingBotHistory: (userId: string) => Promise<void>
  
  // WebSocket
  subscribeToRoom: (roomId: string) => Promise<void>
  unsubscribeFromRoom: (roomId: string) => void
  receiveMessage: (roomId: string, message: ChatMessage) => void
  
  // AI response generation
  generateAIResponse: (roomId: string, teamId?: string, context?: string) => void
  generateBotResponse: (userMessage: string, userId?: string) => void
}

export const useChatStore = create<ChatState>((set, get) => {
  // Initialize WebSocket and wire incoming messages to the store
  if (typeof window !== 'undefined') {
    initWebSocket((roomId: string, message: ChatMessage) => {
      get().receiveMessage(roomId, message)
    })
  }

  return {
  roomsByTeam: {},
  isLoadingRoom: false,
  
  messagesByRoom: {},
  isLoadingMessages: false,
  
  isFloatingBotOpen: false,
  floatingBotMessages: [],
  hasShownInitialGreeting: false,
  isBotTyping: false,
  
  getOrCreateRoom: async (projectId: string, teamId: string, userId: string, roomName?: string) => {
    // Return cached room if available (and for the same project)
    const cached = get().roomsByTeam[teamId]
    if (cached && cached.projectId === projectId) {
      // Ensure loading state is cleared for cached rooms
      if (get().isLoadingRoom) set({ isLoadingRoom: false })
      return cached
    }
    
    set({ isLoadingRoom: true })
    try {
      const result = await getOrCreateRoomApi({
        data: { projectId, teamId, userId, roomName },
      })
      
      if (result.success && result.room) {
        const room: ChatRoom = {
          id: result.room.id,
          projectId: result.room.projectId,
          teamId: result.room.teamId,
          name: result.room.name,
        }
        
        set(state => ({
          roomsByTeam: {
            ...state.roomsByTeam,
            [teamId]: room,
          },
          isLoadingRoom: false,
        }))
        
        return room
      }
      
      set({ isLoadingRoom: false })
      return null
    } catch (error) {
      console.error('Failed to get or create room:', error)
      set({ isLoadingRoom: false })
      return null
    }
  },
  
  getRoomForTeam: (teamId: string) => {
    return get().roomsByTeam[teamId] || null
  },
  
  getRoomMessages: (roomId: string) => {
    return get().messagesByRoom[roomId] || []
  },
  
  fetchRoomMessages: async (roomId: string) => {
    // Only show loading spinner on initial load (no existing messages)
    const existing = get().messagesByRoom[roomId]
    if (!existing || existing.length === 0) {
      set({ isLoadingMessages: true })
    }
    try {
      const result = await getMessagesApi({ data: { roomId, limit: 50 } })
      if (result.success && result.messages) {
        // Transform API messages to ChatMessage format
        const serverMessages: ChatMessage[] = result.messages.map(m => ({
          id: m.id,
          roomId,
          senderId: m.sender?.id || 'unknown',
          senderName: m.sender?.name || 'Unknown',
          senderAvatar: m.sender?.avatarUrl || m.sender?.avatar || null,
          senderType: m.sender?.type === 'ai' ? 'ai' : 'user',
          content: m.content,
          timestamp: m.createdAt,
        }))
        
        set(state => {
          const currentMessages = state.messagesByRoom[roomId] || []
          // Keep any optimistic messages (temp IDs starting with "msg_") that
          // haven't been confirmed by the server yet
          const serverIds = new Set(serverMessages.map(m => m.id))
          const pendingOptimistic = currentMessages.filter(
            m => m.id.startsWith('msg_') && !serverIds.has(m.id)
          )
          
          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: [...serverMessages, ...pendingOptimistic],
            },
            isLoadingMessages: false,
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch room messages:', error)
      set({ isLoadingMessages: false })
    }
  },
  
  sendMessage: async (roomId: string, message) => {
    // Optimistically add message to UI
    const tempId = `msg_${Date.now()}`
    const newMessage: ChatMessage = {
      ...message,
      id: tempId,
      timestamp: new Date().toISOString(),
    }
    
    set(state => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: [...(state.messagesByRoom[roomId] || []), newMessage],
      },
    }))
    
    // Send to real API
    try {
      const result = await sendMessageApi({
        data: {
          roomId,
          userId: message.senderType === 'user' ? message.senderId : undefined,
          personaId: message.senderType === 'ai' ? message.senderId : undefined,
          content: message.content,
          type: 'text',
        },
      })
      
      if (result.success && result.message) {
        // Update with real message ID
        const confirmedMessage = { ...newMessage, id: result.message!.id }
        set(state => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: state.messagesByRoom[roomId]?.map(m =>
              m.id === tempId ? confirmedMessage : m
            ) || [],
          },
        }))
        // Broadcast to other clients via WebSocket
        broadcastMessage(roomId, confirmedMessage)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  },
  
  subscribeToRoom: async (roomId: string) => {
    const joinedImmediately = await joinRoom(roomId)
    if (!joinedImmediately) {
      // First-time team formation can race with socket establishment.
      // Retry once shortly after timeout to avoid requiring a hard refresh.
      setTimeout(() => {
        joinRoom(roomId)
      }, 2000)
    }
  },
  
  unsubscribeFromRoom: (roomId: string) => {
    leaveRoom(roomId)
  },
  
  receiveMessage: (roomId: string, message: ChatMessage) => {
    set(state => {
      const existing = state.messagesByRoom[roomId] || []
      // Avoid duplicates
      if (existing.some(m => m.id === message.id)) return state
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: [...existing, message],
        },
      }
    })
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
      roomId: 'bot',
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
      await sendFloatingBotMessage({ data: { userId, role: 'user', content } })
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
      roomId: 'bot',
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
      const result = await getFloatingBotMessages({ data: { userId, limit: 50 } })
      if (result.success && result.messages) {
        const messages: ChatMessage[] = result.messages.map(m => ({
          id: m.id,
          roomId: 'bot',
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
  
  generateAIResponse: async (roomId: string, teamId?: string) => {
    // Get the last user message for context
    const messages = get().messagesByRoom[roomId] || []
    const lastUserMessage = [...messages].reverse().find(m => m.senderType === 'user')
    
    if (!lastUserMessage) return
    
    // Build conversation history for OpenRouter
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.senderType === 'ai' ? 'assistant' : 'user',
      content: msg.content,
    }))
    
    try {
      // Get team personas for context (if teamId provided)
      let selectedPersona = { id: 'ai_001', name: 'Professor Sage' }
      if (teamId) {
        const personasResult = await getTeamPersonas({ data: { teamId } })
        const personas = personasResult.success ? personasResult.personas : []
        if (personas[0]) {
          selectedPersona = personas[0]
        }
      }
      
      // Use OpenRouter for real AI response
      const response = await callOpenRouter(conversationHistory)
      
      const aiMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        roomId,
        senderId: selectedPersona.id,
        senderName: selectedPersona.name,
        senderAvatar: null,
        senderType: 'ai',
        content: response,
        timestamp: new Date().toISOString(),
      }
      
      // Add to UI
      set(state => ({
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomId]: [...(state.messagesByRoom[roomId] || []), aiMessage],
        },
      }))
      
      // Store in database
      await sendMessageApi({
        data: {
          roomId,
          personaId: selectedPersona.id,
          content: response,
          type: 'text',
        },
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
        roomId: 'bot',
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
          await sendFloatingBotMessage({ data: { userId, role: 'assistant', content: response } })
        } catch (error) {
          console.error('Failed to store assistant message:', error)
        }
      }
    } catch (error) {
      console.error('Error generating bot response:', error)
      
      const errorMessage: ChatMessage = {
        id: `bot_msg_${Date.now()}`,
        roomId: 'bot',
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
}})
