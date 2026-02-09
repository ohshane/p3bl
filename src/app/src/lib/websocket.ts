import type { ChatMessage } from '@/types'

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (typeof window === 'undefined') return 'ws://localhost:3000/ws/chat'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws/chat`
}

const WS_URL = getWsUrl()

type MessageHandler = (roomId: string, message: ChatMessage) => void

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let messageHandler: MessageHandler | null = null
const joinedRooms = new Set<string>()

// Queue for messages that couldn't be sent while disconnected
const pendingBroadcasts: Array<{ roomId: string; message: ChatMessage }> = []

// Pending waitForConnection resolvers
let connectionWaiters: Array<{ resolve: () => void; reject: (err: Error) => void }> = []

function resolveAllWaiters() {
  const waiters = connectionWaiters
  connectionWaiters = []
  for (const { resolve } of waiters) {
    resolve()
  }
}

function rejectAllWaiters(err: Error) {
  const waiters = connectionWaiters
  connectionWaiters = []
  for (const { reject } of waiters) {
    reject(err)
  }
}

function flushPendingBroadcasts() {
  while (pendingBroadcasts.length > 0) {
    const item = pendingBroadcasts.shift()!
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        roomId: item.roomId,
        payload: item.message,
      }))
    }
  }
}

function connect() {
  if (typeof window === 'undefined') return
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      // Rejoin all rooms on reconnect
      for (const roomId of joinedRooms) {
        ws?.send(JSON.stringify({ type: 'join', roomId }))
      }
      // Flush any queued broadcasts
      flushPendingBroadcasts()
      // Resolve any pending waitForConnection calls
      resolveAllWaiters()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat_message' && data.roomId && data.payload && messageHandler) {
          messageHandler(data.roomId, data.payload as ChatMessage)
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      ws = null
      // Don't reject waiters on close -- they'll be resolved on next successful connect
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws?.close()
    }
  } catch {
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, 3000)
}

/**
 * Returns a Promise that resolves when the WebSocket connection is OPEN.
 * If already open, resolves immediately. If connecting, waits for onopen.
 * If closed, initiates a new connection and waits.
 * Rejects after the specified timeout (default 5s).
 */
export function waitForConnection(timeout = 5000): Promise<void> {
  if (ws?.readyState === WebSocket.OPEN) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Remove this waiter and reject
      connectionWaiters = connectionWaiters.filter(w => w.resolve !== wrappedResolve)
      reject(new Error('WebSocket connection timeout'))
    }, timeout)

    const wrappedResolve = () => {
      clearTimeout(timer)
      resolve()
    }
    const wrappedReject = (err: Error) => {
      clearTimeout(timer)
      reject(err)
    }

    connectionWaiters.push({ resolve: wrappedResolve, reject: wrappedReject })

    // Kick off connection if not already in progress
    connect()
  })
}

export function initWebSocket(onMessage: MessageHandler) {
  messageHandler = onMessage
  connect()
}

/**
 * Join a room, waiting for the WebSocket connection to be ready first.
 * Returns a Promise that resolves once the join message has been sent.
 */
export async function joinRoom(roomId: string): Promise<void> {
  joinedRooms.add(roomId)

  try {
    await waitForConnection()
    // Connection is open -- send the join (it may have already been sent
    // by the onopen handler if this was a fresh connection, but sending
    // a duplicate join is idempotent on the server side)
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join', roomId }))
    }
  } catch {
    // Connection timed out; the room is still in joinedRooms and will be
    // joined automatically on the next successful connect via onopen.
    console.warn(`WebSocket: timed out waiting to join room ${roomId}, will retry on reconnect`)
  }
}

export function leaveRoom(roomId: string) {
  joinedRooms.delete(roomId)
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'leave', roomId }))
  }
}

export function broadcastMessage(roomId: string, message: ChatMessage) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'chat_message',
      roomId,
      payload: message,
    }))
  } else {
    // Queue for delivery when connection reopens
    pendingBroadcasts.push({ roomId, message })
  }
}

export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  joinedRooms.clear()
  pendingBroadcasts.length = 0
  rejectAllWaiters(new Error('WebSocket disconnected'))
  messageHandler = null
  ws?.close()
  ws = null
}
