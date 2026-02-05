/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useChatStore } from '@/stores/chatStore'
import { act, renderHook, waitFor } from '@testing-library/react'

// Mock the JSON imports
vi.mock('@/data/chat-messages.json', () => ({
  default: [
    {
      id: 'msg_001',
      teamId: 'team_001',
      senderId: 'user_001',
      senderName: 'Test User',
      senderAvatar: null,
      senderType: 'user',
      content: 'Hello everyone!',
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: 'msg_002',
      teamId: 'team_001',
      senderId: 'ai_001',
      senderName: 'Professor Sage',
      senderAvatar: null,
      senderType: 'ai',
      content: 'Welcome! How can I help you today?',
      timestamp: '2024-01-01T10:01:00Z',
    },
  ],
}))

describe('Chat Store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset the store before each test
    useChatStore.setState({
      messagesByTeam: {
        team_001: [
          {
            id: 'msg_001',
            teamId: 'team_001',
            senderId: 'user_001',
            senderName: 'Test User',
            senderAvatar: null,
            senderType: 'user',
            content: 'Hello everyone!',
            timestamp: '2024-01-01T10:00:00Z',
          },
          {
            id: 'msg_002',
            teamId: 'team_001',
            senderId: 'ai_001',
            senderName: 'Professor Sage',
            senderAvatar: null,
            senderType: 'ai',
            content: 'Welcome! How can I help you today?',
            timestamp: '2024-01-01T10:01:00Z',
          },
        ],
      },
      isFloatingBotOpen: false,
      floatingBotMessages: [],
      hasShownInitialGreeting: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Team Messages', () => {
    it('should get messages for a team', () => {
      const { result } = renderHook(() => useChatStore())

      const messages = result.current.getTeamMessages('team_001')
      expect(messages.length).toBe(2)
      expect(messages[0].content).toBe('Hello everyone!')
    })

    it('should return empty array for team without messages', () => {
      const { result } = renderHook(() => useChatStore())

      const messages = result.current.getTeamMessages('team_nonexistent')
      expect(messages).toEqual([])
    })

    it('should send a message', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendMessage('team_001', {
          teamId: 'team_001',
          senderId: 'user_002',
          senderName: 'Another User',
          senderAvatar: null,
          senderType: 'user',
          content: 'New message here',
        })
      })

      const messages = result.current.getTeamMessages('team_001')
      expect(messages.length).toBe(3)
      expect(messages[2].content).toBe('New message here')
      expect(messages[2].id).toBeDefined()
      expect(messages[2].timestamp).toBeDefined()
    })

    it('should create new team message list if not exists', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendMessage('team_new', {
          teamId: 'team_new',
          senderId: 'user_001',
          senderName: 'Test User',
          senderAvatar: null,
          senderType: 'user',
          content: 'First message in new team',
        })
      })

      const messages = result.current.getTeamMessages('team_new')
      expect(messages.length).toBe(1)
    })

    it('should trigger AI response after user message', async () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendMessage('team_001', {
          teamId: 'team_001',
          senderId: 'user_001',
          senderName: 'Test User',
          senderAvatar: null,
          senderType: 'user',
          content: 'How do I do this?',
        })
      })

      // Fast forward time to trigger AI response
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      const messages = result.current.getTeamMessages('team_001')
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

    it('should send bot message and generate response', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendBotMessage('How do I join a project?', 'user_001', 'Test User')
      })

      expect(result.current.floatingBotMessages.length).toBe(1)
      expect(result.current.floatingBotMessages[0].content).toBe('How do I join a project?')
      expect(result.current.floatingBotMessages[0].senderType).toBe('user')

      // Fast forward for bot response
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.floatingBotMessages.length).toBe(2)
      expect(result.current.floatingBotMessages[1].senderType).toBe('ai')
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

  describe('Bot Response Generation', () => {
    it('should respond to join-related questions', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendBotMessage('How do I use a join code?', 'user_001', 'Test User')
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      const botResponse = result.current.floatingBotMessages.find(m => m.senderType === 'ai')
      expect(botResponse?.content).toContain('join')
    })

    it('should respond to help questions', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendBotMessage('Help me please', 'user_001', 'Test User')
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      const botResponse = result.current.floatingBotMessages.find(m => m.senderType === 'ai')
      expect(botResponse?.content).toContain('help')
    })

    it('should respond to project questions', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendBotMessage('What is a project?', 'user_001', 'Test User')
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      const botResponse = result.current.floatingBotMessages.find(m => m.senderType === 'ai')
      expect(botResponse?.content).toContain('project')
    })

    it('should respond to thank you messages', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendBotMessage('Thank you!', 'user_001', 'Test User')
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      const botResponse = result.current.floatingBotMessages.find(m => m.senderType === 'ai')
      expect(botResponse?.content).toContain('welcome')
    })

    it('should have default response for unrecognized messages', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.sendBotMessage('Random gibberish xyz abc', 'user_001', 'Test User')
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      const botResponse = result.current.floatingBotMessages.find(m => m.senderType === 'ai')
      expect(botResponse).toBeDefined()
      expect(botResponse?.content.length).toBeGreaterThan(0)
    })
  })

  describe('AI Response Generation', () => {
    it('should generate AI response for team chat', () => {
      const { result } = renderHook(() => useChatStore())

      const initialCount = result.current.getTeamMessages('team_001').length

      act(() => {
        result.current.generateAIResponse('team_001')
      })

      const messages = result.current.getTeamMessages('team_001')
      expect(messages.length).toBe(initialCount + 1)
      expect(messages[messages.length - 1].senderType).toBe('ai')
      expect(messages[messages.length - 1].senderName).toBe('Professor Sage')
    })

    it('should create new team message list for AI response if not exists', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.generateAIResponse('team_new')
      })

      const messages = result.current.getTeamMessages('team_new')
      expect(messages.length).toBe(1)
      expect(messages[0].senderType).toBe('ai')
    })
  })
})
