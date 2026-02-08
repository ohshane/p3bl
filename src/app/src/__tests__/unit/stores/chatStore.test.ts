/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useChatStore } from '@/stores/chatStore'
import { act, renderHook } from '@testing-library/react'

// Mock the server API functions
vi.mock('@/server/api', () => ({
  getOrCreateRoom: vi.fn().mockResolvedValue({ success: true, room: { id: 'room_001', projectId: 'project_001', name: 'Test Room' } }),
  sendMessage: vi.fn().mockResolvedValue({ success: true, message: { id: 'msg_real_001' } }),
  getMessages: vi.fn().mockResolvedValue({ success: true, messages: [] }),
  sendFloatingBotMessage: vi.fn().mockResolvedValue({ success: true }),
  getFloatingBotMessages: vi.fn().mockResolvedValue({ success: true, messages: [] }),
  getTeamPersonas: vi.fn().mockResolvedValue({ success: true, personas: [{ id: 'ai_001', name: 'Professor Sage' }] }),
}))

// Mock the AI config
vi.mock('@/lib/ai-config', () => ({
  getConfiguredAIModel: vi.fn().mockResolvedValue('test-model'),
}))

// Mock the user context
vi.mock('@/lib/userContext', () => ({
  buildUserContextString: vi.fn().mockReturnValue('Test user context'),
}))

// Mock fetch for OpenRouter API
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({
    choices: [{ message: { content: 'AI response' } }],
  }),
}) as any

describe('Chat Store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset the store before each test
    useChatStore.setState({
      roomsByProject: {},
      messagesByRoom: {
        room_001: [
          {
            id: 'msg_001',
            roomId: 'room_001',
            senderId: 'user_001',
            senderName: 'Test User',
            senderAvatar: null,
            senderType: 'user',
            content: 'Hello everyone!',
            timestamp: '2024-01-01T10:00:00Z',
          },
          {
            id: 'msg_002',
            roomId: 'room_001',
            senderId: 'ai_001',
            senderName: 'Professor Sage',
            senderAvatar: null,
            senderType: 'ai',
            content: 'Welcome! How can I help you today?',
            timestamp: '2024-01-01T10:01:00Z',
          },
        ],
      },
      isLoadingRoom: false,
      isLoadingMessages: false,
      isFloatingBotOpen: false,
      floatingBotMessages: [],
      hasShownInitialGreeting: false,
      isBotTyping: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Room Messages', () => {
    it('should get messages for a room', () => {
      const { result } = renderHook(() => useChatStore())

      const messages = result.current.getRoomMessages('room_001')
      expect(messages.length).toBe(2)
      expect(messages[0].content).toBe('Hello everyone!')
    })

    it('should return empty array for room without messages', () => {
      const { result } = renderHook(() => useChatStore())

      const messages = result.current.getRoomMessages('room_nonexistent')
      expect(messages).toEqual([])
    })

    it('should send a message', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendMessage('room_001', {
          roomId: 'room_001',
          senderId: 'user_002',
          senderName: 'Another User',
          senderAvatar: null,
          senderType: 'user',
          content: 'New message here',
        })
      })

      const messages = result.current.getRoomMessages('room_001')
      expect(messages.length).toBe(3)
      expect(messages[2].content).toBe('New message here')
      expect(messages[2].id).toBeDefined()
      expect(messages[2].timestamp).toBeDefined()
    })

    it('should create new room message list if not exists', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendMessage('room_new', {
          roomId: 'room_new',
          senderId: 'user_001',
          senderName: 'Test User',
          senderAvatar: null,
          senderType: 'user',
          content: 'First message in new room',
        })
      })

      const messages = result.current.getRoomMessages('room_new')
      expect(messages.length).toBe(1)
    })

    it('should trigger AI response after user message', async () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendMessage('room_001', {
          roomId: 'room_001',
          senderId: 'user_001',
          senderName: 'Test User',
          senderAvatar: null,
          senderType: 'user',
          content: 'How do I do this?',
        })
      })

      // Fast forward time to trigger AI response
      await act(async () => {
        vi.advanceTimersByTime(3000)
        await vi.runAllTimersAsync()
      })

      const messages = result.current.getRoomMessages('room_001')
      // Should have original 2 + user message + AI response
      expect(messages.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Floating Bot', () => {
    it('should toggle floating bot', () => {
      const { result } = renderHook(() => useChatStore())

      expect(result.current.isFloatingBotOpen).toBe(false)

      act(() => {
        result.current.toggleFloatingBot()
      })

      expect(result.current.isFloatingBotOpen).toBe(true)

      act(() => {
        result.current.toggleFloatingBot()
      })

      expect(result.current.isFloatingBotOpen).toBe(false)
    })

    it('should open floating bot', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.openFloatingBot()
      })

      expect(result.current.isFloatingBotOpen).toBe(true)
    })

    it('should close floating bot', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.openFloatingBot()
      })

      act(() => {
        result.current.closeFloatingBot()
      })

      expect(result.current.isFloatingBotOpen).toBe(false)
    })

    it('should send bot message', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendBotMessage('How do I join a project?', 'user_001', 'Test User')
      })

      expect(result.current.floatingBotMessages.length).toBe(1)
      expect(result.current.floatingBotMessages[0].content).toBe('How do I join a project?')
      expect(result.current.floatingBotMessages[0].senderType).toBe('user')
    })

    it('should mark initial greeting as shown', () => {
      const { result } = renderHook(() => useChatStore())

      expect(result.current.hasShownInitialGreeting).toBe(false)

      act(() => {
        result.current.markInitialGreetingShown()
      })

      expect(result.current.hasShownInitialGreeting).toBe(true)
      expect(result.current.floatingBotMessages.length).toBe(1)
      expect(result.current.floatingBotMessages[0].senderType).toBe('ai')
      expect(result.current.floatingBotMessages[0].content).toContain('join')
    })
  })

  describe('AI Response Generation', () => {
    it('should generate AI response for room chat', async () => {
      const { result } = renderHook(() => useChatStore())

      const initialCount = result.current.getRoomMessages('room_001').length

      await act(async () => {
        result.current.generateAIResponse('room_001')
        await vi.runAllTimersAsync()
      })

      const messages = result.current.getRoomMessages('room_001')
      expect(messages.length).toBe(initialCount + 1)
      expect(messages[messages.length - 1].senderType).toBe('ai')
    })

    it('should create new room message list for AI response if not exists', async () => {
      const { result } = renderHook(() => useChatStore())

      // Need to add a user message first since generateAIResponse checks for lastUserMessage
      act(() => {
        result.current.sendMessage('room_new', {
          roomId: 'room_new',
          senderId: 'user_001',
          senderName: 'Test User',
          senderAvatar: null,
          senderType: 'user',
          content: 'Test message',
        })
      })

      await act(async () => {
        result.current.generateAIResponse('room_new')
        await vi.runAllTimersAsync()
      })

      const messages = result.current.getRoomMessages('room_new')
      expect(messages.length).toBe(2) // user message + AI response
      expect(messages[messages.length - 1].senderType).toBe('ai')
    })
  })
})
